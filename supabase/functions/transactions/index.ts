// =========================================
// POCKET PAY - TRANSACTION QUERIES
// List transactions, get details, insights
// =========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // GET /transactions?action=list - List all transactions
    if (req.method === 'GET' && action === 'list') {
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const type = url.searchParams.get('type') // filter by type
      const status = url.searchParams.get('status') // filter by status

      let query = supabase
        .from('transactions')
        .select('*')
        .or(`sender_wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (type) {
        query = query.eq('type', type)
      }
      if (status) {
        query = query.eq('status', status)
      }

      const { data: transactions, error } = await query

      if (error) {
        console.error('List error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch transactions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Enrich with user info
      const enrichedTransactions = await Promise.all(
        (transactions || []).map(async (tx) => {
          let senderProfile = null
          let recipientProfile = null

          if (tx.sender_wallet_id) {
            const { data: senderWallet } = await supabase
              .from('wallets')
              .select('user_id')
              .eq('id', tx.sender_wallet_id)
              .single()
            
            if (senderWallet) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url')
                .eq('id', senderWallet.user_id)
                .single()
              senderProfile = profile
            }
          }

          if (tx.recipient_wallet_id) {
            const { data: recipientWallet } = await supabase
              .from('wallets')
              .select('user_id')
              .eq('id', tx.recipient_wallet_id)
              .single()
            
            if (recipientWallet) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url')
                .eq('id', recipientWallet.user_id)
                .single()
              recipientProfile = profile
            }
          }

          // Determine if this is incoming or outgoing for the user
          const isOutgoing = tx.sender_wallet_id === wallet.id

          return {
            ...tx,
            sender: senderProfile,
            recipient: recipientProfile,
            is_outgoing: isOutgoing
          }
        })
      )

      return new Response(
        JSON.stringify({ transactions: enrichedTransactions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /transactions?action=detail&id=xxx - Get transaction detail
    if (req.method === 'GET' && action === 'detail') {
      const transactionId = url.searchParams.get('id')
      if (!transactionId) {
        return new Response(
          JSON.stringify({ error: 'Transaction ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .or(`sender_wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`)
        .single()

      if (!transaction) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get sender and recipient profiles
      let senderProfile = null
      let recipientProfile = null

      if (transaction.sender_wallet_id) {
        const { data: senderWallet } = await supabase
          .from('wallets')
          .select('user_id')
          .eq('id', transaction.sender_wallet_id)
          .single()
        
        if (senderWallet) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', senderWallet.user_id)
            .single()
          senderProfile = profile
        }
      }

      if (transaction.recipient_wallet_id) {
        const { data: recipientWallet } = await supabase
          .from('wallets')
          .select('user_id')
          .eq('id', transaction.recipient_wallet_id)
          .single()
        
        if (recipientWallet) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', recipientWallet.user_id)
            .single()
          recipientProfile = profile
        }
      }

      // Generate human-friendly status message
      let statusMessage = ''
      switch (transaction.status) {
        case 'completed':
          statusMessage = 'Completed instantly'
          break
        case 'pending_confirmation':
          statusMessage = 'Waiting for your confirmation'
          break
        case 'blocked':
          statusMessage = 'Blocked to protect your account'
          break
        case 'failed':
          statusMessage = 'Transaction could not be completed'
          break
        case 'created':
          statusMessage = 'Processing...'
          break
      }

      return new Response(
        JSON.stringify({
          transaction: {
            ...transaction,
            sender: senderProfile,
            recipient: recipientProfile,
            status_message: statusMessage,
            is_outgoing: transaction.sender_wallet_id === wallet.id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /transactions?action=insights - Get spending insights
    if (req.method === 'GET' && action === 'insights') {
      const period = url.searchParams.get('period') || 'month' // month, week, year

      // Calculate date range
      const now = new Date()
      let startDate: Date
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      // Get all transactions in period
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_wallet_id.eq.${wallet.id},recipient_wallet_id.eq.${wallet.id}`)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')

      // Calculate insights
      let totalSent = 0
      let totalReceived = 0
      let totalBlocked = 0
      let transactionCount = 0

      const { data: blockedTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('sender_wallet_id', wallet.id)
        .eq('status', 'blocked')
        .gte('created_at', startDate.toISOString())

      blockedTx?.forEach(tx => {
        totalBlocked += Number(tx.amount)
      })

      transactions?.forEach(tx => {
        transactionCount++
        if (tx.sender_wallet_id === wallet.id && tx.type === 'send') {
          totalSent += Number(tx.amount)
        } else if (tx.recipient_wallet_id === wallet.id && tx.type === 'receive') {
          totalReceived += Number(tx.amount)
        }
      })

      // Get daily breakdown for chart
      const dailyData: { date: string; sent: number; received: number }[] = []
      const dayMs = 24 * 60 * 60 * 1000
      
      for (let d = startDate.getTime(); d <= now.getTime(); d += dayMs) {
        const dayStart = new Date(d)
        const dayEnd = new Date(d + dayMs)
        
        let daySent = 0
        let dayReceived = 0

        transactions?.forEach(tx => {
          const txDate = new Date(tx.created_at)
          if (txDate >= dayStart && txDate < dayEnd) {
            if (tx.sender_wallet_id === wallet.id && tx.type === 'send') {
              daySent += Number(tx.amount)
            } else if (tx.recipient_wallet_id === wallet.id && tx.type === 'receive') {
              dayReceived += Number(tx.amount)
            }
          }
        })

        dailyData.push({
          date: dayStart.toISOString().split('T')[0],
          sent: daySent,
          received: dayReceived
        })
      }

      // Get top contacts
      const contactStats: Record<string, { walletId: string; sent: number; received: number; count: number }> = {}

      transactions?.forEach(tx => {
        const otherWalletId = tx.sender_wallet_id === wallet.id 
          ? tx.recipient_wallet_id 
          : tx.sender_wallet_id
        
        if (otherWalletId) {
          if (!contactStats[otherWalletId]) {
            contactStats[otherWalletId] = { walletId: otherWalletId, sent: 0, received: 0, count: 0 }
          }
          contactStats[otherWalletId].count++
          if (tx.sender_wallet_id === wallet.id) {
            contactStats[otherWalletId].sent += Number(tx.amount)
          } else {
            contactStats[otherWalletId].received += Number(tx.amount)
          }
        }
      })

      const topContacts = Object.values(contactStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Enrich with profile info
      const enrichedContacts = await Promise.all(
        topContacts.map(async (contact) => {
          const { data: w } = await supabase
            .from('wallets')
            .select('user_id')
            .eq('id', contact.walletId)
            .single()
          
          if (w) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, name, username, avatar_url')
              .eq('id', w.user_id)
              .single()
            
            return { ...contact, profile }
          }
          return contact
        })
      )

      return new Response(
        JSON.stringify({
          period,
          summary: {
            total_sent: totalSent,
            total_received: totalReceived,
            fraud_blocked: totalBlocked,
            transaction_count: transactionCount,
            net_flow: totalReceived - totalSent
          },
          daily_breakdown: dailyData,
          top_contacts: enrichedContacts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transaction error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})