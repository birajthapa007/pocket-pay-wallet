// =========================================
// POCKET PAY - BANKING OPERATIONS
// Deposit from bank, Withdraw to bank
// Uses atomic database operations for race condition protection
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { 
  validateAmount, 
  validateBankName, 
  validateEnum,
  validationError,
  VALID_WITHDRAWAL_SPEEDS
} from '../_shared/validation.ts'

// Fee for instant withdrawal (1.5%)
const INSTANT_FEE_PERCENTAGE = 0.015

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

    // Get user's wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /banking?action=deposit - Deposit from bank
    if (req.method === 'POST' && action === 'deposit') {
      const body = await req.json()

      // Validate amount
      const amountValidation = validateAmount(body.amount)
      if (!amountValidation.valid) {
        return validationError(amountValidation.error!, corsHeaders)
      }

      // Validate bank name (optional)
      const bankNameValidation = validateBankName(body.bank_name)
      if (!bankNameValidation.valid) {
        return validationError(bankNameValidation.error!, corsHeaders)
      }

      const amount = amountValidation.value
      const bankName = bankNameValidation.value
      const description = bankName ? `Deposit from ${bankName}` : 'Bank deposit'

      // Create deposit transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'deposit',
          sender_wallet_id: wallet.id,
          recipient_wallet_id: wallet.id,
          amount,
          description,
          status: 'completed'
        })
        .select()
        .single()

      if (txError) {
        console.error('Transaction error:', txError)
        return new Response(
          JSON.stringify({ error: 'Failed to create deposit' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Credit wallet using atomic function
      const { data: creditResult, error: creditError } = await supabase.rpc('atomic_credit_balance', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_transaction_id: transaction.id,
        p_description: description
      })

      if (creditError) {
        console.error('Credit error:', creditError)
        return new Response(
          JSON.stringify({ error: 'Failed to credit wallet' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          transaction,
          message: 'Deposit successful',
          amount
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /banking?action=withdraw - Withdraw to bank
    if (req.method === 'POST' && action === 'withdraw') {
      const body = await req.json()

      // Validate amount
      const amountValidation = validateAmount(body.amount)
      if (!amountValidation.valid) {
        return validationError(amountValidation.error!, corsHeaders)
      }

      // Validate speed
      const speedValidation = validateEnum(body.speed, VALID_WITHDRAWAL_SPEEDS, 'speed')
      if (!speedValidation.valid || !speedValidation.value) {
        return validationError(speedValidation.error || 'Speed is required (standard or instant)', corsHeaders)
      }

      // Validate bank name (optional)
      const bankNameValidation = validateBankName(body.bank_name)
      if (!bankNameValidation.valid) {
        return validationError(bankNameValidation.error!, corsHeaders)
      }

      const amount = amountValidation.value
      const speed = speedValidation.value
      const bankName = bankNameValidation.value

      // Calculate fee for instant
      const fee = speed === 'instant' ? Math.round(amount * INSTANT_FEE_PERCENTAGE * 100) / 100 : 0
      const totalDebit = amount + fee

      // Determine status based on speed
      const status = speed === 'instant' ? 'completed' : 'pending_confirmation'
      const estimatedArrival = speed === 'instant' ? 'Instant' : '1-3 business days'
      const description = bankName 
        ? `${speed === 'instant' ? 'Instant ' : ''}Withdrawal to ${bankName}` 
        : `${speed === 'instant' ? 'Instant ' : ''}Bank withdrawal`

      // Create withdrawal transaction first
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'withdrawal',
          sender_wallet_id: wallet.id,
          recipient_wallet_id: wallet.id,
          amount,
          description,
          status
        })
        .select()
        .single()

      if (txError) {
        console.error('Transaction error:', txError)
        return new Response(
          JSON.stringify({ error: 'Failed to create withdrawal' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Debit wallet atomically (includes balance check with row locking)
      const { data: debitResult, error: debitError } = await supabase.rpc('atomic_debit_balance', {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_transaction_id: transaction.id,
        p_description: 'Withdrawal to bank'
      })

      if (debitError) {
        console.error('Debit error:', debitError)
        // Rollback transaction
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id)
        return new Response(
          JSON.stringify({ error: 'Failed to process withdrawal' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if debit was successful
      if (!debitResult?.success) {
        // Rollback transaction
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id)
        return new Response(
          JSON.stringify({ 
            error: debitResult?.error || 'Insufficient funds',
            available: debitResult?.available,
            required: totalDebit
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Debit fee if instant (using atomic function)
      if (fee > 0) {
        await supabase.rpc('atomic_debit_balance', {
          p_wallet_id: wallet.id,
          p_amount: fee,
          p_transaction_id: transaction.id,
          p_description: `Instant withdrawal fee (${INSTANT_FEE_PERCENTAGE * 100}%)`
        })
      }

      return new Response(
        JSON.stringify({
          transaction,
          message: speed === 'instant' ? 'Instant withdrawal complete' : 'Withdrawal initiated',
          amount,
          fee,
          total_debited: totalDebit,
          estimated_arrival: estimatedArrival,
          speed
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Banking error:', error)
    const corsHeaders = getCorsHeaders()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})