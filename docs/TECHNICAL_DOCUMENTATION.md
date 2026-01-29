# POCKET PAY - COMPLETE TECHNICAL DOCUMENTATION

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Step-by-Step Implementation Details](#2-step-by-step-implementation-details)
3. [Database Design](#3-database-design)
4. [Authentication & Security](#4-authentication--security)
5. [API Documentation](#5-api-documentation)
6. [Frontend Component Map](#6-frontend-component-map)
7. [Integrations](#7-integrations)
8. [Deployment & Build Process](#8-deployment--build-process)
9. [Known Limitations & Future Improvements](#9-known-limitations--future-improvements)
10. [Final System Flow Summary](#10-final-system-flow-summary)

---

## 1. PROJECT OVERVIEW

### 1.1 Project Purpose

**Pocket Pay** is a consumer-first, mobile-first digital wallet application designed to provide seamless peer-to-peer money transfers, payment requests, virtual card management, and financial insights. The application is inspired by modern fintech applications like Cash App, Venmo, and Chime.

### 1.2 Problem It Solves

- **Instant Money Transfers**: Users can send and receive money instantly without waiting for bank transfers
- **Smart Security**: Intelligent risk detection protects users from fraudulent transactions
- **Financial Visibility**: Comprehensive insights and transaction history help users track spending
- **Virtual Cards**: Secure virtual debit cards for online payments
- **Payment Requests**: Request money from friends with seamless payment acceptance

### 1.3 Target Users

- Individuals who need to send/receive money quickly
- Friends splitting bills and expenses
- Users seeking a modern digital wallet experience
- People wanting virtual cards for secure online shopping

### 1.4 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                     React + TypeScript + Vite                       │
│                         Tailwind CSS + shadcn/ui                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / REST API
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE PLATFORM                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   Edge Functions │  │  PostgreSQL DB  │  │   Auth Service      │  │
│  │   (Deno Runtime) │  │  (Ledger-based) │  │   (Email OTP)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│                              │                                       │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  Row Level       │  │   Atomic Database Functions            │   │
│  │  Security (RLS)  │  │   (Balance Operations with Locking)   │   │
│  └─────────────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Resend API (Email Delivery for OTP)                         │    │
│  │  Domain: noreply@wenevertrust.com                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.5 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI framework with type safety |
| **Build Tool** | Vite | Fast development and production builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built components |
| **State Management** | TanStack Query (React Query) | Server state management and caching |
| **Routing** | React Router v6 | Client-side navigation (single-page app) |
| **Animations** | Framer Motion | Premium animations and transitions |
| **Backend** | Supabase Edge Functions (Deno) | Serverless API endpoints |
| **Database** | PostgreSQL (via Supabase) | Relational database with ACID compliance |
| **Authentication** | Custom OTP + Supabase Auth | Email-based authentication with 6-digit codes |
| **Email Service** | Resend API | Transactional email delivery |
| **Encryption** | AES-256-GCM | Card data encryption at rest |

---

## 2. STEP-BY-STEP IMPLEMENTATION DETAILS

---

### STEP 1: PROJECT INITIALIZATION AND SETUP

---

#### A. GOAL OF THIS STEP

Set up the foundational structure of the Pocket Pay application including the React project, TypeScript configuration, Tailwind CSS styling, and Supabase integration.

#### B. WHAT WAS IMPLEMENTED

- Vite-based React project with TypeScript
- Tailwind CSS with custom design tokens
- shadcn/ui component library installation
- Supabase client configuration
- Project folder structure

#### C. CODE-LEVEL BREAKDOWN

**File: `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

**Purpose**: Configures Vite build tool with:
- SWC-based React plugin for faster compilation
- Path alias `@` pointing to `src/` directory
- Hot Module Replacement (HMR) settings
- Development server on port 8080

**File: `src/main.tsx`**

```typescript
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
```

**Purpose**: Application entry point that mounts the React app to the DOM.

**File: `src/App.tsx`**

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

**Key Components**:
- `QueryClientProvider`: Wraps app with TanStack Query for API state management
- `TooltipProvider`: Enables tooltips throughout the application
- `Toaster` / `Sonner`: Toast notification systems
- `BrowserRouter`: Client-side routing

**File: `src/integrations/supabase/client.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**Purpose**: Creates a typed Supabase client with:
- Automatic session persistence in localStorage
- Token auto-refresh
- TypeScript types from database schema

#### D. DATA FLOW EXPLANATION

1. User loads the application
2. `main.tsx` mounts the React app
3. `App.tsx` initializes providers (Query, Routing, Tooltips)
4. React Router renders the `Index` page
5. Supabase client is available for API calls

#### E. CONFIGURATION & ENVIRONMENT

**File: `.env`**
```
VITE_SUPABASE_PROJECT_ID="onlhhefpjkcjkscsnoqk"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
VITE_SUPABASE_URL="https://onlhhefpjkcjkscsnoqk.supabase.co"
```

---

### STEP 2: DESIGN SYSTEM IMPLEMENTATION

---

#### A. GOAL OF THIS STEP

Create a premium, dark-themed fintech design system with custom colors, typography, and reusable component styles.

#### B. WHAT WAS IMPLEMENTED

- Custom CSS variables for theming
- Plus Jakarta Sans font integration
- Gradient wallet cards
- Status color system (success, warning, error)
- Mobile-optimized touch-friendly components

#### C. CODE-LEVEL BREAKDOWN

**File: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

@layer base {
  :root {
    /* Premium dark palette */
    --background: 225 25% 8%;
    --foreground: 210 20% 95%;
    
    /* Primary - Refined teal/cyan accent */
    --primary: 175 70% 50%;
    --primary-foreground: 225 25% 8%;
    --primary-soft: 175 50% 15%;
    --primary-glow: 175 70% 50%;
    
    /* Status colors */
    --success: 160 65% 45%;
    --success-soft: 160 50% 12%;
    --warning: 38 92% 50%;
    --warning-soft: 38 60% 12%;
    --destructive: 0 70% 50%;
    --destructive-soft: 0 50% 12%;
  }
}
```

**Key Design Tokens**:
| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--primary` | 175 70% 50% | Teal accent for buttons, links |
| `--background` | 225 25% 8% | Deep navy background |
| `--success` | 160 65% 45% | Completed transactions, deposits |
| `--warning` | 38 92% 50% | Pending transactions |
| `--destructive` | 0 70% 50% | Failed/blocked transactions |

**Custom Component Classes**:

```css
/* Premium wallet card with gradients */
.wallet-card {
  background: linear-gradient(135deg, hsl(225 20% 14%) 0%, hsl(225 25% 10%) 100%);
  border: 1px solid hsl(225 15% 22%);
  @apply rounded-3xl p-5 sm:p-6 relative overflow-hidden;
}

/* Balance display - responsive */
.balance-display {
  @apply text-4xl sm:text-5xl font-extrabold tracking-tight;
  font-variant-numeric: tabular-nums;
}

/* Transaction item - touch friendly */
.transaction-item {
  @apply flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl;
  min-height: 72px;
}
```

---

### STEP 3: TYPE SYSTEM AND DATA MODELS

---

#### A. GOAL OF THIS STEP

Define TypeScript interfaces that model the application's core entities and ensure type safety throughout the codebase.

#### B. WHAT WAS IMPLEMENTED

- User model
- Transaction model with status states
- Wallet balance structure
- Card model with security considerations
- Money request model
- Screen navigation types

#### C. CODE-LEVEL BREAKDOWN

**File: `src/types/wallet.ts`**

```typescript
export interface User {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdrawal' | 'request';
  amount: number;
  status: 'created' | 'pending_confirmation' | 'completed' | 'blocked' | 'failed';
  description: string;
  recipient?: User;
  sender?: User;
  createdAt: Date;
  isRisky?: boolean;
}

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface Card {
  id: string;
  type: 'virtual' | 'physical';
  lastFour: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
}

export type Screen = 
  | 'auth' | 'onboarding' | 'home' | 'send' | 'send-amount' 
  | 'send-confirm' | 'send-success' | 'receive' | 'request'
  | 'request-amount' | 'request-success' | 'history' | 'insights'
  | 'settings' | 'profile' | 'security' | 'notifications' | 'help'
  | 'cards' | 'card-details' | 'contact-profile' | 'transaction-detail'
  | 'scan' | 'deposit' | 'withdraw' | 'terms' | 'privacy';
```

**Transaction Status State Machine**:

```
CREATED ─────────┬──────────────────────────> COMPLETED
                 │                               ▲
                 │ (if risky)                    │
                 ▼                               │
        PENDING_CONFIRMATION ──── (confirm) ────┘
                 │
                 │ (cancel/timeout)
                 ▼
               FAILED
                 
        BLOCKED (automated fraud detection)
```

---

### STEP 4: DATABASE SCHEMA DESIGN

---

#### A. GOAL OF THIS STEP

Create a secure, ledger-based database architecture that ensures data integrity for financial transactions.

#### B. WHAT WAS IMPLEMENTED

- **Ledger-based accounting**: All balance changes are append-only entries
- **Atomic database functions**: Prevent race conditions and double-spending
- **Row Level Security (RLS)**: User data isolation
- **Automatic user provisioning**: Trigger-based profile and wallet creation

#### C. DATABASE TABLES

**Table: `profiles`**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,           -- Links to auth.users
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `wallets`**
```sql
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,  -- One wallet per user
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `ledger_entries`** (Core of financial system)
```sql
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,  -- Positive = credit, Negative = debit
  reference_transaction_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `transactions`**
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  sender_wallet_id UUID REFERENCES wallets(id),
  recipient_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  status transaction_status DEFAULT 'created',
  is_risky BOOLEAN DEFAULT false,
  risk_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `cards`**
```sql
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type card_type NOT NULL,  -- 'virtual' | 'physical'
  last_four TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL,  -- AES-256-GCM encrypted
  cvv_encrypted TEXT NOT NULL,          -- AES-256-GCM encrypted
  expiry_date TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `money_requests`**
```sql
CREATE TABLE public.money_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_wallet_id UUID NOT NULL REFERENCES wallets(id),
  requested_from_wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  note TEXT,
  status request_status DEFAULT 'pending',
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Table: `otp_codes`**
```sql
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  code TEXT NOT NULL,
  action TEXT DEFAULT 'login',  -- 'signup' | 'login' | 'recovery'
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### D. ATOMIC DATABASE FUNCTIONS

**Function: `get_wallet_balance`**
```sql
CREATE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)::DECIMAL(15,2)
  FROM public.ledger_entries
  WHERE wallet_id = p_wallet_id;
$$;
```

**Function: `atomic_transfer`** (Prevents double-spending)
```sql
CREATE FUNCTION public.atomic_transfer(
  p_sender_wallet_id UUID,
  p_recipient_wallet_id UUID,
  p_amount DECIMAL,
  p_transaction_id UUID,
  p_description TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_balance DECIMAL;
BEGIN
  -- Lock both wallets in consistent order to prevent deadlocks
  IF p_sender_wallet_id < p_recipient_wallet_id THEN
    PERFORM id FROM wallets WHERE id = p_sender_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_recipient_wallet_id FOR UPDATE;
  ELSE
    PERFORM id FROM wallets WHERE id = p_recipient_wallet_id FOR UPDATE;
    PERFORM id FROM wallets WHERE id = p_sender_wallet_id FOR UPDATE;
  END IF;
  
  -- Get sender's balance
  SELECT COALESCE(SUM(amount), 0) INTO v_sender_balance
  FROM ledger_entries WHERE wallet_id = p_sender_wallet_id;
  
  -- Check funds
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  
  -- Debit sender
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_sender_wallet_id, -p_amount, p_transaction_id, 'Sent: ' || p_description);
  
  -- Credit recipient
  INSERT INTO ledger_entries (wallet_id, amount, reference_transaction_id, description)
  VALUES (p_recipient_wallet_id, p_amount, p_transaction_id, 'Received: ' || p_description);
  
  RETURN jsonb_build_object('success', true);
END;
$$;
```

**Trigger: `handle_new_user`**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 
             SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4)),
    NEW.email
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  RETURNING id INTO new_wallet_id;
  
  -- Give $100 welcome bonus
  INSERT INTO public.ledger_entries (wallet_id, amount, description)
  VALUES (new_wallet_id, 100.00, 'Welcome bonus');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### STEP 5: AUTHENTICATION SYSTEM

---

#### A. GOAL OF THIS STEP

Implement a secure, user-friendly authentication system using 6-digit OTP codes delivered via email, with optional password fallback.

#### B. WHAT WAS IMPLEMENTED

- Custom OTP generation and verification
- Email delivery via Resend API
- Password-based login fallback
- Forgiving verification (no lockouts, 30-minute code validity)
- Session management via Supabase Auth

#### C. CODE-LEVEL BREAKDOWN

**File: `supabase/functions/auth-otp/index.ts`**

```typescript
// OTP expires after 30 minutes
const OTP_EXPIRY_MS = 30 * 60 * 1000;

// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  const action = url.searchParams.get("action");

  if (action === "send") {
    // 1. Generate OTP code
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    
    // 2. Delete existing unused codes
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email.toLowerCase())
      .is("verified_at", null);
    
    // 3. Store new code with metadata
    await supabase.from("otp_codes").insert({
      email: email.toLowerCase(),
      code,
      action: authAction,
      metadata: { name, username, password },
      expires_at: expiresAt.toISOString(),
    });
    
    // 4. Send email via Resend
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "Pocket Pay <noreply@wenevertrust.com>",
        to: [email],
        subject: "Your Pocket Pay Login Code",
        html: `<html><!-- Premium HTML email with code: ${code} --></html>`
      })
    });
  }
  
  if (action === "verify") {
    // 1. Find valid OTP
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();
    
    // 2. Check code matches
    if (otpRecord.code !== code) {
      await new Promise(r => setTimeout(r, 1000)); // Anti-brute-force delay
      return Response({ error: "Invalid code" });
    }
    
    // 3. Mark as verified
    await supabase
      .from("otp_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRecord.id);
    
    // 4. Create or get user
    if (authAction === "signup" && !existingUser) {
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        password: metadata.password,
        user_metadata: { name: metadata.name, username: metadata.username }
      });
    }
    
    // 5. Generate session via magic link
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });
    
    return Response({ success: true, token_hash: linkData.properties?.hashed_token });
  }
});
```

**File: `src/components/screens/AuthScreen.tsx`**

Key features:
- Dual mode: Login / Signup toggle
- Email or Phone selection
- Premium hero section with animated icons
- 6-digit OTP input slots
- Password fields for signup
- Password login fallback

```tsx
const AuthScreen = ({ onSuccess }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'choose' | 'details' | 'otp' | 'password'>('choose');
  
  const handleSendOtp = async () => {
    const { error } = await authApi.sendOtpEmail(
      email,
      mode === 'signup' ? 'signup' : 'login',
      { name: getFullName(), username, password }
    );
    if (!error) setStep('otp');
  };
  
  const handleVerifyOtp = async () => {
    const { error } = await authApi.verifyOtpSignup({
      contact: email,
      type: 'email',
      otp,
      name: getFullName(),
      username,
    });
    if (!error) onSuccess();
  };
};
```

---

### STEP 6: API SERVICE LAYER

---

#### A. GOAL OF THIS STEP

Create a unified API service layer that abstracts all backend communication and provides typed responses.

#### B. WHAT WAS IMPLEMENTED

- Centralized API helper with authentication
- Type-safe request/response handling
- Organized by domain (wallet, transfers, requests, transactions, cards)

#### C. CODE-LEVEL BREAKDOWN

**File: `src/services/api.ts`**

```typescript
// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Generic API call helper
async function apiCall<T>(
  functionName: string,
  action: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {}
): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}?action=${action}`;
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

// Wallet API
export const walletApi = {
  getBalance: () => apiCall<WalletBalance>('wallet', 'balance'),
  getSummary: () => apiCall('wallet', 'summary'),
  lookupUser: (username: string) => apiCall('wallet', 'lookup', { params: { username } }),
  getContacts: () => apiCall('wallet', 'contacts'),
};

// Transfers API
export const transfersApi = {
  send: (params) => apiCall('transfers', 'send', { method: 'POST', body: params }),
  confirm: (id) => apiCall('transfers', 'confirm', { method: 'POST', body: { transaction_id: id } }),
  cancel: (id) => apiCall('transfers', 'cancel', { method: 'POST', body: { transaction_id: id } }),
};

// Requests API
export const requestsApi = {
  create: (params) => apiCall('requests', 'create', { method: 'POST', body: params }),
  accept: (id) => apiCall('requests', 'accept', { method: 'POST', body: { request_id: id } }),
  decline: (id) => apiCall('requests', 'decline', { method: 'POST', body: { request_id: id } }),
  list: () => apiCall('requests', 'list'),
};

// Auth API (special handling for unauthenticated requests)
export const authApi = {
  sendOtpEmail: async (email, action, metadata) => { /* ... */ },
  verifyOtpSignup: async (params) => { /* ... */ },
  verifyOtpLogin: async (params) => { /* ... */ },
  signInWithPassword: async (params) => { /* ... */ },
};
```

