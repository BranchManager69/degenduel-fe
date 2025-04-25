# Token Balance WebSocket Integration Guide

## Overview

DegenDuel provides real-time token balance tracking through the unified WebSocket system (v69). This allows users to see their token balances update in real-time when transactions occur.

## Implementation

The frontend implementation uses the standardized `useWallet` hook from the unified WebSocket system.

### Using the TokenBalanceDisplay Component

We provide a ready-to-use `TokenBalanceDisplay` component:

```tsx
import { TokenBalanceDisplay } from '../components';

function YourComponent() {
  return (
    <div>
      <h2>Your Wallet</h2>
      <TokenBalanceDisplay walletAddress="optional-specific-wallet-address" />
    </div>
  );
}
```

The component automatically:
- Connects to the WebSocket
- Subscribes to wallet balance updates
- Displays SOL balance and token balances
- Provides a refresh button
- Shows token addresses on demand

### Using the useWallet Hook Directly

For custom implementations, use the `useWallet` hook directly:

```tsx
import { useWallet } from '../hooks/websocket/topic-hooks/useWallet';

function YourCustomComponent() {
  const {
    balance,           // Contains wallet_address, sol_balance, and tokens array
    getTokenBalance,   // Helper function to get balance for a specific token symbol
    refreshWallet,     // Force refresh of wallet data
    isLoading,         // Loading state
    isConnected,       // WebSocket connection state
    lastUpdate         // Last time data was updated
  } = useWallet();
  
  // Access all token balances
  const tokenBalances = balance?.tokens || [];
  
  // Or get a specific token balance
  const solanaBalance = getTokenBalance('SOL');
  
  // Implement your UI here...
}
```

## WebSocket Protocol Details

The wallet data uses these topics:
- `wallet` - For transactions and settings
- `wallet-balance` - For balance updates

### Message Format

Balance update messages follow this format:

```typescript
{
  type: 'DATA',
  topic: 'wallet-balance',
  data: {
    wallet_address: string,
    sol_balance: number,
    tokens: Array<{
      address: string,
      symbol: string,
      balance: number,
      value_usd?: number
    }>
  }
}
```

## Integration Tips

1. The hook automatically handles authentication, so no manual token management is needed
2. Balance updates are received in real-time when:
   - User connects their wallet
   - Transactions occur
   - Server-side data is updated
   - Refresh is requested manually
3. The `refreshWallet()` function can be called any time to force a refresh
4. Use the loading and connection states to show appropriate UI feedback
5. Connection is managed by the unified WebSocket system - no need for manual reconnection logic

## Example Implementation

See the `TokenBalanceDisplay.tsx` component for a complete implementation example that follows best practices.