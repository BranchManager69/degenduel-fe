## 🔌 **DegenDuel WebSocket System - Complete Client API Summary**

### 🎯 **Available Topics & Authentication:**

| Topic | Auth Required | Description |
|-------|---------------|-------------|
| **SYSTEM** | ❌ No | Public system info, database stats |
| **MARKET_DATA** | ❌ No | Token prices, market info |
| **CONTEST** | ❌ No | Contest listings, public contest data |
| **USER** | ✅ JWT | User profiles, personal data |
| **WALLET** | ✅ JWT | Wallet transactions & settings |
| **WALLET_BALANCE** | ✅ JWT | Real-time balance monitoring |
| **PORTFOLIO** | ✅ JWT | Portfolio analytics |
| **ADMIN** | ✅ Admin JWT | Admin-only system management |
| **LOGS** | ✅ Admin JWT | Client error logging |
| **TERMINAL** | ✅ Admin JWT | Terminal data feeds |
| **CONTEST_CHAT** | ✅ JWT | Contest chat messages |

---

## 📋 **Available Actions by Topic:**

### 🌐 **SYSTEM (Public)**
```javascript
ws.request('SYSTEM', 'getStatus')        // System health
ws.request('SYSTEM', 'getSettings')      // Public settings  
ws.request('SYSTEM', 'ping')             // Latency test
ws.request('SYSTEM', 'getDatabaseStats') // 🆕 Active token count!
```

### 📊 **MARKET_DATA (Public)**
```javascript
ws.request('MARKET_DATA', 'getTokens', { filters, limit, offset })
ws.request('MARKET_DATA', 'getToken', { address })
```

### 🏆 **CONTEST (Public)**
```javascript
ws.request('CONTEST', 'getContests', { filters, limit })
ws.request('CONTEST', 'getContest', { contestId })
ws.request('CONTEST', 'getContestSchedules')
ws.request('CONTEST', 'joinContest', { contestId, tokenSelections }) // Requires auth
ws.request('CONTEST', 'createContest', { contestData }) // Requires auth
ws.request('CONTEST', 'getUserContests') // Requires auth
```

### 👤 **USER (Auth Required)**
```javascript
ws.request('USER', 'getProfile') // User profile with achievements
```

### 💰 **WALLET (Auth Required)**
```javascript
// Transactions
ws.request('WALLET', 'getTransactions', { limit, offset })
ws.request('WALLET', 'getTransaction', { id })

// Settings  
ws.request('WALLET', 'getSettings')
ws.request('WALLET', 'updateSettings', { settings })
```

### 💳 **WALLET_BALANCE (Auth Required)**
```javascript
ws.request('WALLET_BALANCE', 'getSolanaBalance', { wallet_address })
ws.request('WALLET_BALANCE', 'getTokenBalance', { wallet_address, tokenAddress })
ws.request('WALLET_BALANCE', 'getWalletBalance', { wallet_address }) // Full wallet
```

### 💬 **CONTEST_CHAT (Auth Required)**
```javascript
ws.request('CONTEST_CHAT', 'GET_MESSAGES', { contest_id })
```

### 🔧 **ADMIN (Admin Auth Required)**
```javascript
ws.request('ADMIN', 'getSystemStatus')
ws.request('ADMIN', 'getRpcBenchmarks') // RPC performance data
```

---

## 🚀 **Real-time Subscriptions:**

### 📡 **What Clients Get Automatically:**
- **Balance Updates** - Real-time SOL/token balance changes
- **Contest Updates** - Contest state changes, new contests
- **Market Data** - Token price updates
- **System Notifications** - Maintenance mode, system alerts
- **Chat Messages** - Contest chat in real-time

### 🔄 **WebSocket Connection Pattern:**
```javascript
// 1. Connect
const ws = new WebSocket('wss://degenduel.me/api/v69/ws');

// 2. Subscribe to topics
ws.send(JSON.stringify({
  type: 'SUBSCRIBE',
  topics: ['SYSTEM', 'MARKET_DATA', 'CONTEST'],
  authToken: 'jwt_token_here' // Only for auth-required topics
}));

// 3. Make requests
ws.send(JSON.stringify({
  type: 'REQUEST',
  topic: 'SYSTEM',
  action: 'getDatabaseStats',
  requestId: 'unique-id'
}));
```

---

## 🎯 **Key Features:**
- **✅ Real-time updates** - Live balance monitoring, contest changes
- **✅ Public access** - No auth needed for basic data
- **✅ Secure auth** - JWT-based authentication for sensitive data
- **✅ Request/Response** - Direct data requests with responses
- **✅ Broadcast system** - Automatic updates pushed to subscribers
- **✅ Error handling** - Comprehensive error codes and messages

**The WebSocket system is your gateway to real-time DegenDuel data! 🚀**
