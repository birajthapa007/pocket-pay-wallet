// =========================================
// POCKET PAY - MONEY REQUEST OPERATIONS
// Create, accept, decline money requests
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CreateRequestBody {
  requested_from_wallet_id: string
  amount: number
  note?: string
}

interface RequestActionBody {
  request_id: string
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

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
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

    // POST /requests?action=create - Create money request
    if (req.method === 'POST' && action === 'create') {
      const body: CreateRequestBody = await req.json()

      if (!body.requested_from_wallet_id || !body.amount) {
        return new Response(
          JSON.stringify({ error: 'requested_from_wallet_id and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (body.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Amount must be positive' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get requester's wallet
      const { data: requesterWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!requesterWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check target exists
      const { data: targetWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('id', body.requested_from_wallet_id)
        .single()

      if (!targetWallet) {
        return new Response(
          JSON.stringify({ error: 'Target user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Can't request from yourself
      if (requesterWallet.id === targetWallet.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot request money from yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create the request
      const { data: request, error: insertError } = await supabase
        .from('money_requests')
        .insert({
          requester_wallet_id: requesterWallet.id,
          requested_from_wallet_id: body.requested_from_wallet_id,
          amount: body.amount,
          note: body.note || null,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          request,
          message: 'Money request created successfully'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /requests?action=accept - Accept money request (pay it)
    if (req.method === 'POST' && action === 'accept') {
      const body: RequestActionBody = await req.json()

      if (!body.request_id) {
        return new Response(
          JSON.stringify({ error: 'request_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user's wallet (they are the one paying)
      const { data: payerWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!payerWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the request (must be to this user)
      const { data: request } = await supabase
        .from('money_requests')
        .select('*')
        .eq('id', body.request_id)
        .eq('requested_from_wallet_id', payerWallet.id)
        .eq('status', 'pending')
        .single()

      if (!request) {
        return new Response(
          JSON.stringify({ error: 'Request not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check balance
      const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: payerWallet.id })
      if (Number(balance) < request.amount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient funds', available: Number(balance) }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create the transfer transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'send',
          sender_wallet_id: payerWallet.id,
          recipient_wallet_id: request.requester_wallet_id,
          amount: request.amount,
          description: request.note || 'Payment for request',
          status: 'completed'
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

      // Create ledger entries
      // Debit payer
      await supabase.from('ledger_entries').insert({
        wallet_id: payerWallet.id,
        amount: -request.amount,
        reference_transaction_id: transaction.id,
        description: `Paid request: ${request.note || 'Payment'}`
      })

      // Credit requester
      await supabase.from('ledger_entries').insert({
        wallet_id: request.requester_wallet_id,
        amount: request.amount,
        reference_transaction_id: transaction.id,
        description: `Received from request: ${request.note || 'Payment'}`
      })

      // Create receive transaction for requester's history
      await supabase.from('transactions').insert({
        type: 'receive',
        sender_wallet_id: payerWallet.id,
        recipient_wallet_id: request.requester_wallet_id,
        amount: request.amount,
        description: request.note || 'Payment for request',
        status: 'completed'
      })

      // Update request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('money_requests')
        .update({
          status: 'accepted',
          transaction_id: transaction.id
        })
        .eq('id', request.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
      }

      return new Response(
        JSON.stringify({
          request: updatedRequest,
          transaction,
          message: 'Request accepted and paid'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /requests?action=decline - Decline money request
    if (req.method === 'POST' && action === 'decline') {
      const body: RequestActionBody = await req.json()

      if (!body.request_id) {
        return new Response(
          JSON.stringify({ error: 'request_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: payerWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!payerWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: request, error } = await supabase
        .from('money_requests')
        .update({ status: 'declined' })
        .eq('id', body.request_id)
        .eq('requested_from_wallet_id', payerWallet.id)
        .eq('status', 'pending')
        .select()
        .single()

      if (error || !request) {
        return new Response(
          JSON.stringify({ error: 'Request not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          request,
          message: 'Request declined'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /requests?action=cancel - Cancel own request
    if (req.method === 'POST' && action === 'cancel') {
      const body: RequestActionBody = await req.json()

      if (!body.request_id) {
        return new Response(
          JSON.stringify({ error: 'request_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: requesterWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!requesterWallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: request, error } = await supabase
        .from('money_requests')
        .update({ status: 'cancelled' })
        .eq('id', body.request_id)
        .eq('requester_wallet_id', requesterWallet.id)
        .eq('status', 'pending')
        .select()
        .single()

      if (error || !request) {
        return new Response(
          JSON.stringify({ error: 'Request not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          request,
          message: 'Request cancelled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /requests?action=list - List requests
    if (req.method === 'GET' && action === 'list') {
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

      // Get incoming requests (to pay)
      const { data: incoming } = await supabase
        .from('money_requests')
        .select('*')
        .eq('requested_from_wallet_id', wallet.id)
        .order('created_at', { ascending: false })

      // Get outgoing requests (sent by me)
      const { data: outgoing } = await supabase
        .from('money_requests')
        .select('*')
        .eq('requester_wallet_id', wallet.id)
        .order('created_at', { ascending: false })

      return new Response(
        JSON.stringify({
          incoming: incoming || [],
          outgoing: outgoing || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})