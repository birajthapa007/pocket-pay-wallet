// =========================================
// POCKET PAY - CARD OPERATIONS (SIMULATED)
// List, freeze/unfreeze virtual/physical cards
// Card data is encrypted at rest using AES-256-GCM
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { isValidUUID, validationError } from '../_shared/validation.ts'
import { encryptData, decryptData } from '../_shared/encryption.ts'

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

      // Mask sensitive data for response - only return non-sensitive info
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
      
      if (!isValidUUID(cardId)) {
        return validationError('Invalid card ID format', corsHeaders)
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

      // Decrypt sensitive card data before returning
      let decryptedCardNumber: string
      let decryptedCvv: string
      
      try {
        decryptedCardNumber = await decryptData(card.card_number_encrypted)
        decryptedCvv = await decryptData(card.cvv_encrypted)
      } catch (decryptError) {
        console.error('Decryption error:', decryptError)
        // If decryption fails, data may be in legacy plaintext format (not encrypted)
        // Check if the stored value looks like a raw card number (all digits)
        const storedNumber = card.card_number_encrypted
        const storedCvv = card.cvv_encrypted
        
        // If it's plaintext (starts with digits, typical card number format), use it directly
        if (/^\d{13,19}$/.test(storedNumber) && /^\d{3,4}$/.test(storedCvv)) {
          // Legacy plaintext format - return the actual values
          console.log('Using legacy plaintext card data for card:', card.id)
          return new Response(
            JSON.stringify({
              card: {
                id: card.id,
                type: card.type,
                card_number: storedNumber.replace(/(.{4})/g, '$1 ').trim(),
                last_four: card.last_four,
                expiry_date: card.expiry_date,
                cvv: storedCvv,
                cardholder_name: card.cardholder_name,
                is_active: card.is_active,
                is_frozen: card.is_frozen,
                created_at: card.created_at
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // If it's not plaintext and decryption failed, return masked version
        return new Response(
          JSON.stringify({
            card: {
              id: card.id,
              type: card.type,
              card_number: `****-****-****-${card.last_four}`,
              last_four: card.last_four,
              expiry_date: card.expiry_date,
              cvv: '***',
              cardholder_name: card.cardholder_name,
              is_active: card.is_active,
              is_frozen: card.is_frozen,
              created_at: card.created_at,
              _notice: 'Card data requires migration to encrypted format'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return decrypted details (log this access for audit)
      console.log(`Card details accessed: card_id=${card.id}, user_id=${userId}, timestamp=${new Date().toISOString()}`)
      
      return new Response(
        JSON.stringify({
          card: {
            id: card.id,
            type: card.type,
            card_number: decryptedCardNumber,
            last_four: card.last_four,
            expiry_date: card.expiry_date,
            cvv: decryptedCvv,
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
      const body = await req.json()

      if (!isValidUUID(body.card_id)) {
        return validationError('Invalid card ID format', corsHeaders)
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
      const body = await req.json()

      if (!isValidUUID(body.card_id)) {
        return validationError('Invalid card ID format', corsHeaders)
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

      // Encrypt sensitive card data before storage
      let encryptedCardNumber: string
      let encryptedCvv: string
      
      try {
        encryptedCardNumber = await encryptData(cardNumber)
        encryptedCvv = await encryptData(cvv)
      } catch (encryptError) {
        console.error('Encryption error:', encryptError)
        return new Response(
          JSON.stringify({ error: 'Failed to secure card data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
          card_number_encrypted: encryptedCardNumber,
          expiry_date: expiryString,
          cvv_encrypted: encryptedCvv,
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
    const corsHeaders = getCorsHeaders()
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