---

### STEP 7: REACT QUERY HOOKS

---

#### A. GOAL OF THIS STEP

Create reusable React hooks that manage server state, caching, and mutations using TanStack Query.

#### B. WHAT WAS IMPLEMENTED

- Query hooks for fetching data
- Mutation hooks for write operations
- Automatic cache invalidation
- Toast notifications for user feedback
- Data transformation (backend → frontend format)

#### C. CODE-LEVEL BREAKDOWN

**File: `src/hooks/useWallet.ts`**

```typescript
// Transform backend transaction format to frontend
function transformTransaction(tx: any): Transaction {
  const isOutgoing = tx.is_outgoing === true;
  const displayType = isOutgoing ? 'send' : 'receive';
  const counterparty = isOutgoing ? tx.recipient : tx.sender;
  
  return {
    id: tx.id,
    type: displayType,
    amount: tx.amount,
    status: tx.status,
    description: tx.description,
    recipient: isOutgoing ? counterparty : undefined,
    sender: !isOutgoing ? counterparty : undefined,
    createdAt: new Date(tx.created_at),
    isRisky: tx.is_risky,
  };
}

// Wallet Summary Hook
export function useWalletSummary() {
  return useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: async () => {
      const data = await walletApi.getSummary();
      return {
        balance: data.balance,
        profile: data.profile,
        transactions: data.transactions.map(transformTransaction),
        cards: data.cards.map(transformCard),
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Send Money Mutation
export function useSendMoney() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params) => transfersApi.send(params),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast({
        title: data.status === 'completed' ? "Money sent!" : "Transfer pending",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({ title: "Transfer failed", variant: "destructive" });
    },
  });
}

// Accept Request Mutation
export function useAcceptRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId) => requestsApi.accept(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({ title: "Request paid" });
    },
  });
}
```

