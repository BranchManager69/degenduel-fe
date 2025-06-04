# 🐋 Whale Room Token Gating - Backend Integration Requirements

**To:** Backend Development Team  
**From:** Frontend Team  
**Date:** 2025-01-01  
**Subject:** Whale Room Analytics Dashboard - Token Gating Implementation

---

## 🎯 Project Overview

We've implemented a **token-gated Whale Room analytics dashboard** that provides institutional-grade market analytics exclusively to users holding 1+ million DegenDuel tokens. The frontend implementation is complete, but we need backend enhancements for optimal security and performance.

## 🚀 Current Implementation Status

✅ **Frontend Complete:**
- Whale Room analytics dashboard (`/whale-room`)
- Client-side token balance verification (1M token threshold)
- Multi-auth support (wallet/Twitter/Discord login methods)
- Auto-refresh token balance checking (30-second intervals)
- Enhanced UX with progress bars and manual refresh

⚠️ **Current Limitations:**
- Client-side verification (hackable via browser dev tools)
- RPC calls for each user token balance check
- No server-side route protection
- No real-time balance update notifications

## 🛠️ Requested Backend Enhancements

### 1. **Enhanced User Object with Token Balance**

**Request:** Add DegenDuel token balance to the user object/JWT for performance.

**Current User Object:**
```javascript
{
  id: "user123",
  wallet_address: "ABC123...",
  twitter_id: "twitter123",
  // ... other fields
}
```

**Proposed Enhanced User Object:**
```javascript
{
  id: "user123",
  wallet_address: "ABC123...",
  twitter_id: "twitter123",
  // NEW FIELDS:
  degen_token_balance: 1500000,
  whale_status: true,
  last_balance_update: "2025-01-01T12:00:00Z",
  // ... other fields
}
```

**Benefits:**
- Eliminates client-side RPC calls
- Enables server-side route protection
- Consistent data across all components
- Better performance and user experience

### 2. **New API Endpoint: Whale Status Verification**

**Endpoint:** `GET /api/user/whale-status`

**Purpose:** Dedicated endpoint for whale status verification with detailed information.

**Response Format:**
```javascript
{
  "success": true,
  "data": {
    "is_whale": true,
    "current_balance": 1500000,
    "required_balance": 1000000,
    "balance_percentage": 150.0,
    "whale_tier": "MEGA_WHALE", // Optional: Different whale tiers
    "last_updated": "2025-01-01T12:00:00Z",
    "next_refresh": "2025-01-01T12:05:00Z"
  },
  "metadata": {
    "threshold": 1000000,
    "refresh_interval": 300
  }
}
```

**Error Handling:**
```javascript
{
  "success": false,
  "error": "USER_NOT_AUTHENTICATED",
  "message": "User must be authenticated to check whale status"
}
```

### 3. **Real-Time Balance Updates via WebSocket**

**WebSocket Topic:** `user-balance`

