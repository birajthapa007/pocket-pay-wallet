// =========================================
// POCKET PAY - BANKING OPERATIONS
// Deposit from bank, Withdraw to bank
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Fee for instant withdrawal (1.5%)
const INSTANT_FEE_PERCENTAGE = 0.015

interface DepositBody {
  amount: number
  bank_name?: string
}

interface WithdrawBody {
  amount: number
  speed: 'standard' | 'instant'
  bank_name?: string
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
      const body: DepositBody = await req.json()

      if (!body.amount || body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be positive' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create deposit transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'deposit',
          sender_wallet_id: wallet.id, // For RLS - user owns this
          recipient_wallet_id: wallet.id,
          amount: body.amount,
          description: body.bank_name ? `Deposit from ${body.bank_name}` : 'Bank deposit',
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

      // Credit wallet
      await supabase.from('ledger_entries').insert({
        wallet_id: wallet.id,
        amount: body.amount,
        reference_transaction_id: transaction.id,
        description: body.bank_name ? `Deposit from ${body.bank_name}` : 'Bank deposit'
      })

      return new Response(
        JSON.stringify({
          transaction,
          message: 'Deposit successful',
          amount: body.amount
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /banking?action=withdraw - Withdraw to bank
    if (req.method === 'POST' && action === 'withdraw') {
      const body: WithdrawBody = await req.json()

      if (!body.amount || body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be positive' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!['standard', 'instant'].includes(body.speed)) {
        return new Response(
          JSON.stringify({ error: 'Speed must be standard or instant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate fee for instant
      const fee = body.speed === 'instant' ? Math.round(body.amount * INSTANT_FEE_PERCENTAGE * 100) / 100 : 0
      const totalDebit = body.amount + fee

      // Check balance
      const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: wallet.id })
      if (Number(balance) < totalDebit) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient funds', 
            available: Number(balance),
            required: totalDebit
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Determine status based on speed
      const status = body.speed === 'instant' ? 'completed' : 'pending_confirmation'
      const estimatedArrival = body.speed === 'instant' 
        ? 'Instant' 
        : '1-3 business days'

      // Create withdrawal transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'withdrawal',
          sender_wallet_id: wallet.id,
          recipient_wallet_id: wallet.id, // For RLS
          amount: body.amount,
          description: body.bank_name 
            ? `${body.speed === 'instant' ? 'Instant ' : ''}Withdrawal to ${body.bank_name}` 
            : `${body.speed === 'instant' ? 'Instant ' : ''}Bank withdrawal`,
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

      // Debit wallet
      await supabase.from('ledger_entries').insert({
        wallet_id: wallet.id,
        amount: -body.amount,
        reference_transaction_id: transaction.id,
        description: `Withdrawal to bank`
      })

      // Debit fee if instant
      if (fee > 0) {
        await supabase.from('ledger_entries').insert({
          wallet_id: wallet.id,
          amount: -fee,
          reference_transaction_id: transaction.id,
          description: `Instant withdrawal fee (${INSTANT_FEE_PERCENTAGE * 100}%)`
        })
      }

      return new Response(
        JSON.stringify({
          transaction,
          message: body.speed === 'instant' ? 'Instant withdrawal complete' : 'Withdrawal initiated',
          amount: body.amount,
          fee,
          total_debited: totalDebit,
          estimated_arrival: estimatedArrival,
          speed: body.speed
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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