**File: `src/hooks/useAuth.ts`**

```typescript
export function useAuth() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    user: null,
    authUser: null,
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear cache on auth changes
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        queryClient.clear();
      }
      
      if (session?.user) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          authUser: session.user,
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            username: session.user.user_metadata?.username,
            email: session.user.email,
          },
        });
      } else {
        setState({ isLoggedIn: false, isLoading: false, user: null, authUser: null });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          authUser: session.user,
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            username: session.user.user_metadata?.username,
            email: session.user.email,
          },
        });
      } else {
        setState({ isLoggedIn: false, isLoading: false, user: null, authUser: null });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = useCallback(async () => {
    queryClient.clear();
    await supabase.auth.signOut();
  }, [queryClient]);

  return { ...state, signOut };
}
```

---

### STEP 8: EDGE FUNCTIONS IMPLEMENTATION

---

#### A. GOAL OF THIS STEP

Create serverless backend functions for all wallet operations with proper authentication, validation, and atomic database operations.

#### B. EDGE FUNCTIONS OVERVIEW

| Function | Purpose |
|----------|---------|
| `auth-otp` | OTP generation, verification, password management |
| `wallet` | Balance queries, user lookup, contacts |
| `transfers` | Send money, confirm/cancel risky transfers |
| `requests` | Create/accept/decline money requests |
| `transactions` | Transaction history, details, insights |
| `cards` | List/create/freeze cards |
| `banking` | Deposits and withdrawals |

