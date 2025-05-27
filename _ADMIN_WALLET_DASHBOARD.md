# Admin Wallet Management System - Frontend Integration Guide

## Overview

The Admin Wallet Management System provides both WebSocket and REST API interfaces for admins/superadmins to control their managed wallets. Each admin can only access wallets attributed to them, with full transaction capabilities including SOL/token transfers and batch operations.

## Authentication Requirements

- **Role**: Must be authenticated as admin or superadmin
- **Ownership**: Users can only control wallets where ownerId matches their user ID
- **Your User ID**: 6 (you own 286 wallets including Treasury)

---

## WebSocket Integration

### Connection

```javascript
// Connect to unified WebSocket
const ws = new WebSocket('wss://your-domain.com/api/v69/ws');

// Authenticate first
ws.send(JSON.stringify({
  type: 'AUTHENTICATE',
  token: 'your-jwt-token'
}));
```

### Message Format

```javascript
// Request format
{
  type: 'REQUEST',
  topic: 'admin',
  action: 'actionName',
  data: { /* action-specific data */ },
  requestId: 'unique-id' // optional but recommended
}

// Response format
{
  type: 'DATA',
  topic: 'admin',
  action: 'actionName',
  data: { /* response data */ },
  requestId: 'unique-id' // if provided in request
}
```

### Available WebSocket Actions

#### 1. Get Admin Wallets

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'getAdminWallets',
  requestId: 'get-wallets-1'
}));

// Response
{
  type: 'DATA',
  topic: 'admin',
  action: 'getAdminWallets',
  data: {
    wallets: [
      {
        id: 'uuid',
        public_key: 'solana-address',
        label: 'Treasury - Contest Credits',
        status: 'active',
        created_at: '2025-05-07T04:37:24.054Z',
        metadata: {}
      }
    ],
    count: 286
  }
}
```

#### 2. Get Wallet Balance

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'getWalletBalance',
  data: {
    walletId: 'wallet-uuid'
  }
}));

// Response
{
  type: 'DATA',
  topic: 'admin',
  action: 'getWalletBalance',
  data: {
    walletId: 'wallet-uuid',
    publicKey: 'solana-address',
    balance: {
      sol: 1.234567,
      tokens: [] // if applicable
    }
  }
}
```

#### 3. Transfer SOL

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'transferSOL',
  data: {
    walletId: 'wallet-uuid',
    toAddress: 'destination-solana-address',
    amount: 0.1, // SOL amount
    description: 'Optional description'
  }
}));

// Response
{
  type: 'DATA',
  topic: 'admin',
  action: 'transferSOL',
  data: {
    success: true,
    transaction: {
      signature: 'transaction-signature',
      // ... other transaction details
    },
    walletId: 'wallet-uuid',
    amount: 0.1,
    toAddress: 'destination-address'
  }
}
```

#### 4. Transfer Token

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'transferToken',
  data: {
    walletId: 'wallet-uuid',
    toAddress: 'destination-solana-address',
    mint: 'token-mint-address',
    amount: 100.5, // Token amount
    description: 'Optional description'
  }
}));
```

#### 5. Batch Transfer SOL

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'batchTransferSOL',
  data: {
    walletId: 'wallet-uuid',
    transfers: [
      {
        to_address: 'address1',
        amount: 0.1,
        description: 'Transfer 1'
      },
      {
        to_address: 'address2',
        amount: 0.2,
        description: 'Transfer 2'
      }
    ]
  }
}));
```

#### 6. Batch Transfer Token

```javascript
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'admin',
  action: 'batchTransferToken',
  data: {
    walletId: 'wallet-uuid',
    mint: 'token-mint-address',
    transfers: [
      {
        to_address: 'address1',
        amount: 50,
        description: 'Token transfer 1'
      },
      {
        to_address: 'address2',
        amount: 75,
        description: 'Token transfer 2'
      }
    ]
  }
}));
```

---

## REST API Integration

### Base URL

```
POST/GET https://your-domain.com/api/admin/wallet-management/managed-wallets
```

### Headers Required

```javascript
{
  'Authorization': 'Bearer your-jwt-token',
  'Content-Type': 'application/json'
}
```

### REST API Endpoints

#### 1. Get Admin Wallets

```http
GET /api/admin/wallet-management/managed-wallets
```

```javascript
// Response
{
  success: true,
  data: {
    wallets: [...],
    count: 286
  }
}
```

#### 2. Get Wallet Balance

```http
GET /api/admin/wallet-management/managed-wallets/{walletId}/balance
```

```javascript
// Response
{
  success: true,
  data: {
    walletId: 'uuid',
    publicKey: 'address',
    balance: { sol: 1.234 }
  }
}
```

#### 3. Transfer SOL

```http
POST /api/admin/wallet-management/managed-wallets/{walletId}/transfer/sol
```

```javascript
// Body
{
  to_address: 'destination-address',
  amount: 0.1,
  description: 'Optional description'
}

