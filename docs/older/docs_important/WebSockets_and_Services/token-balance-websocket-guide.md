# Real-Time Token Balance WebSocket Guide

## Overview

This guide explains how to use our WebSocket API for tracking token balances in real-time. Our system provides separate topics for Solana native balance and DegenDuel token balance updates.

## Implementation

We've created two straightforward hooks for accessing these real-time balance updates:

1. `useSolanaBalance` - For native SOL balance updates
2. `useTokenBalance` - For DegenDuel token balance updates

Both hooks connect to the v69 unified WebSocket system using the appropriate topic channels. They provide automatic real-time updates from two sources:

- **Server polling**: The backend polls balances every 10 seconds
- **On-chain monitoring**: The Helius client monitors token transfers as they occur

## Using the Hooks

### SOL Balance

```jsx
import { useSolanaBalance } from '../hooks/useSolanaBalance';

function YourComponent() {
  const { 
    balance,
    isLoading,
    isConnected,
    formatBalance,
    refreshBalance,
    error
  } = useSolanaBalance(walletAddress);
  
  // Format with 4 decimal places
  const formattedSol = formatBalance(4); // "1.2345 SOL"
  
  // Refresh balance manually
  const handleRefresh = () => refreshBalance();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <p>SOL Balance: {formattedSol}</p>
      )}
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}
```

### Token Balance

```jsx
import { useTokenBalance } from '../hooks/useTokenBalance';

function YourComponent() {
  const { 
    balance,
    tokenAddress,
    isLoading,
    isConnected,
    refreshBalance,
    error
  } = useTokenBalance(walletAddress);
  
  // Refresh balance manually
  const handleRefresh = () => refreshBalance();
  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>DegenDuel Balance: {balance.toLocaleString()}</p>
          <p>Token Address: {tokenAddress}</p>
        </>
      )}
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}
```

## Ready-to-Use Components

We provide ready-to-use components for displaying balances:

```jsx
import { SolanaBalance, TokenBalance } from '../components';

function Wallet() {
  return (
    <div className="wallet-container">
      <SolanaBalance walletAddress="your-wallet-address" />
      <TokenBalance walletAddress="your-wallet-address" />
    </div>
  );
}
```

These components can also be used in compact mode for dropdown menus:

```jsx
<SolanaBalance walletAddress="your-wallet-address" compact={true} />
<TokenBalance walletAddress="your-wallet-address" compact={true} />
```

## WebSocket Message Format

### SOL Balance Messages

**Subscribe**:
```json
{
  "type": "REQUEST",
  "topic": "solana_balance",
  "action": "subscribe",
  "walletAddress": "your-wallet-address"
}
```

**Balance Update**:
```json
{
  "type": "SOLANA_BALANCE_UPDATE",
  "balance": 1.2345,
  "walletAddress": "your-wallet-address",
  "timestamp": "2025-04-10T12:34:56Z"
}
```

### Token Balance Messages

**Subscribe**:
```json
{
  "type": "REQUEST",
  "topic": "token_balance",
  "action": "subscribe",
  "walletAddress": "your-wallet-address"
}
```

**Balance Update**:
```json
{
  "type": "TOKEN_BALANCE_UPDATE",
  "balance": 1000000,
  "walletAddress": "your-wallet-address",
  "timestamp": "2025-04-10T12:34:56Z"
}
```

**Token Address**:
```json
{
  "type": "TOKEN_ADDRESS",
  "address": "TokenaddReSS111111111111111111111111111111",
  "timestamp": "2025-04-10T12:34:56Z"
}
```

## Implementation Notes

1. **Automatic Updates**: Balances are updated:
   - Every 10 seconds through server polling
   - Instantly when relevant transactions are detected on-chain
   - On initial subscription

2. Both hooks automatically:
   - Connect to the WebSocket
   - Authenticate using the stored token
   - Subscribe to the appropriate topic
   - Handle reconnection
   - Unsubscribe on unmount

3. The hooks provide:
   - True real-time balance updates without manual refreshing
   - Loading and connection states
   - Error handling
   - Backup manual refresh capability (rarely needed)

4. The components automatically handle the display of:
   - Loading states
   - Connection errors
   - Formatted balances
   - Token address display

> **Note**: Unlike traditional REST APIs, WebSockets provide continuous updates without requiring manual refreshing. Balances will automatically update in the UI when they change.