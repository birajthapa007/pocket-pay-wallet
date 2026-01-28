// =========================================
// POCKET PAY - MONEY REQUEST OPERATIONS
// Create, accept, decline money requests
// Uses atomic operations for payment processing
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { 
  isValidUUID,
  validateAmount, 
  validateNote,
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

    // POST /requests?action=create - Create money request
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json()

      // Validate requested_from_wallet_id
      if (!isValidUUID(body.requested_from_wallet_id)) {
        return validationError('Invalid wallet ID format', corsHeaders)
      }

      // Validate amount
      const amountValidation = validateAmount(body.amount)
      if (!amountValidation.valid) {
        return validationError(amountValidation.error!, corsHeaders)
      }

      // Validate note (optional)
      const noteValidation = validateNote(body.note)
      if (!noteValidation.valid) {
        return validationError(noteValidation.error!, corsHeaders)
      }

      const requestedFromWalletId = body.requested_from_wallet_id
      const amount = amountValidation.value
      const note = noteValidation.value

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
        .eq('id', requestedFromWalletId)
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
          requested_from_wallet_id: requestedFromWalletId,
          amount,
          note,
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
      const body = await req.json()

      if (!isValidUUID(body.request_id)) {
        return validationError('Invalid request ID format', corsHeaders)
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

      // Create the transfer transaction first
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'send',
          sender_wallet_id: payerWallet.id,
          recipient_wallet_id: request.requester_wallet_id,
          amount: request.amount,
          description: request.note || 'Payment for request',
          status: 'created'
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

      // Process transfer atomically
      const { data: transferResult, error: transferError } = await supabase.rpc('atomic_transfer', {
        p_sender_wallet_id: payerWallet.id,
        p_recipient_wallet_id: request.requester_wallet_id,
        p_amount: request.amount,
        p_transaction_id: transaction.id,
        p_description: request.note || 'Payment for request'
      })

      if (transferError || !transferResult?.success) {
        // Mark transaction as failed
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id)
        return new Response(
          JSON.stringify({ 
            error: transferResult?.error || 'Insufficient funds', 
            available: transferResult?.available 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update transaction to completed
      await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id)

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
      const body = await req.json()

      if (!isValidUUID(body.request_id)) {
        return validationError('Invalid request ID format', corsHeaders)
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
      const body = await req.json()

      if (!isValidUUID(body.request_id)) {
        return validationError('Invalid request ID format', corsHeaders)
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

      // Enrich incoming requests with requester profile
      const enrichedIncoming = await Promise.all(
        (incoming || []).map(async (req) => {
          const { data: requesterWallet } = await supabase
            .from('wallets')
            .select('user_id')
            .eq('id', req.requester_wallet_id)
            .single()
          
          if (requesterWallet) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, username, avatar_url')
              .eq('id', requesterWallet.user_id)
              .single()
            
            return { ...req, requester: profile }
          }
          return req
        })
      )

      // Enrich outgoing requests with requestedFrom profile
      const enrichedOutgoing = await Promise.all(
        (outgoing || []).map(async (req) => {
          const { data: targetWallet } = await supabase
            .from('wallets')
            .select('user_id')
            .eq('id', req.requested_from_wallet_id)
            .single()
          
          if (targetWallet) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, username, avatar_url')
              .eq('id', targetWallet.user_id)
              .single()
            
            return { ...req, requested_from: profile }
          }
          return req
        })
      )

      return new Response(
        JSON.stringify({
          incoming: enrichedIncoming,
          outgoing: enrichedOutgoing
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
    const corsHeaders = getCorsHeaders()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})