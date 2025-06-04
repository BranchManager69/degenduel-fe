# Solana RPC Method Restrictions Analysis

## Overview
This document analyzes the Solana RPC method restrictions encountered in the DegenDuel frontend and provides recommendations for resolving them.

## Current RPC Restrictions

Your Solana RPC endpoint is currently in **"public tier"** which only allows these methods:

### ✅ Currently Allowed Methods:
- `getLatestBlockhash`
- `getBalance`
- `getAccountInfo`
- `getTokenAccountsByOwner`
- `getTokenAccountBalance`
- `getSignatureStatuses`
- `getBlockHeight`
- `getBlockTime`
- `getSlot`
- `getRecentBlockhash`
- `getRecentPerformanceSamples`
- `getHealthStatus`
- `getVersion`

### ❌ Currently Blocked Methods (Causing Errors):
- `getTokenSupply` - **Error**: Method not allowed for public access tier
- `getSignaturesForAddress` - **Error**: Method not allowed for public access tier
- `getParsedTransaction` - **Error**: Method not allowed for public access tier (inferred)

## What's Triggering These RPC Calls

### 1. `getTokenSupply` Calls
**Triggered by**: `useSolanaTokenData` hook (line 108)
**Purpose**: Fetching token supply and decimal information
**Used in components**:
- `SolanaTokenDisplay` - Shows token metadata and supply
- `TokenDetailPage` - Displays detailed token information
- `Portfolio` views - Shows token details in user portfolios
- `CompactBalance` - Used in headers/navigation for token displays

### 2. `getSignaturesForAddress` Calls  
**Triggered by**: `useSolanaWalletData` hook (line 115)
**Purpose**: Fetching recent transaction history for wallet addresses
**Used in components**:
- `SolanaWalletDisplay` - Shows wallet transaction history
- `WalletPage` - Displays user's transaction history (/wallet route)
- `WalletDetailsSection` (in SharedMenuComponents) - Transaction history in user menus
- Public demo page (`/solana-demo`) - Demonstrates wallet data access

### 3. Additional Related Methods (Also Likely Blocked)
**`getParsedTransaction`**: Called in `useSolanaWalletData` (line 129)
- **Purpose**: Fetching detailed transaction information
- **Used when**: Users click on transactions to see details

## Frontend Components Affected

### Core Display Components:
1. **`SolanaTokenDisplay`** (`/src/components/SolanaTokenDisplay.tsx`)
   - Shows token information including supply
   - Used throughout the app for token displays

2. **`SolanaWalletDisplay`** (`/src/components/SolanaWalletDisplay.tsx`)
   - Shows wallet balances and transaction history  
   - Primary component for wallet information display

3. **`CompactBalance`** (`/src/components/ui/CompactBalance.tsx`)
   - Used in headers and navigation
   - Shows condensed wallet/token information

### Page-Level Components:
1. **Wallet Page** (`/wallet`) - Main wallet dashboard for authenticated users
2. **Token Detail Pages** (`/tokens/[address]`) - Individual token information pages
3. **Public Solana Demo** (`/solana-demo`) - Blockchain data demonstration page
4. **User Menus** - Wallet information in dropdown menus

### Hook-Level Implementation:
1. **`useSolanaTokenData`** (`/src/hooks/data/useSolanaTokenData.ts`)
   - Line 108: `connection.getTokenSupply(new PublicKey(mintAddress))`
   - Fetches token supply and decimal information

2. **`useSolanaWalletData`** (`/src/hooks/data/useSolanaWalletData.ts`)
   - Line 115: `connection.getSignaturesForAddress(publicKey, { limit: 10 })`
   - Line 129: `connection.getParsedTransaction(signature)`
   - Fetches transaction history and details

## RPC Tier System

The frontend automatically selects RPC endpoints based on user authentication:

### Public Tier (`/api/solana-rpc/public`)
- **Rate limit**: 10 requests/minute
- **Users**: Unauthenticated visitors
- **Restrictions**: Limited method set (current issue)

### User Tier (`/api/solana-rpc`)
- **Rate limit**: 120 requests/minute  
- **Users**: Authenticated users
- **Access**: Should have broader method access

