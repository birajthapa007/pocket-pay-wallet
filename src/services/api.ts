// =========================================
// POCKET PAY - API SERVICE LAYER
// Frontend integration with backend functions
// =========================================

import { supabase } from '@/integrations/supabase/client';

// Types matching backend responses
export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface TransactionResponse {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdrawal' | 'request';
  sender_wallet_id?: string;
  recipient_wallet_id?: string;
  amount: number;
  description: string;
  status: 'created' | 'pending_confirmation' | 'completed' | 'blocked' | 'failed';
  is_risky: boolean;
  risk_reason?: string;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
  recipient?: UserProfile;
  is_outgoing?: boolean;
  status_message?: string;
}

export interface CardResponse {
  id: string;
  type: 'virtual' | 'physical';
  last_four: string;
  card_number?: string;
  expiry_date: string;
  cvv?: string;
  cardholder_name: string;
  is_active: boolean;
  is_frozen: boolean;
  created_at: string;
}

export interface MoneyRequestResponse {
  id: string;
  requester_wallet_id: string;
  requested_from_wallet_id: string;
  amount: number;
  note?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  transaction_id?: string;
  created_at: string;
}

export interface InsightsResponse {
  period: string;
  summary: {
    total_sent: number;
    total_received: number;
    fraud_blocked: number;
    transaction_count: number;
    net_flow: number;
  };
  daily_breakdown: { date: string; sent: number; received: number }[];
  top_contacts: {
    walletId: string;
    sent: number;
    received: number;
    count: number;
    profile?: UserProfile;
  }[];
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Helper for API calls
async function apiCall<T>(
  functionName: string,
  action: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const { method = 'GET', body, params = {} } = options;
  
  const queryParams = new URLSearchParams({ action, ...params });
  
  // Use direct fetch - supabase.functions.invoke doesn't support query params properly
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}?${queryParams}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// WALLET API
// ==========================================

export const walletApi = {
  // Get current balance
  async getBalance(): Promise<WalletBalance> {
    return apiCall<WalletBalance>('wallet', 'balance');
  },

  // Get wallet summary (balance, transactions, profile, cards)
  async getSummary(): Promise<{
    balance: WalletBalance;
    profile: UserProfile;
    transactions: TransactionResponse[];
    cards: CardResponse[];
  }> {
    return apiCall('wallet', 'summary');
  },

  // Lookup user by username
  async lookupUser(username: string): Promise<{
    user: UserProfile;
    wallet_id: string;
  }> {
    return apiCall('wallet', 'lookup', { params: { username } });
  },

  // Get contacts list
  async getContacts(): Promise<{ contacts: UserProfile[] }> {
    return apiCall('wallet', 'contacts');
  },
};

// ==========================================
// TRANSFERS API
// ==========================================

export const transfersApi = {
  // Create a new transfer (payment intent)
  async send(params: {
    recipient_wallet_id: string;
    amount: number;
    description: string;
  }): Promise<{
    transaction: TransactionResponse;
    status: string;
    message: string;
    risk_reason?: string;
  }> {
    return apiCall('transfers', 'send', { method: 'POST', body: params });
  },

  // Confirm a risky transfer
  async confirm(transactionId: string): Promise<{
    transaction: TransactionResponse;
    status: string;
    message: string;
  }> {
    return apiCall('transfers', 'confirm', {
      method: 'POST',
      body: { transaction_id: transactionId },
    });
  },

  // Cancel a pending transfer
  async cancel(transactionId: string): Promise<{
    transaction: TransactionResponse;
    status: string;
    message: string;
  }> {
    return apiCall('transfers', 'cancel', {
      method: 'POST',
      body: { transaction_id: transactionId },
    });
  },

  // Get transfer status
  async getStatus(transactionId: string): Promise<{
    transaction: TransactionResponse;
  }> {
    return apiCall('transfers', 'status', { params: { id: transactionId } });
  },
};

// ==========================================
// REQUESTS API (Money Requests)
// ==========================================

export const requestsApi = {
  // Create a money request
  async create(params: {
    requested_from_wallet_id: string;
    amount: number;
    note?: string;
  }): Promise<{
    request: MoneyRequestResponse;
    message: string;
  }> {
    return apiCall('requests', 'create', { method: 'POST', body: params });
  },

  // Accept a request (pay it)
  async accept(requestId: string): Promise<{
    request: MoneyRequestResponse;
    transaction: TransactionResponse;
    message: string;
  }> {
    return apiCall('requests', 'accept', {
      method: 'POST',
      body: { request_id: requestId },
    });
  },

  // Decline a request
  async decline(requestId: string): Promise<{
    request: MoneyRequestResponse;
    message: string;
  }> {
    return apiCall('requests', 'decline', {
      method: 'POST',
      body: { request_id: requestId },
    });
  },

  // Cancel own request
  async cancel(requestId: string): Promise<{
    request: MoneyRequestResponse;
    message: string;
  }> {
    return apiCall('requests', 'cancel', {
      method: 'POST',
      body: { request_id: requestId },
    });
  },

  // List all requests
  async list(): Promise<{
    incoming: MoneyRequestResponse[];
    outgoing: MoneyRequestResponse[];
  }> {
    return apiCall('requests', 'list');
  },
};

// ==========================================
// TRANSACTIONS API
// ==========================================

export const transactionsApi = {
  // List transactions with optional filters
  async list(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  }): Promise<{ transactions: TransactionResponse[] }> {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);
    if (params?.type) queryParams.type = params.type;
    if (params?.status) queryParams.status = params.status;
    
