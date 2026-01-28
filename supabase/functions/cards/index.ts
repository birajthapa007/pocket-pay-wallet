// =========================================
// POCKET PAY - CARD OPERATIONS (SIMULATED)
// List, freeze/unfreeze virtual/physical cards
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CardActionBody {
  card_id: string
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

    // GET /cards?action=list - List all cards
    if (req.method === 'GET' && action === 'list') {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('List error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch cards' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mask sensitive data for response
      const maskedCards = cards?.map(card => ({
        id: card.id,
        type: card.type,
        last_four: card.last_four,
        expiry_date: card.expiry_date,
        cardholder_name: card.cardholder_name,
        is_active: card.is_active,
        is_frozen: card.is_frozen,
        created_at: card.created_at
      }))

      return new Response(
        JSON.stringify({ cards: maskedCards || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /cards?action=detail&id=xxx - Get full card details (for viewing)
    if (req.method === 'GET' && action === 'detail') {
      const cardId = url.searchParams.get('id')
      if (!cardId) {
        return new Response(
          JSON.stringify({ error: 'Card ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: card, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .eq('wallet_id', wallet.id)
        .single()

      if (error || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return full details (in production, log this access)
      return new Response(
        JSON.stringify({
          card: {
            id: card.id,
            type: card.type,
            card_number: card.card_number_encrypted, // In production, decrypt
            last_four: card.last_four,
            expiry_date: card.expiry_date,
            cvv: card.cvv_encrypted, // In production, decrypt
            cardholder_name: card.cardholder_name,
            is_active: card.is_active,
            is_frozen: card.is_frozen,
            created_at: card.created_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /cards?action=freeze - Freeze a card
    if (req.method === 'POST' && action === 'freeze') {
      const body: CardActionBody = await req.json()

      if (!body.card_id) {
        return new Response(
          JSON.stringify({ error: 'card_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: card, error } = await supabase
        .from('cards')
        .update({ is_frozen: true })
        .eq('id', body.card_id)
        .eq('wallet_id', wallet.id)
        .select()
        .single()

      if (error || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          card: {
            id: card.id,
            type: card.type,
            last_four: card.last_four,
            is_frozen: card.is_frozen
          },
          message: 'Card frozen successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /cards?action=unfreeze - Unfreeze a card
    if (req.method === 'POST' && action === 'unfreeze') {
      const body: CardActionBody = await req.json()

      if (!body.card_id) {
        return new Response(
          JSON.stringify({ error: 'card_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: card, error } = await supabase
        .from('cards')
        .update({ is_frozen: false })
        .eq('id', body.card_id)
        .eq('wallet_id', wallet.id)
        .select()
        .single()

      if (error || !card) {
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          card: {
            id: card.id,
            type: card.type,
            last_four: card.last_four,
            is_frozen: card.is_frozen
          },
          message: 'Card unfrozen successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /cards?action=create - Create new virtual card
    if (req.method === 'POST' && action === 'create') {
      // Generate card details
      const lastFour = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      const cardNumber = `4532${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}${lastFour}`
      const cvv = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
      const expiryDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
      const expiryString = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getFullYear()).slice(-2)}`

      // Get cardholder name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single()

      const { data: card, error } = await supabase
        .from('cards')
        .insert({
          wallet_id: wallet.id,
          type: 'virtual',
          last_four: lastFour,
          card_number_encrypted: cardNumber,
          expiry_date: expiryString,
          cvv_encrypted: cvv,
          cardholder_name: profile?.name?.toUpperCase() || 'CARDHOLDER',
          is_active: true,
          is_frozen: false
        })
        .select()
        .single()

      if (error) {
        console.error('Create card error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create card' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          card: {
            id: card.id,
            type: card.type,
            last_four: card.last_four,
            expiry_date: card.expiry_date,
            cardholder_name: card.cardholder_name,
            is_active: card.is_active,
            is_frozen: card.is_frozen
          },
          message: 'Virtual card created successfully'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Card error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})