#### C. SHARED UTILITIES

**File: `supabase/functions/_shared/cors.ts`**

```typescript
export function getCorsHeaders(_requestOrigin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCorsPreflightRequest(_requestOrigin?: string | null): Response {
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders() 
  })
}
```

**File: `supabase/functions/_shared/validation.ts`**

```typescript
export const MAX_AMOUNT = 1000000;
export const MIN_AMOUNT = 0.01;

export function isValidUUID(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
}

export function validateAmount(amount: unknown): { valid: boolean; value: number; error?: string } {
  const num = Number(amount);
  if (isNaN(num)) return { valid: false, value: 0, error: 'Invalid amount format' };
  if (num < MIN_AMOUNT) return { valid: false, value: 0, error: `Amount must be at least $${MIN_AMOUNT}` };
  if (num > MAX_AMOUNT) return { valid: false, value: 0, error: `Amount cannot exceed $${MAX_AMOUNT}` };
  return { valid: true, value: Math.round(num * 100) / 100 };
}

export function sanitizeText(text: unknown, maxLength: number): string {
  return String(text || '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}
```

**File: `supabase/functions/_shared/encryption.ts`**

```typescript
// AES-256-GCM encryption for card data
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export async function encryptData(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  
  // Combine IV + ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}
```

---

### STEP 9: TRANSFER FLOW WITH RISK DETECTION

---

#### A. GOAL OF THIS STEP

Implement a complete money transfer flow with intelligent risk detection and confirmation steps.

#### B. RISK RULES

| Rule | Trigger | Action |
|------|---------|--------|
| Large Transfer | Amount > $500 (configurable) | Mark as risky, require confirmation |
| New Recipient | First transfer to this user | Mark as risky |
| Rapid Transfers | 5+ transfers in 60 minutes | Mark as risky |

#### C. CODE-LEVEL BREAKDOWN

**File: `supabase/functions/transfers/index.ts`**

