// =========================================
// POCKET PAY - TRANSFER OPERATIONS
// Send money, confirm risky transfers, process payments
// Ledger-based, intent-driven architecture
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface TransferRequest {
  recipient_wallet_id: string
  amount: number
  description: string
}

interface ConfirmRequest {
  transaction_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
      const body: TransferRequest = await req.json()

      // Validate input
      if (!body.recipient_wallet_id || !body.amount || !body.description) {
        return new Response(
          JSON.stringify({ error: 'recipient_wallet_id, amount, and description are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be positive' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
        .eq('id', body.recipient_wallet_id)
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

      // Check balance
      const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: senderWallet.id })
      if (Number(balance) < body.amount) {
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

      if (body.amount > largeThreshold) {
        isRisky = true
        riskReason = `Large transfer over $${largeThreshold}`
      }

      // Rule 2: Check if recipient is new (never sent to before)
      if (!isRisky) {
        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('sender_wallet_id', senderWallet.id)
          .eq('recipient_wallet_id', body.recipient_wallet_id)
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
          recipient_wallet_id: body.recipient_wallet_id,
          amount: body.amount,
          description: body.description,
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

      // If not risky, complete immediately
      if (!isRisky) {
        const result = await completeTransfer(supabase, transaction.id, senderWallet.id, body.recipient_wallet_id, body.amount, body.description)
        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get updated transaction
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
      const body: ConfirmRequest = await req.json()

      if (!body.transaction_id) {
        return new Response(
          JSON.stringify({ error: 'transaction_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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

      // Re-check balance
      const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: senderWallet.id })
      if (Number(balance) < transaction.amount) {
        // Mark as failed
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id)

        return new Response(
          JSON.stringify({ error: 'Insufficient funds' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Complete the transfer
      const result = await completeTransfer(
        supabase,
        transaction.id,
        senderWallet.id,
        transaction.recipient_wallet_id,
        transaction.amount,
        transaction.description
      )

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get updated transaction
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
      const body: ConfirmRequest = await req.json()

      if (!body.transaction_id) {
        return new Response(
          JSON.stringify({ error: 'transaction_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      if (!transactionId) {
        return new Response(
          JSON.stringify({ error: 'Transaction ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper: Complete a transfer (create ledger entries)
async function completeTransfer(
  supabase: any,
  transactionId: string,
  senderWalletId: string,
  recipientWalletId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create debit entry for sender
    const { error: debitError } = await supabase
      .from('ledger_entries')
      .insert({
        wallet_id: senderWalletId,
        amount: -amount, // negative = debit
        reference_transaction_id: transactionId,
        description: `Sent: ${description}`
      })

    if (debitError) {
      console.error('Debit error:', debitError)
      return { success: false, error: 'Failed to debit sender' }
    }

    // Create credit entry for recipient
    const { error: creditError } = await supabase
      .from('ledger_entries')
      .insert({
        wallet_id: recipientWalletId,
        amount: amount, // positive = credit
        reference_transaction_id: transactionId,
        description: `Received: ${description}`
      })

    if (creditError) {
      console.error('Credit error:', creditError)
      // In production, you'd need to reverse the debit here
      return { success: false, error: 'Failed to credit recipient' }
    }

    // Update transaction status to completed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Failed to update transaction status' }
    }

    // Create receive transaction for recipient's history
    await supabase
      .from('transactions')
      .insert({
        type: 'receive',
        sender_wallet_id: senderWalletId,
        recipient_wallet_id: recipientWalletId,
        amount: amount,
        description: description,
        status: 'completed'
      })

    return { success: true }
  } catch (error) {
    console.error('Complete transfer error:', error)
    return { success: false, error: 'Internal error completing transfer' }
  }
}