// Response
{
  success: true,
  data: {
    signature: 'transaction-signature',
    // ... transaction details
  }
}
```

#### 4. Transfer Token

```http
POST /api/admin/wallet-management/managed-wallets/{walletId}/transfer/token
```

```javascript
// Body
{
  to_address: 'destination-address',
  mint: 'token-mint-address',
  amount: 100.5,
  description: 'Optional description'
}
```

#### 5. Batch Transfer SOL

```http
POST /api/admin/wallet-management/managed-wallets/{walletId}/batch-transfer/sol
```

```javascript
// Body
{
  transfers: [
    {
      to_address: 'address1',
      amount: 0.1,
      description: 'Transfer 1'
    },
    {
      to_address: 'address2',
      amount: 0.2,
      description: 'Transfer 2'
    }
  ]
}
```

#### 6. Batch Transfer Token

```http
POST /api/admin/wallet-management/managed-wallets/{walletId}/batch-transfer/token
```

```javascript
// Body
{
  mint: 'token-mint-address',
  transfers: [
    {
      to_address: 'address1',
      amount: 50,
      description: 'Token transfer 1'
    },
    {
      to_address: 'address2',
      amount: 75,
      description: 'Token transfer 2'
    }
  ]
}
```

---

## Error Handling

### WebSocket Errors

```javascript
{
  type: 'ERROR',
  message: 'Error description',
  code: 4404 // Error code
}
```

### REST API Errors

```javascript
{
  success: false,
  error: 'Error description'
}
```

### Common Error Codes

- **4003** - Authentication required
- **4004** - Admin permissions required
- **4006** - Missing required parameters
- **4404** - Wallet not found or access denied
- **5003** - Server error during operation

---

## Rate Limits

- **REST API**: 1000 transfers per minute (essentially unlimited)
- **WebSocket**: No rate limiting
- **General requests**: 50 per minute, 500 per hour

---

## Security Notes

1. **Wallet Ownership**: Users can only access wallets where ownerId matches their user ID
2. **Admin Role Required**: All endpoints require admin/superadmin authentication
3. **Audit Logging**: All operations are logged with admin ID, IP, and context
4. **Private Key Security**: Private keys are encrypted in database and only decrypted during operations

---

## Example Frontend Implementation

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

export const useAdminWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('wss://your-domain.com/api/v69/ws');

    websocket.onopen = () => {
      // Authenticate
      websocket.send(JSON.stringify({
        type: 'AUTHENTICATE',
        token: localStorage.getItem('jwt')
      }));

      // Get wallets
      websocket.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'admin',
        action: 'getAdminWallets',
        requestId: 'get-wallets'
      }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.action === 'getAdminWallets') {
        setWallets(message.data.wallets);
      }
    };

    setWs(websocket);
    return () => websocket.close();
  }, []);

  const transferSOL = (walletId, toAddress, amount) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'admin',
        action: 'transferSOL',
        data: { walletId, toAddress, amount }
      }));
    }
  };

  return { wallets, transferSOL };
};
```

---

## Your Current Wallet Status

- **User ID**: 6
- **Total Wallets**: 286
- **Includes**: Treasury wallet + 285 managed wallets
- **Treasury Wallet**: 1318817c-dd49-4ac5-9881-fd23343d3c9a

The system is ready for volume bot implementation with full programmatic control over your wallet collection!