```typescript
if (action === 'send') {
  // Validate inputs...
  
  // Get sender wallet
  const { data: senderWallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  // Check balance
  const { data: balance } = await supabase.rpc('get_wallet_balance', { p_wallet_id: senderWallet.id });
  if (Number(balance) < amount) {
    return Response({ error: 'Insufficient funds' });
  }
  
  // === RISK ASSESSMENT ===
  let isRisky = false;
  let riskReason = null;
  
  // Rule 1: Large transfer
  const { data: settings } = await supabase
    .from('risk_settings')
    .select('setting_value')
    .eq('setting_key', 'large_transfer_threshold')
    .single();
  
  if (amount > (settings?.setting_value || 500)) {
    isRisky = true;
    riskReason = `Large transfer over $${settings?.setting_value}`;
  }
  
  // Rule 2: New recipient
  if (!isRisky) {
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('sender_wallet_id', senderWallet.id)
      .eq('recipient_wallet_id', recipientWalletId)
      .eq('status', 'completed');
    
    if (count === 0) {
      isRisky = true;
      riskReason = 'First transfer to this recipient';
    }
  }
  
  // Create transaction
  const initialStatus = isRisky ? 'pending_confirmation' : 'created';
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({ type: 'send', amount, status: initialStatus, is_risky: isRisky, risk_reason: riskReason })
    .select()
    .single();
  
  // If not risky, complete immediately
  if (!isRisky) {
    await supabase.rpc('atomic_transfer', {
      p_sender_wallet_id: senderWallet.id,
      p_recipient_wallet_id: recipientWalletId,
      p_amount: amount,
      p_transaction_id: transaction.id,
      p_description: description
    });
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction.id);
    return Response({ status: 'completed' });
  }
  
  return Response({ status: 'pending_confirmation', risk_reason: riskReason });
}

if (action === 'confirm') {
  // User confirmed risky transfer
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('status', 'pending_confirmation')
    .single();
  
  await supabase.rpc('atomic_transfer', {
    p_sender_wallet_id: transaction.sender_wallet_id,
    p_recipient_wallet_id: transaction.recipient_wallet_id,
    p_amount: transaction.amount,
    p_transaction_id: transaction.id,
    p_description: transaction.description
  });
  await supabase.from('transactions').update({ status: 'completed' });
  
  return Response({ status: 'completed' });
}
```

---

### STEP 10: MONEY REQUESTS SYSTEM

---

#### A. GOAL OF THIS STEP

Enable users to request money from others with accept/decline workflow.

#### B. REQUEST FLOW

```
┌─────────────┐     create      ┌─────────────────────┐
│  Requester  │ ──────────────> │  PENDING REQUEST    │
└─────────────┘                 └──────────┬──────────┘
                                           │
              ┌────────────────────────────┼────────────────────────┐
              │                            │                        │
              ▼ (accept)                   ▼ (decline)              ▼ (cancel)
   ┌────────────────────┐      ┌─────────────────────┐    ┌──────────────────┐
   │  Payment Created   │      │  REQUEST DECLINED   │    │ REQUEST CANCELLED│
   │  (atomic_transfer) │      └─────────────────────┘    └──────────────────┘
   └────────────────────┘
```

#### C. CODE-LEVEL BREAKDOWN

**File: `supabase/functions/requests/index.ts`**

```typescript
// Create request
if (action === 'create') {
  const { data: request } = await supabase
    .from('money_requests')
    .insert({
      requester_wallet_id: requesterWallet.id,
      requested_from_wallet_id: requestedFromWalletId,
      amount,
      note,
      status: 'pending'
    })
    .select()
    .single();
  
  return Response({ request, message: 'Request created' });
}

// Accept request (pay it)
if (action === 'accept') {
  // Get request (must be to this user)
  const { data: request } = await supabase
    .from('money_requests')
    .select('*')
    .eq('id', requestId)
    .eq('requested_from_wallet_id', payerWallet.id)
    .eq('status', 'pending')
    .single();
  
  // Create and complete transfer
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      type: 'send',
      sender_wallet_id: payerWallet.id,
      recipient_wallet_id: request.requester_wallet_id,
      amount: request.amount,
      status: 'created'
    })
    .select()
    .single();
  
  await supabase.rpc('atomic_transfer', {
    p_sender_wallet_id: payerWallet.id,
    p_recipient_wallet_id: request.requester_wallet_id,
    p_amount: request.amount,
    p_transaction_id: transaction.id,
    p_description: `Payment for request: ${request.note || 'Money request'}`
  });
  
  // Update request status
  await supabase
    .from('money_requests')
    .update({ status: 'accepted', transaction_id: transaction.id })
    .eq('id', request.id);
}
```

---

## 3. DATABASE DESIGN

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    auth.users    │       │     profiles     │       │     wallets      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────>│ id (PK, FK)      │       │ id (PK)          │
│ email            │       │ name             │       │ user_id (FK, UQ) │<─┐
│ user_metadata    │       │ username (UQ)    │       │ currency         │  │
│ created_at       │       │ email            │       │ created_at       │  │
└──────────────────┘       │ phone            │       └────────┬─────────┘  │
                           │ avatar_url       │                │             │
                           └──────────────────┘                │             │
                                                               │             │
┌──────────────────────────────────────────────────────────────┘             │
│                                                                            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │  ledger_entries  │    │   transactions   │    │      cards       │     │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────┤     │
│  │ id (PK)          │    │ id (PK)          │    │ id (PK)          │     │
└─>│ wallet_id (FK)   │    │ sender_wallet_id │<───│ wallet_id (FK)   │<────┘
   │ amount (+/-)     │    │ recipient_wallet │    │ type             │
   │ ref_transaction  │───>│ amount           │    │ last_four        │
   │ description      │    │ status           │    │ card_num_encrypt │
   │ created_at       │    │ type             │    │ cvv_encrypted    │
   └──────────────────┘    │ is_risky         │    │ is_frozen        │
                           │ risk_reason      │    └──────────────────┘
                           └──────────────────┘
                                    │
                                    │
                           ┌────────┴─────────┐
                           │  money_requests  │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ requester_wallet │
                           │ from_wallet      │
                           │ amount           │
                           │ status           │
                           │ transaction_id   │───> (FK)
                           └──────────────────┘
