
# Fix CORS Configuration to Allow Lovable Preview Domain

## Problem Identified
The CORS configuration is blocking requests from your actual preview domain. Looking at the network requests:
- **Your origin**: `https://bf010dab-705c-43c8-aeec-b4776f85a038.lovableproject.com`
- **Allowed origins**: Only `.lovable.app` domains are currently allowed

This mismatch means the browser is blocking all API calls, causing "Failed to fetch" errors and showing $0 balance.

## Solution
Update the CORS configuration to include all Lovable preview domain formats.

## Changes Required

### 1. Update CORS Configuration
**File**: `supabase/functions/_shared/cors.ts`

Add the missing `.lovableproject.com` domain pattern to the allowed origins list:

```text
Current allowed origins:
- https://id-preview--bf010dab-705c-43c8-aeec-b4776f85a038.lovable.app
- https://bf010dab-705c-43c8-aeec-b4776f85a038.lovable.app

Updated allowed origins (add):
- https://bf010dab-705c-43c8-aeec-b4776f85a038.lovableproject.com
```

### 2. Redeploy Edge Functions
After updating the CORS file, redeploy all edge functions that use it:
- wallet
- transactions
- requests
- banking
- transfers
- cards

## Expected Result
After this fix:
- All API calls will succeed
- Your $500,000 balance will display correctly
- Transactions, contacts, and all other features will work

## Technical Details
The CORS (Cross-Origin Resource Sharing) security mechanism requires the server to explicitly list which origins can make requests. The recent security hardening replaced the wildcard `*` with specific domains, but missed the `.lovableproject.com` variant that Lovable uses for preview.