    return apiCall('transactions', 'list', { params: queryParams });
  },

  // Get transaction detail
  async getDetail(transactionId: string): Promise<{
    transaction: TransactionResponse;
  }> {
    return apiCall('transactions', 'detail', { params: { id: transactionId } });
  },

  // Get spending insights
  async getInsights(period?: 'week' | 'month' | 'year'): Promise<InsightsResponse> {
    const params: Record<string, string> = {};
    if (period) params.period = period;
    return apiCall('transactions', 'insights', { params });
  },
};

// ==========================================
// CARDS API
// ==========================================

export const cardsApi = {
  // List all cards
  async list(): Promise<{ cards: CardResponse[] }> {
    return apiCall('cards', 'list');
  },

  // Get card details (full number, CVV)
  async getDetail(cardId: string): Promise<{ card: CardResponse }> {
    return apiCall('cards', 'detail', { params: { id: cardId } });
  },

  // Freeze card
  async freeze(cardId: string): Promise<{
    card: CardResponse;
    message: string;
  }> {
    return apiCall('cards', 'freeze', {
      method: 'POST',
      body: { card_id: cardId },
    });
  },

  // Unfreeze card
  async unfreeze(cardId: string): Promise<{
    card: CardResponse;
    message: string;
  }> {
    return apiCall('cards', 'unfreeze', {
      method: 'POST',
      body: { card_id: cardId },
    });
  },

  // Create new virtual card
  async create(): Promise<{
    card: CardResponse;
    message: string;
  }> {
    return apiCall('cards', 'create', { method: 'POST' });
  },
};

// ==========================================
// AUTH HELPERS
// ==========================================