```

### 3.2 Row Level Security (RLS) Policies

| Table | Policy | Rule |
|-------|--------|------|
| `profiles` | View own | `id = auth.uid()` |
| `profiles` | View for lookup | Public read for discovery |
| `wallets` | View own | `user_id = auth.uid()` |
| `transactions` | View own | `is_wallet_owner(sender_wallet_id) OR is_wallet_owner(recipient_wallet_id)` |
| `transactions` | Create | `is_wallet_owner(sender_wallet_id)` |
| `ledger_entries` | View own | `is_wallet_owner(wallet_id)` |
| `cards` | View/Update own | `is_wallet_owner(wallet_id)` |
| `money_requests` | View involving | `is_wallet_owner(requester_wallet_id) OR is_wallet_owner(from_wallet_id)` |

---

## 4. AUTHENTICATION & SECURITY

### 4.1 Authentication Flow

```
┌─────────────┐    1. Enter email     ┌─────────────┐
│    User     │ ───────────────────> │  Frontend   │
└─────────────┘                       └──────┬──────┘
                                             │ 2. POST /auth-otp?action=send
                                             ▼
                                      ┌─────────────┐
                                      │  Edge Func  │
                                      └──────┬──────┘
                                             │ 3. Generate 6-digit OTP
                                             │ 4. Store in otp_codes table
                                             │ 5. Send via Resend API
                                             ▼
┌─────────────┐    6. OTP Email      ┌─────────────┐
│    User     │ <─────────────────── │   Resend    │
└──────┬──────┘                       └─────────────┘
       │ 7. Enter 6-digit code
       ▼
┌─────────────┐    8. Verify OTP     ┌─────────────┐
│  Frontend   │ ───────────────────> │  Edge Func  │
└─────────────┘                       └──────┬──────┘
                                             │ 9. Validate code
                                             │ 10. Create/fetch user
                                             │ 11. Generate magic link
                                             │ 12. Return token_hash
                                             ▼
┌─────────────┐   13. verifyOtp()    ┌─────────────┐
│  Frontend   │ <──────────────────> │ Supabase    │
└─────────────┘   14. Session set    │    Auth     │
                                      └─────────────┘
```

### 4.2 Security Features

| Feature | Implementation |
|---------|----------------|
| **OTP Expiry** | 30-minute validity window |
| **Brute Force Protection** | 1-second delay on failed attempts |
| **Card Encryption** | AES-256-GCM encryption at rest |
| **API Authentication** | JWT tokens via Supabase Auth |
| **CORS** | Wildcard origin with specific headers |
| **Input Validation** | Server-side validation for all inputs |
| **XSS Prevention** | Text sanitization removing `<>` and control chars |
| **SQL Injection** | Parameterized queries via Supabase client |
| **Row Level Security** | Database-enforced access control |

### 4.3 Secrets Management

| Secret | Usage |
|--------|-------|
| `SUPABASE_URL` | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations in Edge Functions |
| `SUPABASE_ANON_KEY` | Client-side authentication |
| `RESEND_API_KEY` | Email delivery |
| `CARD_ENCRYPTION_KEY` | Card data encryption |

---

## 5. API DOCUMENTATION

### 5.1 Wallet Endpoints

#### GET `/wallet?action=balance`
Get current wallet balance.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "available": 2500.00,
  "pending": 50.00,
  "total": 2550.00
}
```

#### GET `/wallet?action=summary`
Get wallet summary with recent transactions.

**Response:**
```json
{
  "balance": { "available": 2500.00, "pending": 0, "total": 2500.00 },
  "profile": { "id": "...", "name": "John Doe", "username": "johnd" },
  "transactions": [...],
  "cards": [...]
}
```

#### GET `/wallet?action=lookup&username=johnd`
Look up user by username for sending money.

**Response:**
```json
{
  "user": { "id": "...", "name": "John Doe", "username": "johnd" },
  "wallet_id": "abc123-..."
}
```

### 5.2 Transfer Endpoints

#### POST `/transfers?action=send`
Initiate a money transfer.

**Request Body:**
```json
{
  "recipient_wallet_id": "abc123-...",
  "amount": 50.00,
  "description": "Dinner split"
}
```

**Response (Non-risky):**
```json
{
  "transaction": { "id": "...", "status": "completed" },
  "status": "completed",
  "message": "Transfer completed successfully"
}
```

**Response (Risky):**
```json
{
  "transaction": { "id": "...", "status": "pending_confirmation" },
  "status": "pending_confirmation",
  "message": "Transfer requires confirmation",
  "risk_reason": "First transfer to this recipient"
}
```

#### POST `/transfers?action=confirm`
Confirm a risky transfer.

**Request Body:**
```json
{
  "transaction_id": "abc123-..."
}
```

### 5.3 Request Endpoints

#### POST `/requests?action=create`
Create a money request.

**Request Body:**
```json
{
  "requested_from_wallet_id": "abc123-...",
  "amount": 25.00,
  "note": "Concert tickets"
}
```

#### POST `/requests?action=accept`
Accept and pay a request.

**Request Body:**
```json
{
  "request_id": "abc123-..."
}
```

#### GET `/requests?action=list`
List incoming and outgoing requests.

**Response:**
```json
{
  "incoming": [{ "id": "...", "amount": 25.00, "requester": {...} }],
  "outgoing": [{ "id": "...", "amount": 50.00, "requested_from": {...} }]
}
```

### 5.4 Transaction Endpoints

#### GET `/transactions?action=list`
List transactions with optional filters.

**Query Parameters:**
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset
- `type`: Filter by type (send, receive, deposit, withdrawal)
- `status`: Filter by status

#### GET `/transactions?action=insights&period=month`
Get spending insights.

