// =========================================
// POCKET PAY - WALLET OPERATIONS
// Get balance, wallet summary, user lookup
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Create client with user's auth token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: authError } = await supabaseUser.auth.getClaims(token)
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub as string

    // Admin client for queries
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // GET /wallet?action=balance - Get wallet balance
    if (req.method === 'GET' && action === 'balance') {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (walletError || !wallet) {
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate available balance from ledger
      const { data: available } = await supabase.rpc('get_wallet_balance', { p_wallet_id: wallet.id })
      
      // Calculate pending (outgoing pending_confirmation transactions)
      const { data: pending } = await supabase.rpc('get_pending_balance', { p_wallet_id: wallet.id })

      const availableBalance = Number(available) || 0
      const pendingBalance = Number(pending) || 0

      return new Response(
        JSON.stringify({
          available: availableBalance,
          pending: pendingBalance,
          total: availableBalance + pendingBalance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /wallet?action=summary - Get wallet summary with recent transactions
    if (req.method === 'GET' && action === 'summary') {
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

      // Get balance
      const { data: available } = await supabase.rpc('get_wallet_balance', { p_wallet_id: wallet.id })
      const { data: pending } = await supabase.rpc('get_pending_balance', { p_wallet_id: wallet.id })

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Get cards
      const { data: cards } = await supabase
        .from('cards')
        .select('*')
        .eq('wallet_id', wallet.id)

      return new Response(
        JSON.stringify({
          balance: {
            available: Number(available) || 0,
            pending: Number(pending) || 0,
            total: (Number(available) || 0) + (Number(pending) || 0)
          },
          profile,
          transactions: transactions || [],
          cards: cards || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /wallet?action=lookup&username=xxx - Find user by username
    if (req.method === 'GET' && action === 'lookup') {
      const username = url.searchParams.get('username')
      if (!username) {
        return new Response(
          JSON.stringify({ error: 'Username required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .ilike('username', username)
        .single()

      if (!profile) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get their wallet ID
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      return new Response(
        JSON.stringify({
          user: {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatar_url
          },
          wallet_id: wallet?.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /wallet?action=contacts - Get all users for contact list
    if (req.method === 'GET' && action === 'contacts') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .neq('id', userId)
        .order('name')
        .limit(50)

      return new Response(
        JSON.stringify({ contacts: profiles || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Wallet error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})