export const authApi = {
  // Send OTP via custom edge function (supports both email and SMS)
  async sendOtp(
    contact: string,
    channel: 'email' | 'sms',
    action: 'signup' | 'login' | 'recovery' = 'login',
    metadata?: { name?: string; username?: string; password?: string }
  ): Promise<{ error: string | null }> {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-otp?action=send`;
      
      const body: Record<string, unknown> = {
        channel,
        action,
        name: metadata?.name,
        username: metadata?.username,
        password: metadata?.password,
      };

      if (channel === 'email') {
        body.email = contact;
      } else {
        body.phone = contact;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: data.error || 'Failed to send verification code' };
      }
      
      return { error: null };
    } catch (err) {
      console.error('Send OTP error:', err);
      return { error: 'Failed to send verification code' };
    }
  },

  // Backwards-compatible wrappers
  async sendOtpEmail(email: string, action: 'signup' | 'login' | 'recovery' = 'login', metadata?: { name?: string; username?: string; password?: string }): Promise<{ error: string | null; testCode?: string }> {
    const result = await this.sendOtp(email, 'email', action, metadata);
    return { error: result.error };
  },

  async sendOtpPhone(phone: string): Promise<{ error: string | null }> {
    return this.sendOtp(phone, 'sms', 'login');
  },

  // Verify OTP for signup - uses custom edge function for both email and phone
  async verifyOtpSignup(params: {
    contact: string;
    type: 'email' | 'phone';
    otp: string;
    name: string;
    username: string;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      const channel = params.type === 'phone' ? 'sms' : 'email';
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-otp?action=verify`;
      
      const body: Record<string, unknown> = {
        channel,
        code: params.otp,
        action: 'signup',
      };

      if (channel === 'sms') {
        body.phone = params.contact;
      } else {
        body.email = params.contact.toLowerCase();
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { user: null, error: data.error || 'Verification failed' };
      }

      // If we got a token_hash, use it to create session
      if (data.token_hash) {
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'magiclink',
        });
        
        if (sessionError) {
          console.error('Session verification error:', sessionError);
          return { user: null, error: 'Failed to complete signup. Please try again.' };
        }
        
        if (sessionData?.user) {
          // Update profile with user details
          await supabase
            .from('profiles')
            .update({
              name: params.name,
              username: params.username,
              email: params.type === 'email' ? params.contact : null,
              phone: params.type === 'phone' ? params.contact : null,
            })
            .eq('id', sessionData.user.id);

          return {
            user: {
              id: sessionData.user.id,
              name: params.name,
              username: params.username,
              email: params.type === 'email' ? params.contact : undefined,
              phone: params.type === 'phone' ? params.contact : undefined,
            },
            error: null,
          };
        }
      }

      return { user: null, error: 'Verification failed. Please try again.' };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return { user: null, error: 'Verification failed' };
    }
  },

  // Verify OTP for login - uses custom edge function for both email and phone
  async verifyOtpLogin(params: {
    contact: string;
    type: 'email' | 'phone';
    otp: string;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      const channel = params.type === 'phone' ? 'sms' : 'email';
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-otp?action=verify`;
      
      const body: Record<string, unknown> = {
        channel,
        code: params.otp,
        action: 'login',
      };

      if (channel === 'sms') {
        body.phone = params.contact;
      } else {
        body.email = params.contact.toLowerCase();
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { user: null, error: data.error || 'Verification failed' };
      }

      // If we got a token_hash, use it to create a session
      if (data.token_hash) {
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: 'magiclink',
        });
        
        if (sessionError) {
          console.error('Session verification error:', sessionError);
          return { user: null, error: 'Failed to complete login. Please try again.' };
        }
        
        if (sessionData?.user) {
          return {
            user: {
              id: sessionData.user.id,
              name: sessionData.user.user_metadata?.name || 'User',
              username: sessionData.user.user_metadata?.username || '',
              email: sessionData.user.email || undefined,
              phone: sessionData.user.phone || undefined,
            },
            error: null,
          };
        }
      }

      return { user: null, error: 'Verification failed. Please try again.' };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return { user: null, error: 'Verification failed' };
    }
  },

  // Sign in with password (fallback for login)
  async signInWithPassword(params: {
    contact: string;
    type: 'email' | 'phone';
    password: string;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    const signInParams = params.type === 'email'
      ? { email: params.contact, password: params.password }
      : { phone: params.contact, password: params.password };

    const { data, error } = await supabase.auth.signInWithPassword(signInParams);

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        name: data.user.user_metadata?.name || 'User',
        username: data.user.user_metadata?.username || '',
        email: data.user.email || undefined,
        phone: data.user.phone || undefined,
      } : null,
      error: null,
    };
  },

  // Legacy sign up with password (kept for compatibility)
  async signUp(params: {
    email: string;
    password: string;
    name: string;
    username: string;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          username: params.username,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        name: params.name,
        username: params.username,
        email: params.email,
      } : null,
      error: null,
    };
  },

  // Legacy sign in (kept for compatibility)
  async signIn(params: {
    email: string;
    password: string;
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword(params);

    if (error) {
      return { user: null, error: error.message };
    }

    return {
      user: data.user ? {
        id: data.user.id,
        name: data.user.user_metadata?.name || 'User',
        username: data.user.user_metadata?.username || '',
        email: data.user.email || '',
      } : null,
      error: null,
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  // Get current session
  async getSession() {
    return supabase.auth.getSession();
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};