**Response:**
```json
{
  "period": "month",
  "summary": {
    "total_sent": 1500.00,
    "total_received": 2000.00,
    "fraud_blocked": 500.00,
    "transaction_count": 25,
    "net_flow": 500.00
  },
  "daily_breakdown": [...],
  "top_contacts": [...]
}
```

### 5.5 Card Endpoints

#### GET `/cards?action=list`
List all cards (masked).

#### GET `/cards?action=detail&id=abc123`
Get full card details (decrypted).

#### POST `/cards?action=freeze`
Freeze a card.

#### POST `/cards?action=create`
Create a new virtual card.

### 5.6 Banking Endpoints

#### POST `/banking?action=deposit`
Deposit from bank (simulated).

**Request Body:**
```json
{
  "amount": 500.00,
  "bank_name": "Chase"
}
```

#### POST `/banking?action=withdraw`
Withdraw to bank.

**Request Body:**
```json
{
  "amount": 200.00,
  "speed": "instant",
  "bank_name": "Chase"
}
```

**Response:**
```json
{
  "transaction": {...},
  "amount": 200.00,
  "fee": 3.00,
  "total_debited": 203.00,
  "estimated_arrival": "Instant",
  "speed": "instant"
}
```

---

## 6. FRONTEND COMPONENT MAP

### 6.1 Screen Components

| Screen | File | Purpose |
|--------|------|---------|
| `AuthScreen` | `src/components/screens/AuthScreen.tsx` | Login/Signup with OTP |
| `HomeScreen` | `src/components/screens/HomeScreen.tsx` | Dashboard with balance, actions, activity |
| `SendScreen` | `src/components/screens/SendScreen.tsx` | Recipient selection |
| `SendAmountScreen` | `src/components/screens/SendAmountScreen.tsx` | Amount entry with keypad |
| `SendConfirmScreen` | `src/components/screens/SendConfirmScreen.tsx` | Confirmation before sending |
| `SendSuccessScreen` | `src/components/screens/SendSuccessScreen.tsx` | Success with status |
| `ReceiveScreen` | `src/components/screens/ReceiveScreen.tsx` | QR code display |
| `RequestScreen` | `src/components/screens/RequestScreen.tsx` | Request recipient selection |
| `RequestAmountScreen` | `src/components/screens/RequestAmountScreen.tsx` | Request amount entry |
| `HistoryScreen` | `src/components/screens/HistoryScreen.tsx` | Full transaction history |
| `InsightsScreen` | `src/components/screens/InsightsScreen.tsx` | Analytics and charts |
| `SettingsScreen` | `src/components/screens/SettingsScreen.tsx` | Settings menu |
| `CardsScreen` | `src/components/screens/CardsScreen.tsx` | Virtual cards management |
| `DepositScreen` | `src/components/screens/DepositScreen.tsx` | Add money from bank |
| `WithdrawScreen` | `src/components/screens/WithdrawScreen.tsx` | Cash out to bank |

### 6.2 Main Controller

**File: `src/pages/Index.tsx`**

This is the main screen controller that:
- Manages screen navigation state
- Handles authentication state changes
- Coordinates data flow between screens
- Manages send/request flow state

```typescript
const Index = () => {
  const { isLoggedIn, isLoading, user, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [sendAmount, setSendAmount] = useState<number>(0);
  
  // Data hooks
  const { data: walletData } = useWalletSummary();
  const { data: transactions } = useTransactions();
  const sendMoney = useSendMoney();
  
  // Navigate based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn && currentScreen === 'auth') {
        setCurrentScreen('home');
      } else if (!isLoggedIn) {
        setCurrentScreen('auth');
      }
    }
  }, [isLoggedIn, isLoading]);
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth': return <AuthScreen onSuccess={() => setCurrentScreen('home')} />;
      case 'home': return <HomeScreen balance={walletData?.balance} />;
      case 'send': return <SendScreen onSelectRecipient={handleSelectRecipient} />;
    }
  };
  
  return (
    <>
      {renderScreen()}
      {showNav && <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />}
    </>
  );
};
```

### 6.3 UI Component Library

All UI components are from **shadcn/ui** with custom theming:

- `Button` - Multiple variants (send, receive, outline)
- `Input` - Styled for dark theme
- `InputOTP` - 6-digit code input
- `Card` - Container component
- `Dialog` / `Sheet` - Modals and drawers
- `Toast` - Notifications
- `Avatar` - User initials/images

---

## 7. INTEGRATIONS

### 7.1 Resend (Email Delivery)

**Purpose**: Deliver OTP codes to users' email addresses.

**Configuration**:
- Sender: `Pocket Pay <noreply@wenevertrust.com>`
- Template: Custom HTML with branded styling

**Files**:
- `supabase/functions/auth-otp/index.ts` (lines 131-202)

### 7.2 Supabase Auth

**Purpose**: Session management and user authentication.

**Features Used**:
- `supabase.auth.admin.createUser()` - Create new users
- `supabase.auth.admin.generateLink()` - Generate magic link tokens
- `supabase.auth.verifyOtp()` - Verify token for session
- `supabase.auth.signOut()` - Logout
- `supabase.auth.onAuthStateChange()` - React to auth changes

### 7.3 QR Code Generation

**Library**: `qrcode.react`

**Purpose**: Generate QR codes for users to share their wallet address.

**File**: `src/components/screens/ReceiveScreen.tsx`

### 7.4 QR Code Scanning

**Library**: `html5-qrcode`

**Purpose**: Scan other users' QR codes to initiate transfers.

**File**: `src/components/screens/ScanScreen.tsx`

---

## 8. DEPLOYMENT & BUILD PROCESS

### 8.1 Build Process

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 8.2 Environment Configuration

