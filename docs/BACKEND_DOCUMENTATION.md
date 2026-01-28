# Pocket Pay - Complete Backend Documentation

## 🏗️ Architecture Overview

Pocket Pay uses a **ledger-based, intent-driven** architecture that simulates Stripe's payment primitives without integrating real Stripe APIs.

### Core Principles

1. **Ledger as Source of Truth**: Wallet balances are NEVER stored directly. They're calculated from the sum of all `ledger_entries`.
2. **Payment Intents**: Transactions represent the *intent* to move money. Actual money movement only happens when ledger entries are created.
3. **State Machine**: Every transaction exists in exactly one state: `created`, `pending_confirmation`, `completed`, `blocked`, or `failed`.
4. **Rule-Based Risk**: Simple, explainable risk rules flag transactions for review without requiring AI/ML.

---

## 📊 Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (extends auth.users) |
| `wallets` | One wallet per user, holds currency setting |
| `ledger_entries` | Append-only transaction log (source of truth for balances) |
| `transactions` | Payment intents with status tracking |
| `money_requests` | Request money from other users |
| `cards` | Virtual/physical card simulation |
| `risk_settings` | Configurable risk thresholds |

### Enums

```sql
transaction_status: 'created' | 'pending_confirmation' | 'completed' | 'blocked' | 'failed'
transaction_type: 'send' | 'receive' | 'deposit' | 'withdrawal' | 'request'
request_status: 'pending' | 'accepted' | 'declined' | 'cancelled'
card_type: 'virtual' | 'physical'
```

### Key Functions

- `get_wallet_balance(wallet_id)`: Calculate available balance from ledger
- `get_pending_balance(wallet_id)`: Sum of pending outgoing transactions
- `is_wallet_owner(wallet_id, user_id)`: RLS helper for ownership check

---

## 🔌 API Endpoints (Edge Functions)

### Wallet API (`/functions/v1/wallet`)

| Action | Method | Description |
|--------|--------|-------------|
| `balance` | GET | Get available, pending, and total balance |
| `summary` | GET | Get balance + transactions + profile + cards |
| `lookup` | GET | Find user by username (for QR/search) |
| `contacts` | GET | List all users for contact picker |

### Transfers API (`/functions/v1/transfers`)

| Action | Method | Description |
|--------|--------|-------------|
| `send` | POST | Create transfer (payment intent) |
| `confirm` | POST | Confirm risky transfer |
| `cancel` | POST | Cancel pending transfer |
| `status` | GET | Get transfer status by ID |

### Requests API (`/functions/v1/requests`)

| Action | Method | Description |
|--------|--------|-------------|
| `create` | POST | Create money request |
| `accept` | POST | Pay a request |
| `decline` | POST | Decline a request |
| `cancel` | POST | Cancel own request |
| `list` | GET | List incoming and outgoing requests |

### Transactions API (`/functions/v1/transactions`)

| Action | Method | Description |
|--------|--------|-------------|
| `list` | GET | List transactions with filters |
| `detail` | GET | Get full transaction detail |
| `insights` | GET | Get spending analytics |

### Cards API (`/functions/v1/cards`)

| Action | Method | Description |
|--------|--------|-------------|
| `list` | GET | List all cards (masked) |
| `detail` | GET | Get full card details |
| `freeze` | POST | Freeze a card |
| `unfreeze` | POST | Unfreeze a card |
| `create` | POST | Create new virtual card |

---

## 🛡️ Risk Rules

Transfers are flagged as risky if:

1. **Large Transfer**: Amount > $500 (configurable in `risk_settings`)
2. **New Recipient**: First-ever transfer to this user
3. **Rapid Transfers**: 5+ transfers in 60 minutes

Risky transfers go to `pending_confirmation` status and require explicit user confirmation.

---

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view their own wallet/ledger/cards
- Users can view transactions where they're sender OR recipient
- Profiles are publicly viewable (for contact lookup)
- Ledger entries are append-only (no direct insert/update/delete)

### Authentication

- Email/password auth via Supabase Auth
- Auto-confirm enabled for development
- JWT tokens passed to edge functions for auth

---

## 🎯 Transaction Flow

### Send Money Flow

```
1. User initiates send → POST /transfers?action=send
2. Backend checks balance, runs risk rules
3. If NOT risky:
   - Create ledger entries (debit sender, credit recipient)
   - Set status → 'completed'
   - Return success
4. If risky:
   - Set status → 'pending_confirmation'
   - Return with risk_reason
5. User confirms → POST /transfers?action=confirm
6. Backend re-checks balance, creates ledger entries
7. Status → 'completed'
```

### Request Money Flow

```
1. User creates request → POST /requests?action=create
2. Request stored with status 'pending'
3. Recipient sees request in their list
4. Recipient accepts → POST /requests?action=accept
5. Transfer is created and completed immediately
6. Request status → 'accepted', linked to transaction
```

---

## 📱 Frontend Integration

### API Service Layer

Use `src/services/api.ts` for all backend calls:

```typescript
import { walletApi, transfersApi, requestsApi, transactionsApi, cardsApi, authApi } from '@/services/api';

// Get balance
const balance = await walletApi.getBalance();

// Send money
const result = await transfersApi.send({
  recipient_wallet_id: '...',
  amount: 50,
  description: 'Dinner split'
});

// Check if needs confirmation
if (result.status === 'pending_confirmation') {
  // Show confirmation dialog
  await transfersApi.confirm(result.transaction.id);
}
```

---

## 🧪 Demo Scenarios

Test these flows to verify the backend:

1. **Small Transfer ($10)** → Completes instantly
2. **Large Transfer ($600)** → Requires confirmation
3. **First-Time Recipient** → Requires confirmation
4. **Request → Accept** → Creates completed transfer
5. **Freeze/Unfreeze Card** → Card state updates

---

## 📁 File Structure

```
supabase/
├── config.toml                    # Edge function config
└── functions/
    ├── wallet/index.ts            # Wallet operations
    ├── transfers/index.ts         # Send money, confirm
    ├── requests/index.ts          # Money requests
    ├── transactions/index.ts      # History, insights
    └── cards/index.ts             # Card management

src/
├── services/api.ts                # Frontend API client
├── integrations/supabase/
│   ├── client.ts                  # Auto-generated client
│   └── types.ts                   # Auto-generated types
└── components/screens/
    └── AuthScreen.tsx             # Login/signup screen

docs/
└── BACKEND_REFERENCE_PYTHON.md    # Python/FastAPI migration guide
```

---

## 🚀 Next Steps

1. **Test the auth flow**: Sign up and verify wallet/card creation
2. **Test send money**: Try small and large transfers
3. **Test requests**: Create and accept money requests
4. **Connect frontend**: Replace mock data with real API calls
5. **Add Stripe later**: Backend is designed for easy Stripe integration