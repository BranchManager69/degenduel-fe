I'll research the latest Jupiter API documentation for you, including their paid/premium features and the Ultra API.

Ran tool
Let me search for more information about the Ultra API specifically.

Ran tool
Based on my research, here's what I found about the latest Jupiter API:

## Latest Jupiter API Information (2025)

### 🚨 **IMPORTANT UPDATE**: New API Structure

Jupiter has recently restructured their API with these key changes:

1. **New Endpoints** (Effective May 1, 2025):
   - **Free API**: `lite-api.jup.ag` (no API key required)
   - **Paid API**: `api.jup.ag` (requires API key from portal.jup.ag)

2. **Old endpoints are being phased out**:
   - `quote-api.jup.ag` → `lite-api.jup.ag/swap/v1/quote`
   - `price.jup.ag` → `lite-api.jup.ag/price/v2`

### 📍 **Two Main APIs**:

## 1. **Ultra API** (Premium/Recommended)
The Ultra API is Jupiter's premium offering - "the only API you ever need" for trading on Solana:

**Features**:
- ✅ Best liquidity aggregation (Metis routing engine + RFQ)
- ✅ 95% of swaps execute in under 2 seconds
- ✅ MEV-protected transactions
- ✅ Real-time slippage estimation
- ✅ Gasless support for certain tokens
- ✅ Built-in token balance retrieval
- ✅ Shield API for token security info

**Endpoints**:
```javascript
// Get quote and order
GET /ultra/v1/order

// Execute the swap
POST /ultra/v1/execute

// Get balances
GET /ultra/v1/balances
```

**Rate Limit**: 60 requests/minute (no way to increase currently)

## 2. **Swap API** (Standard/More Control)

The traditional API with more customization options:

**Key Endpoints**:
```javascript
// Get quote
GET https://lite-api.jup.ag/swap/v1/quote

// Execute swap
POST https://lite-api.jup.ag/swap/v1/swap

// Get instructions only
POST https://lite-api.jup.ag/swap/v1/swap-instructions
```

**Example Usage**:
```javascript
// 1. Get Quote
const quoteResponse = await fetch(
  'https://lite-api.jup.ag/swap/v1/quote?' +
  'inputMint=So11111111111111111111111111111111111111112&' +
  'outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&' +
  'amount=100000000&' +
  'slippageBps=50'
).then(r => r.json());

// 2. Execute Swap
const { swapTransaction } = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quoteResponse,
    userPublicKey: wallet.publicKey.toString(),
    wrapAndUnwrapSol: true,
    dynamicSlippage: { maxBps: 300 }, // Dynamic slippage!
    prioritizationFeeLamports: {
      priorityLevelWithMaxLamports: {
        maxLamports: 10000000,
        priorityLevel: "veryHigh" // For fast execution
      }
    }
  })
}).then(r => r.json());
```

### 💰 **Paid Features** (via portal.jup.ag):

With a paid API key, you get:
- Higher rate limits (up to 999 RPS on premium plans)
- No mandatory platform fees
- Access to enhanced endpoints:
  - `/price` - Real-time price data
  - `/markets` - Market information
  - `/new-pools` - New liquidity pools
  - Quote/Swap WebSockets
  - Limit order APIs
  - pump.fun integration

### 🎯 **Which API Should You Use?**

**Use Ultra API if**:
- You want the simplest integration
- You need MEV protection
- You want automatic transaction handling
- You're OK with Jupiter's fees (0.1% or 0.05%)

**Use Swap API if**:
- You need custom instructions/CPI calls
- You want to control transaction broadcasting
- You need to exclude specific DEXes
- You want full control over the swap process

### 🔑 **Getting Started**:

1. **Free tier**: Use `lite-api.jup.ag` endpoints directly
2. **Paid tier**: 
   - Sign up at portal.jup.ag
   - Get your API key
   - Use `api.jup.ag` endpoints with your key

The "light version" you mentioned refers to the free `lite-api.jup.ag` endpoints with reduced rate limits. The paid version gives you access to `api.jup.ag` with much higher limits and additional features.