**File: `.env`**
```
VITE_SUPABASE_PROJECT_ID=onlhhefpjkcjkscsnoqk
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_URL=https://onlhhefpjkcjkscsnoqk.supabase.co
```

### 8.3 Edge Function Deployment

Edge functions are automatically deployed when code is pushed. Configuration in:

**File: `supabase/config.toml`**
```toml
project_id = "onlhhefpjkcjkscsnoqk"

[functions.wallet]
verify_jwt = false

[functions.transfers]
verify_jwt = false
```

### 8.4 Hosting

- **Preview**: Lovable preview environment
- **Production**: Published to custom domain

---

## 9. KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### 9.1 Current Limitations

| Limitation | Description |
|------------|-------------|
| **Simulated Money** | No real banking integration - money is simulated |
| **No KYC/AML** | No identity verification for users |
| **Phone OTP** | Phone SMS OTP not fully implemented (requires Twilio) |
| **Push Notifications** | No mobile push notification support |
| **Offline Mode** | Requires internet connection |
| **Multi-Currency** | Only USD supported |

### 9.2 Technical Debt

1. **Transaction enrichment** - Currently done in-loop, should be batched
2. **Contact caching** - Contacts are fetched on every navigation
3. **Real-time updates** - Not using Supabase Realtime for live transaction updates

### 9.3 Suggested Enhancements

1. **Stripe Integration** - Connect real bank accounts and card networks
2. **Mobile App** - React Native version
3. **Social Features** - Activity feed, transaction reactions
4. **Recurring Payments** - Scheduled transfers
5. **Multi-factor Auth** - TOTP, biometric
6. **Admin Dashboard** - Transaction monitoring, user management

---

## 10. FINAL SYSTEM FLOW SUMMARY

### 10.1 End-to-End User Journey

```
1. USER ONBOARDING
   └─> Enter email → Receive OTP → Verify code → Account created
   └─> Wallet created → $100 welcome bonus → Virtual card issued

2. HOME SCREEN
   └─> View balance → See recent activity → Check pending requests

3. SEND MONEY
   └─> Select recipient (search/contacts/scan QR)
   └─> Enter amount + reason
   └─> Confirm transaction
   └─> [If risky] Additional confirmation step
   └─> Money transferred → Balances updated

4. REQUEST MONEY
   └─> Select person to request from
   └─> Enter amount + note
   └─> Request sent → Appears in their pending requests

5. RECEIVE REQUEST
   └─> See incoming request → Accept (pay) or Decline
   └─> If accepted, money transferred automatically

6. DEPOSIT/WITHDRAW
   └─> Add money from bank (instant credit)
   └─> Withdraw to bank (instant with fee, or standard free)

7. CARDS
   └─> View virtual card details → Use for online purchases
   └─> Freeze/unfreeze as needed

8. INSIGHTS
   └─> View spending patterns → Track net flow → See top contacts
```

### 10.2 Request → Response Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                     │
│                         (e.g., "Send $50 to @john")                         │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT COMPONENT                                    │
│  • Form validation                                                           │
│  • Call useSendMoney().mutateAsync()                                        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API SERVICE LAYER                                  │
│  • Get auth token                                                            │
│  • POST to /transfers?action=send                                           │
│  • Handle response/errors                                                    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE FUNCTION                                      │
│  • Verify JWT token                                                          │
│  • Validate inputs (UUID, amount, description)                              │
│  • Check balance                                                             │
│  • Run risk assessment                                                       │
│  • Create transaction record                                                 │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ATOMIC DATABASE FUNCTION                              │
│  • Lock sender and recipient wallets                                         │
│  • Verify sufficient funds                                                   │
│  • Create ledger entries (debit sender, credit recipient)                   │
│  • Update transaction status                                                 │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESPONSE TO CLIENT                                 │
│  { transaction: {...}, status: "completed", message: "..." }                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT QUERY                                        │
│  • Invalidate wallet and transactions queries                               │
│  • Show toast notification                                                   │
│  • Navigate to success screen                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## APPENDIX A: FILE STRUCTURE

```
pocket-pay/
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── navigation/
│   │   │   └── BottomNav.tsx
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── SendScreen.tsx
│   │   │   ├── SendAmountScreen.tsx
│   │   │   ├── SendConfirmScreen.tsx
│   │   │   ├── SendSuccessScreen.tsx
│   │   │   ├── ReceiveScreen.tsx
│   │   │   ├── RequestScreen.tsx
│   │   │   ├── RequestAmountScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   ├── InsightsScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   ├── CardsScreen.tsx
│   │   │   ├── DepositScreen.tsx
│   │   │   ├── WithdrawScreen.tsx
│   │   │   └── ... (other screens)
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── input-otp.tsx
│   │   │   └── ... (shadcn components)
│   │   └── wallet/
│   │       ├── TransactionItem.tsx
│   │       └── PendingRequests.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useBanking.ts
│   │   ├── useSettings.ts
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   ├── wallet.ts
│   │   └── recipient.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── cors.ts
│   │   │   ├── validation.ts
│   │   │   └── encryption.ts
│   │   ├── auth-otp/
│   │   │   └── index.ts
│   │   ├── wallet/
│   │   │   └── index.ts
│   │   ├── transfers/
│   │   │   └── index.ts
│   │   ├── requests/
│   │   │   └── index.ts
│   │   ├── transactions/
│   │   │   └── index.ts
│   │   ├── cards/
│   │   │   └── index.ts
│   │   └── banking/
│   │       └── index.ts
│   └── config.toml
├── docs/
│   └── TECHNICAL_DOCUMENTATION.md
├── .env
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## APPENDIX B: CONFIGURATION FILES

### tailwind.config.ts

```typescript
export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

**END OF DOCUMENTATION**

*Last Updated: January 2026*
*Version: 1.0.0*