### Admin Tier (`/api/solana-rpc/admin`)
- **Rate limit**: 1000 requests/minute
- **Users**: Admin and super admin users
- **Access**: Full method access

## Impact Analysis

### User Experience Impact:
- **Public visitors**: Cannot see token supply information or transaction history
- **Demo page**: Blockchain demonstration features broken
- **Token pages**: Missing critical token metadata
- **Wallet displays**: No transaction history visible

### Error Frequency:
Based on console logs, these errors occur:
- On every page load that includes token/wallet displays
- When users navigate to wallet or token pages
- When the public demo page attempts to show blockchain data

## Recommended Solutions

### Option A: Allow Additional Methods (Recommended) 🎯

**Add these methods to your public tier allowed list**:
```javascript
// Add to your Solana RPC public tier configuration:
const ADDITIONAL_PUBLIC_METHODS = [
  'getTokenSupply',           // For token metadata/decimals
  'getSignaturesForAddress',  // For transaction history  
  'getParsedTransaction'      // For transaction details
];
```

**Why this is the best approach**:
- ✅ **Safe**: These are read-only, public blockchain data queries
- ✅ **Standard**: Common methods used by most Solana applications
- ✅ **No security risk**: Cannot modify blockchain state
- ✅ **Improves UX**: Enables full functionality for public users
- ✅ **Minimal impact**: Low computational cost for these queries

### Option B: Graceful Frontend Fallback

If backend restrictions must remain, implement fallback handling:

```typescript
// Example fallback in useSolanaTokenData
try {
  const supply = await connection.getTokenSupply(mintAddress);
  setTokenData(prev => ({ ...prev, supply: supply.value.uiAmount }));
} catch (error) {
  if (error.message.includes('Method not allowed')) {
    setTokenData(prev => ({ ...prev, supply: 'Unavailable' }));
  }
}
```

**Changes required**:
- Add error handling in `useSolanaTokenData` and `useSolanaWalletData`
- Show "Data unavailable" instead of errors
- Hide transaction history sections for public users
- Use placeholder/cached token metadata

### Option C: Conditional Feature Loading

Load different components based on RPC tier:
- Public users: Simplified displays without restricted data
- Authenticated users: Full functionality with all RPC methods

## Cost and Performance Considerations

### RPC Call Frequency:
- `getTokenSupply`: ~1-5 calls per token page load
- `getSignaturesForAddress`: ~1 call per wallet display  
- `getParsedTransaction`: ~1 call per transaction detail view

### Resource Impact:
- **Very low**: These are simple read queries
- **Cacheable**: Results can be cached to reduce repeated calls
- **Standard usage**: Normal for Solana applications

### Rate Limiting:
Current public tier limit (10 requests/minute) is quite restrictive for normal usage. Consider:
- Increasing public tier limit to 30-50 requests/minute
- Implementing frontend caching to reduce RPC calls

## Implementation Priority

### High Priority (Immediate Impact):
1. **`getTokenSupply`** - Required for token displays throughout the app
2. **`getSignaturesForAddress`** - Required for wallet functionality

### Medium Priority:
1. **`getParsedTransaction`** - Required for transaction detail views
2. **Rate limit increase** - Improves overall user experience

## Technical Implementation

If proceeding with Option A (recommended), the backend team needs to:

1. **Update RPC proxy configuration** to allow additional methods for public tier
2. **Test the changes** with a sample public request
3. **Monitor resource usage** to ensure no performance impact
4. **Document the change** in backend API documentation

## Security Validation

All recommended methods are **read-only queries** that:
- ✅ Cannot modify blockchain state
- ✅ Cannot access private information
- ✅ Only return publicly available blockchain data
- ✅ Are used by standard Solana block explorers
- ✅ Have no financial or security implications

## Conclusion

**Recommendation**: Implement Option A by allowing the additional RPC methods for the public tier. This approach:
- Fixes the immediate user experience issues
- Enables full functionality of blockchain displays
- Has minimal security or performance impact
- Aligns with standard Solana application practices

The current restrictions appear overly cautious for standard read-only blockchain queries and are preventing core functionality from working properly.