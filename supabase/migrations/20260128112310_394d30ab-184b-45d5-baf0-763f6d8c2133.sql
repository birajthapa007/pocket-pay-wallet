-- =========================================
-- POCKET PAY FINTECH BACKEND SCHEMA
-- Ledger-based, intent-driven architecture
-- =========================================

-- 1. ENUM TYPES
-- Transaction status state machine
CREATE TYPE public.transaction_status AS ENUM (
  'created',
  'pending_confirmation',
  'completed',
  'blocked',
  'failed'
);

-- Transaction types
CREATE TYPE public.transaction_type AS ENUM (
  'send',
  'receive',
  'deposit',
  'withdrawal',
  'request'
);

-- Money request status
CREATE TYPE public.request_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);

-- Card types
CREATE TYPE public.card_type AS ENUM (
  'virtual',
  'physical'
);

-- 2. PROFILES TABLE (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. WALLETS TABLE (one per user)
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. LEDGER ENTRIES (SOURCE OF TRUTH for balances)
-- Append-only: never update or delete, only insert
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  amount DECIMAL(15,2) NOT NULL, -- positive = credit, negative = debit
  reference_transaction_id UUID, -- links to transactions table
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast balance calculation
CREATE INDEX idx_ledger_wallet ON public.ledger_entries(wallet_id);
CREATE INDEX idx_ledger_created ON public.ledger_entries(created_at DESC);

-- 5. TRANSACTIONS TABLE (Payment Intents)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.transaction_type NOT NULL,
  sender_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  recipient_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL, -- mandatory reason field
  status public.transaction_status NOT NULL DEFAULT 'created',
  is_risky BOOLEAN NOT NULL DEFAULT false,
  risk_reason TEXT, -- explains why flagged
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX idx_transactions_sender ON public.transactions(sender_wallet_id);
CREATE INDEX idx_transactions_recipient ON public.transactions(recipient_wallet_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- 6. MONEY REQUESTS TABLE
CREATE TABLE public.money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  requested_from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  status public.request_status NOT NULL DEFAULT 'pending',
  transaction_id UUID REFERENCES public.transactions(id), -- linked when accepted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CARDS TABLE (simulated)
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type public.card_type NOT NULL,
  last_four TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL, -- in production, use vault
  expiry_date TEXT NOT NULL,
  cvv_encrypted TEXT NOT NULL, -- in production, use vault
  cardholder_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. RISK SETTINGS (configurable thresholds)
CREATE TABLE public.risk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value DECIMAL(15,2) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default risk thresholds
INSERT INTO public.risk_settings (setting_key, setting_value, description) VALUES
  ('large_transfer_threshold', 500.00, 'Transactions above this amount require confirmation'),
  ('rapid_transfer_count', 5, 'Number of transfers in rapid window to flag'),
  ('rapid_transfer_window_minutes', 60, 'Time window for rapid transfer detection');

-- 9. HELPER FUNCTIONS

-- Function: Get wallet balance (sum of all ledger entries)
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(15,2)
  FROM public.ledger_entries
  WHERE wallet_id = p_wallet_id;
$$;

-- Function: Get pending balance (from pending transactions)
CREATE OR REPLACE FUNCTION public.get_pending_balance(p_wallet_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(15,2)
  FROM public.transactions
  WHERE sender_wallet_id = p_wallet_id
    AND status = 'pending_confirmation';
$$;

-- Function: Check if user is wallet owner
CREATE OR REPLACE FUNCTION public.is_wallet_owner(p_wallet_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wallets
    WHERE id = p_wallet_id AND user_id = p_user_id
  );
$$;

-- Function: Get user's wallet ID
CREATE OR REPLACE FUNCTION public.get_user_wallet_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.wallets WHERE user_id = p_user_id LIMIT 1;
$$;

-- 10. TRIGGERS

-- Auto-create wallet and profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  -- Create profile with email as default username
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4)),
    NEW.email
  );
  
  -- Create wallet for user
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  RETURNING id INTO new_wallet_id;
  
  -- Give new users $100 welcome bonus (simulated)
  INSERT INTO public.ledger_entries (wallet_id, amount, description)
  VALUES (new_wallet_id, 100.00, 'Welcome bonus');
  
  -- Create a virtual card for the user
  INSERT INTO public.cards (wallet_id, type, last_four, card_number_encrypted, expiry_date, cvv_encrypted, cardholder_name)
  VALUES (
    new_wallet_id,
    'virtual',
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    '4532' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    TO_CHAR(NOW() + INTERVAL '3 years', 'MM/YY'),
    LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
    UPPER(COALESCE(NEW.raw_user_meta_data->>'name', 'CARDHOLDER'))
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_money_requests_updated_at
  BEFORE UPDATE ON public.money_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ROW LEVEL SECURITY

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- WALLETS policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- LEDGER policies (append-only, view own only)
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries
  FOR SELECT TO authenticated 
  USING (public.is_wallet_owner(wallet_id, auth.uid()));

-- No direct insert/update/delete on ledger - only through functions

-- TRANSACTIONS policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    public.is_wallet_owner(sender_wallet_id, auth.uid()) OR
    public.is_wallet_owner(recipient_wallet_id, auth.uid())
  );

CREATE POLICY "Users can create transactions from own wallet" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_wallet_owner(sender_wallet_id, auth.uid()));

CREATE POLICY "Users can update own pending transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (
    public.is_wallet_owner(sender_wallet_id, auth.uid()) AND
    status IN ('created', 'pending_confirmation')
  );

-- MONEY REQUESTS policies
CREATE POLICY "Users can view requests involving them" ON public.money_requests
  FOR SELECT TO authenticated
  USING (
    public.is_wallet_owner(requester_wallet_id, auth.uid()) OR
    public.is_wallet_owner(requested_from_wallet_id, auth.uid())
  );

CREATE POLICY "Users can create requests from own wallet" ON public.money_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_wallet_owner(requester_wallet_id, auth.uid()));

CREATE POLICY "Users can update requests to them" ON public.money_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_wallet_owner(requested_from_wallet_id, auth.uid()) AND
    status = 'pending'
  );

-- CARDS policies
CREATE POLICY "Users can view own cards" ON public.cards
  FOR SELECT TO authenticated
  USING (public.is_wallet_owner(wallet_id, auth.uid()));

CREATE POLICY "Users can update own cards" ON public.cards
  FOR UPDATE TO authenticated
  USING (public.is_wallet_owner(wallet_id, auth.uid()));

-- RISK SETTINGS (read-only for authenticated users)
CREATE POLICY "Anyone can view risk settings" ON public.risk_settings
  FOR SELECT TO authenticated USING (true);