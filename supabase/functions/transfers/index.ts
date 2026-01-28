// =========================================
// POCKET PAY - TRANSFER OPERATIONS
// Send money, confirm risky transfers, process payments
// Ledger-based, intent-driven architecture with atomic operations
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { 
  isValidUUID,
  validateAmount, 
  validateDescription,
  validationError
} from '../_shared/validation.ts'

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(requestOrigin)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(requestOrigin)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: authError } = await supabaseUser.auth.getClaims(token)
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // POST /transfers?action=send - Create payment intent
    if (req.method === 'POST' && action === 'send') {
      const body = await req.json()

      // Validate recipient_wallet_id
      if (!isValidUUID(body.recipient_wallet_id)) {
        return validationError('Invalid recipient wallet ID format', corsHeaders)
      }

      // Validate amount
      const amountValidation = validateAmount(body.amount)
      if (!amountValidation.valid) {
        return validationError(amountValidation.error!, corsHeaders)
      }

      // Validate description
      const descriptionValidation = validateDescription(body.description)
      if (!descriptionValidation.valid) {
        return validationError(descriptionValidation.error!, corsHeaders)
      }

      const recipientWalletId = body.recipient_wallet_id
      const amount = amountValidation.value
      const description = descriptionValidation.value

      // Get sender's wallet
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!senderWallet) {
        return new Response(
          JSON.stringify({ error: 'Sender wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check recipient exists
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('id, user_id')
        .eq('id', recipientWalletId)
        .single()

      if (!recipientWallet) {
        return new Response(
          JSON.stringify({ error: 'Recipient not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Can't send to yourself
      if (senderWallet.id === recipientWallet.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot send money to yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check balance first (will be re-checked atomically during transfer)
      const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: senderWallet.id })
      if (Number(balance) < amount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient funds', available: Number(balance) }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // === RISK ASSESSMENT ===
      let isRisky = false
      let riskReason: string | null = null

      // Rule 1: Large transfer threshold
      const { data: thresholdSetting } = await supabase
        .from('risk_settings')
        .select('setting_value')
        .eq('setting_key', 'large_transfer_threshold')
        .single()

      const largeThreshold = Number(thresholdSetting?.setting_value) || 500

      if (amount > largeThreshold) {
        isRisky = true
        riskReason = `Large transfer over $${largeThreshold}`
      }

      // Rule 2: Check if recipient is new (never sent to before)
      if (!isRisky) {
        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('sender_wallet_id', senderWallet.id)
          .eq('recipient_wallet_id', recipientWalletId)
          .eq('status', 'completed')

        if (count === 0) {
          isRisky = true
          riskReason = 'First transfer to this recipient'
        }
      }

      // Rule 3: Rapid transfers (too many in short window)
      if (!isRisky) {
        const { data: rapidSettings } = await supabase
          .from('risk_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['rapid_transfer_count', 'rapid_transfer_window_minutes'])

        const rapidCount = Number(rapidSettings?.find(s => s.setting_key === 'rapid_transfer_count')?.setting_value) || 5
        const rapidWindow = Number(rapidSettings?.find(s => s.setting_key === 'rapid_transfer_window_minutes')?.setting_value) || 60

        const windowStart = new Date(Date.now() - rapidWindow * 60 * 1000).toISOString()

        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('sender_wallet_id', senderWallet.id)
          .gte('created_at', windowStart)

        if ((count || 0) >= rapidCount) {
          isRisky = true
          riskReason = `Multiple transfers in ${rapidWindow} minutes`
        }
      }

      // Determine initial status
      const initialStatus = isRisky ? 'pending_confirmation' : 'created'

      // Create transaction record (payment intent)
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'send',
          sender_wallet_id: senderWallet.id,
          recipient_wallet_id: recipientWalletId,
          amount,
          description,
          status: initialStatus,
          is_risky: isRisky,
          risk_reason: riskReason
        })
        .select()
        .single()

      if (txError) {
        console.error('Transaction error:', txError)
        return new Response(
          JSON.stringify({ error: 'Failed to create transaction' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If not risky, complete immediately using atomic transfer
      if (!isRisky) {
        const { data: transferResult, error: transferError } = await supabase.rpc('atomic_transfer', {
          p_sender_wallet_id: senderWallet.id,
          p_recipient_wallet_id: recipientWalletId,
          p_amount: amount,
          p_transaction_id: transaction.id,
          p_description: description
        })

        if (transferError || !transferResult?.success) {
          // Update transaction to failed
          await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id)
          return new Response(
            JSON.stringify({ 
              error: transferResult?.error || 'Failed to complete transfer',
              available: transferResult?.available
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update transaction to completed
        await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id)

        const { data: updatedTx } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transaction.id)
          .single()

        return new Response(
          JSON.stringify({
            transaction: updatedTx,
            status: 'completed',
            message: 'Transfer completed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return pending for confirmation
      return new Response(
        JSON.stringify({
          transaction,
          status: 'pending_confirmation',
          message: 'Transfer requires confirmation',
          risk_reason: riskReason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /transfers?action=confirm - Confirm risky transfer
    if (req.method === 'POST' && action === 'confirm') {
      const body = await req.json()

      if (!isValidUUID(body.transaction_id)) {
        return validationError('Invalid transaction ID format', corsHeaders)
      }

      // Get sender's wallet
      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!senderWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get transaction
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', body.transaction_id)
        .eq('sender_wallet_id', senderWallet.id)
        .eq('status', 'pending_confirmation')
        .single()

      if (!transaction) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Complete the transfer atomically
      const { data: transferResult, error: transferError } = await supabase.rpc('atomic_transfer', {
        p_sender_wallet_id: senderWallet.id,
        p_recipient_wallet_id: transaction.recipient_wallet_id,
        p_amount: transaction.amount,
        p_transaction_id: transaction.id,
        p_description: transaction.description
      })

      if (transferError || !transferResult?.success) {
        // Mark as failed
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id)
        return new Response(
          JSON.stringify({ 
            error: transferResult?.error || 'Insufficient funds',
            available: transferResult?.available
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update transaction status
      await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id)

      const { data: updatedTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transaction.id)
        .single()

      return new Response(
        JSON.stringify({
          transaction: updatedTx,
          status: 'completed',
          message: 'Transfer confirmed and completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /transfers?action=cancel - Cancel pending transfer
    if (req.method === 'POST' && action === 'cancel') {
      const body = await req.json()

      if (!isValidUUID(body.transaction_id)) {
        return validationError('Invalid transaction ID format', corsHeaders)
      }

      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!senderWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update to failed/cancelled
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', body.transaction_id)
        .eq('sender_wallet_id', senderWallet.id)
        .in('status', ['created', 'pending_confirmation'])
        .select()
        .single()

      if (error || !transaction) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          transaction,
          status: 'cancelled',
          message: 'Transfer cancelled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /transfers?action=status&id=xxx - Get transfer status
    if (req.method === 'GET' && action === 'status') {
      const transactionId = url.searchParams.get('id')
      
      if (!isValidUUID(transactionId)) {
        return validationError('Invalid transaction ID format', corsHeaders)
      }

      const { data: senderWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .or(`sender_wallet_id.eq.${senderWallet?.id},recipient_wallet_id.eq.${senderWallet?.id}`)
        .single()

      if (!transaction) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transfer error:', error)
    const corsHeaders = getCorsHeaders()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})