**Message Format for Balance Updates:**
```javascript
{
  "type": "USER_UPDATE",
  "topic": "user-balance", 
  "data": {
    "user_id": "user123",
    "degen_token_balance": 1500000,
    "whale_status": true,
    "balance_change": +500000,
    "previous_balance": 1000000,
    "updated_at": "2025-01-01T12:00:00Z"
  },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

**Trigger Conditions:**
- Token balance changes (transfers, rewards, etc.)
- Periodic balance verification (every 5 minutes)
- Manual balance refresh requests

**Frontend Integration:**
- Updates user context automatically
- Triggers whale room access re-evaluation
- Updates header balance display
- Shows real-time notifications for whale status changes

### 4. **Server-Side Route Protection (Optional but Recommended)**

**Middleware:** `requireWhaleStatus`

**Implementation:**
```javascript
// Example middleware
const requireWhaleStatus = async (req, res, next) => {
  const user = req.user; // From JWT/session
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if whale status is cached in user object
  if (user.whale_status === true) {
    return next();
  }
  
  // Fallback: Check token balance directly
  const balance = await getDegenTokenBalance(user.wallet_address);
  const isWhale = balance >= 1000000;
  
  if (!isWhale) {
    return res.status(403).json({ 
      error: 'INSUFFICIENT_WHALE_STATUS',
      current_balance: balance,
      required_balance: 1000000 
    });
  }
  
  next();
};
```

**Protected Routes:**
- `GET /whale-room` (if serving static files)
- Any whale-specific API endpoints you add in the future

### 5. **Token Balance Tracking Service**

**Background Service:** Automated token balance monitoring

**Functionality:**
- Periodic balance checks for all users (every 5-10 minutes)
- Intelligent caching to minimize RPC calls
- Balance change detection and WebSocket notifications
- Whale status transitions tracking

**Database Schema Suggestion:**
```sql
CREATE TABLE user_token_balances (
  user_id VARCHAR(255) PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  degen_token_balance BIGINT DEFAULT 0,
  whale_status BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  balance_check_frequency INTEGER DEFAULT 300, -- seconds
  INDEX idx_wallet_address (wallet_address),
  INDEX idx_whale_status (whale_status)
);
```

## 🔧 Implementation Priority

### **Phase 1 (High Priority):**
1. Add `degen_token_balance` and `whale_status` to user object/JWT
2. Create `/api/user/whale-status` endpoint
3. Implement basic balance tracking service

### **Phase 2 (Medium Priority):**
1. WebSocket real-time balance updates
2. Server-side route protection middleware
3. Enhanced balance caching and optimization

### **Phase 3 (Nice to Have):**
1. Whale tier system (WHALE, MEGA_WHALE, KRAKEN, etc.)
2. Balance history tracking
3. Whale-specific features and analytics
4. Admin dashboard for whale status monitoring

## 🤝 Frontend-Backend Integration Points

### **Authentication Context Updates:**
The frontend `useMigratedAuth` hook will automatically consume the enhanced user object:

```typescript
// Frontend - Automatic consumption
const { user } = useMigratedAuth();
const isWhale = user?.whale_status || false;
const tokenBalance = user?.degen_token_balance || 0;
```

### **WebSocket Message Handling:**
Frontend will listen for balance updates and update user context:

```typescript
// Frontend - Real-time updates
useWebSocketListener('user-balance', (message) => {
  updateUser({
    degen_token_balance: message.data.degen_token_balance,
    whale_status: message.data.whale_status
  });
});
```

## 📊 Expected Performance Improvements

- **90% reduction** in client-side RPC calls
- **Instant** whale status verification (no blockchain queries)
- **Real-time** balance updates without page refresh
- **Secure** server-side validation (unhackable)
- **Scalable** architecture for future whale features

## 🐛 Known Issues to Address

1. **Passkey Login:** `GET /api/auth/passkey/login` returns 404
2. **Discord Profile Display:** Linked Discord accounts don't show in profile UI
3. **Balance Sync:** Need initial balance population for existing users

## 🎯 Success Metrics

- Zero client-side RPC calls for whale verification
- Sub-100ms whale status check response times
- Real-time balance updates across all components
- Secure whale room access (no client-side bypasses)

## 🚀 Next Steps

1. **Review this specification** with your team
2. **Estimate implementation timeline** for each phase
3. **Clarify any technical questions** about the requirements
4. **Coordinate testing** of each phase as it's implemented

## 💬 Questions for Backend Team

1. **Current Token Balance Tracking:** Do you already have any DegenDuel token balance tracking in place?
2. **WebSocket Architecture:** What's the preferred message format for your existing WebSocket system?
3. **Database Schema:** Any constraints on adding new fields to user tables?
4. **Caching Strategy:** What caching infrastructure do you prefer (Redis, in-memory, etc.)?
5. **Balance Update Frequency:** What's an acceptable balance check frequency for your RPC limits?

---

**Ready to coordinate implementation whenever you are! This whale room is going to be legendary.** 🐋✨

**Frontend Team Contact:** Available anytime for questions, clarifications, or implementation coordination. 