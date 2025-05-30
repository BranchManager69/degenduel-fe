# AI Function Calling Reference Guide

**DegenDuel Terminal AI - DIDI Function Calling System**

> Complete documentation of available AI functions, parameters, responses, and usage examples.

---

## Table of Contents

1. [Overview](#overview)
2. [Function Categories](#function-categories)
3. [Authentication & Permissions](#authentication--permissions)
4. [Token Data Functions](#token-data-functions)
5. [Contest Functions](#contest-functions)
6. [User Profile Functions](#user-profile-functions)
7. [Platform Activity Functions](#platform-activity-functions)
8. [Administrative Functions](#administrative-functions)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)
11. [Implementation Notes](#implementation-notes)

---

## Overview

The DegenDuel AI terminal (DIDI) uses OpenAI's function calling system to provide structured data responses. This system allows the AI to:

- Fetch real-time token prices and metrics
- Query contest information and leaderboards
- Retrieve user profiles and statistics
- Access platform activity and administrative data
- Provide formatted, contextual responses

### Technical Details
- **Backend Handler**: `services/ai-service/utils/terminal-function-handler.js`
- **Function Count**: 14 total functions
- **Public Functions**: 9 (no authentication required)
- **Admin Functions**: 5 (requires admin/superadmin role)
- **Database**: PostgreSQL with Prisma ORM
- **Response Format**: Structured JSON with formatted numbers and dates

---

## Function Categories

| Category | Functions | Access Level | Description |
|----------|-----------|--------------|-------------|
| **Token Data** | 4 functions | Public | Real-time and historical token information |
| **Contest** | 1 function | Public | Contest status and participation data |
| **User Profile** | 3 functions | Public | User information and statistics |
| **Platform Activity** | 1 function | Public | Platform-wide activity feeds |
| **Administrative** | 5 functions | Admin Only | System status and management data |

---

## Authentication & Permissions

### Permission Levels

1. **Public Functions** (No authentication required)
   - Available to all users
   - Rate-limited but unrestricted access
   - Includes most data retrieval functions

2. **Admin Functions** (Requires elevated privileges)
   - Available to users with `admin` or `superadmin` role
   - Provides system-level insights
   - Protected by role-based access control

### Permission Check Logic
```javascript
const isAdministratorFunction = functionName.startsWith('get') && (
  functionName === 'getServiceStatus' ||
  functionName === 'getSystemSettings' ||
  functionName === 'getWebSocketStats' ||
  functionName === 'getIPBanStatus' ||
  functionName === 'getDiscordWebhookEvents'
);

const userRole = options.userRole || 'user';
const isAdministrator = userRole === 'admin' || userRole === 'superadmin';

if (isAdministratorFunction && !isAdministrator) {
  return {
    error: "Permission denied",
    details: "This info requires administrator privileges",
    function: functionName
  };
}
```

---

## Token Data Functions

### 1. `getTokenPrice`

**Description**: Retrieves current price and comprehensive token information.

**Parameters**:
```json
{
  "tokenAddressOrSymbol": {
    "type": "string",
    "required": true,
    "description": "Token address (preferred) or symbol"
  }
}
```

**Response Structure**:
```json
{
  "symbol": "DEGEN",
  "name": "Degen Token",
  "address": "So11111111111111111111111111111111111111112",
  "price": "1.23",
  "price_change_24h": "5.67",
  "market_cap": "123.45M",
  "volume_24h": "1.23M",
  "liquidity": "456.78K",
  "updated_at": "2025-05-26T20:15:00.000Z",
  "social_links": {
    "website": "https://degen.com",
    "twitter": "https://twitter.com/degentoken",
    "telegram": "https://t.me/degentoken",
    "discord": "https://discord.gg/degen"
  },
  "tags": ["defi", "gaming", "meme"],
  "is_monitored": true,
  "monitor_buys": true,
  "monitor_sells": true,
  "min_transaction_value": "1000"
}
```

**Key Features**:
- Prioritizes token address lookup over symbol
- Includes social media links from `token_socials` table
- Adds website information from `token_websites` table
- Shows monitoring status for tracked tokens
- Automatically formats large numbers (1.23M, 456.78K, etc.)

### 2. `getTokenPriceHistory`

**Description**: Retrieves historical price data for a token over specified timeframes.

**Parameters**:
```json
{
  "tokenAddressOrSymbol": {
    "type": "string",
    "required": true,
    "description": "Token address or symbol"
  },
  "timeframe": {
    "type": "string",
    "enum": ["24h", "7d", "30d", "all"],
    "required": true,
    "description": "Time period for price history"
  }
}
```

**Response Structure**:
```json
{
  "symbol": "DEGEN",
  "name": "Degen Token",
  "timeframe": "24h",
  "dataPoints": 24,
  "history": [
    {
      "timestamp": "2025-05-26T19:00:00.000Z",
      "price": "1.23",
      "source": "dexscreener"
    }
  ]
}
```

**Timeframe Calculations**:
- `24h`: Last 24 hours from current time
- `7d`: Last 7 days from current time
- `30d`: Last 30 days from current time
- `all`: Complete historical data (from Unix epoch)

### 3. `getTokenPools`

**Description**: Retrieves liquidity pool information for a token across different DEXs.

**Parameters**:
```json
{
  "tokenAddressOrSymbol": {
    "type": "string",
    "required": true,
    "description": "Token address or symbol"
  }
}
```

**Response Structure**:
```json
{
  "symbol": "DEGEN",
  "name": "Degen Token", 
  "address": "So11111111111111111111111111111111111111112",
  "poolCount": 3,
  "pools": [
    {
      "dex": "Raydium",
      "address": "pool_address_here",
      "size": 12345,
      "program": "program_id_here",
      "updated": "2025-05-26T20:15:00.000Z"
    }
  ]
}
```

**Features**:
- Limited to top 5 pools by default
- Includes DEX information (Raydium, Orca, etc.)
- Shows pool size and program IDs
- Timestamps for last update

### 4. `getTokenMetricsHistory`

**Description**: Retrieves comprehensive historical metrics for tokens (price, rank, volume, liquidity, market cap).

**Parameters**:
```json
{
  "tokenAddressOrSymbol": {
    "type": "string", 
    "required": true,
    "description": "Token address or symbol"
  },
  "metricType": {
    "type": "string",
    "enum": ["price", "rank", "volume", "liquidity", "market_cap"],
    "required": true,
    "description": "Type of metric to retrieve"
  },
  "timeframe": {
    "type": "string",
    "enum": ["24h", "7d", "30d", "all"],
    "description": "Time period for metrics"
  },
  "limit": {
    "type": "integer",
    "default": 100,
    "description": "Maximum data points to return"
  }
}
```

---

## Contest Functions

### 5. `getActiveContests`

**Description**: Retrieves information about currently active and upcoming contests.

**Parameters**:
```json
{
  "limit": {
    "type": "integer",
    "default": 5,
    "description": "Maximum contests to return"
  },
  "includeUpcoming": {
    "type": "boolean", 
    "default": true,
    "description": "Include upcoming contests"
  }
}
```

**Response Structure**:
```json
{
  "count": 3,
  "contests": [
    {
      "name": "Weekend Warrior Contest",
      "code": "WW-001",
      "description": "Trade your way to victory this weekend",
      "status": "active",
      "start": "2025-05-26T12:00:00.000Z",
      "end": "2025-05-26T23:59:59.000Z", 
      "entryFee": "100",
      "prizePool": "10.50K",
      "participants": {
        "current": 45,
        "min": 10,
        "max": 100
      },
      "timeInfo": "Active - Ends in 3h 45m"
    }
  ]
}
```

**Contest Status Values**:
- `active`: Contest is currently running
- `pending`: Contest is scheduled to start
- `completed`: Contest has ended
- `cancelled`: Contest was cancelled

**Time Info Logic**:
- For active contests: Shows time remaining
- For pending contests: Shows time until start
- Uses human-readable format (hours/minutes or days)

---

## User Profile Functions

### 6. `getUserProfile`

**Description**: Retrieves comprehensive profile information for a specific user.

**Parameters**:
```json
{
  "usernameOrWallet": {
    "type": "string",
    "required": true,
    "description": "Username or wallet address"
  }
}
```

**Response Structure**:
```json
{
  "username": "DegenTrader",
  "nickname": "The Degen King",
  "wallet_address": "wallet_address_here",
  "role": "user",
  "level": {
    "number": 15,
    "title": "Expert Trader",
    "className": "EXPERT"
  },
  "experience": {
    "current": 2500,
    "nextLevel": 2700
  },
  "profile": {
    "image_url": "https://example.com/profile.jpg",
    "created_at": "2025-01-01T00:00:00.000Z",
    "last_login": "2025-05-26T19:30:00.000Z"
  },
  "stats": {
    "contests_entered": 25,
    "contests_won": 8,
    "total_prize_money": "1250.00",
    "best_score": "1850.50",
    "avg_score": "1234.75"
  },
  "achievements": [
    {
      "type": "first_win",
      "tier": "gold",
      "category": "contest",
      "achieved_at": "2025-02-15T10:30:00.000Z",
      "xp_awarded": 100
    }
  ],
  "social": [
    {
      "platform": "twitter",
      "username": "@degentrader",
      "verified": true
    }
  ],
  "wallet": {
    "balance": "12.3456 SOL",
    "last_updated": "2025-05-26T20:00:00.000Z"
  },
  "referral": {
    "code": "DEGEN123",
    "referred_by": "REFER456"
  }
}
```

**Lookup Logic**:
- Input length 32-44 characters = treated as wallet address
- Shorter input = treated as username
- Case-insensitive username matching

### 7. `getTopUsers`

**Description**: Retrieves leaderboard of top users by various metrics.

**Parameters**:
```json
{
  "category": {
    "type": "string",
    "enum": ["contests_won", "earnings", "experience", "referrals"],
    "required": true,
    "description": "Ranking category"
  },
  "limit": {
    "type": "integer",
    "default": 10,
    "description": "Number of users to return"
  }
}
```

**Response Structure**:
```json
{
  "category": "contests_won",
  "count": 10,
  "users": [
    {
      "username": "TopTrader",
      "nickname": "The Champion",
      "profile_image": "https://example.com/avatar.jpg",
      "role": "user",
      "level": 20,
      "level_title": "Master Trader",
      "contests_won": 15,
      "earnings": "5.25K" // Only for earnings category
    }
  ]
}
```

**Category Details**:
- **contests_won**: Ranked by total contest victories
- **earnings**: Ranked by total prize money earned
- **experience**: Ranked by experience points
- **referrals**: Ranked by qualified referral count

### 8. `getUserContestHistory`

**Description**: Retrieves a user's contest participation history.

**Parameters**:
```json
{
  "usernameOrWallet": {
    "type": "string",
    "required": true,
    "description": "Username or wallet address"
  },
  "limit": {
    "type": "integer",
    "default": 5,
    "description": "Maximum contests to return"
  }
}
```

**Response Structure**:
```json
{
  "username": "DegenTrader",
  "nickname": "The Degen King",
  "wallet_address": "wallet_address_here",
  "contest_count": 5,
  "contests": [
    {
      "name": "Weekend Warrior",
      "code": "WW-001",
      "status": "completed",
      "joined_at": "2025-05-25T10:00:00.000Z",
      "entry_time": "2025-05-25T10:05:00.000Z",
      "initial_balance": "10000",
      "final_rank": 3,
      "portfolio_value": "12500",
      "prize_amount": "500",
      "prize_paid": true,
      "contest_info": {
        "start": "2025-05-25T12:00:00.000Z",
        "end": "2025-05-25T23:59:59.000Z",
        "prize_pool": "5000",
        "total_participants": 50
      }
    }
  ]
}
```

---

## Platform Activity Functions

### 9. `getPlatformActivity`

**Description**: Retrieves recent platform-wide activity across different categories.

**Parameters**:
```json
{
  "activityType": {
    "type": "string",
    "enum": ["contests", "trades", "achievements", "transactions"],
    "required": true,
    "description": "Type of activity to retrieve"
  },
  "limit": {
    "type": "integer",
    "default": 10,
    "description": "Maximum activities to return"
  }
}
```

**Activity Types**:
- **contests**: Recent contest starts, completions, and major events
- **trades**: Recent high-value or significant trades
- **achievements**: Recently earned achievements across the platform
- **transactions**: Recent financial transactions (prizes, deposits, etc.)

---

## Administrative Functions

> **Note**: All administrative functions require `admin` or `superadmin` role.

### 10. `getServiceStatus`

**Description**: Retrieves status information for platform services.

**Parameters**:
```json
{
  "serviceName": {
    "type": "string",
    "description": "Specific service to check (optional)"
  }
}
```

### 11. `getSystemSettings`

**Description**: Retrieves current platform system settings.

**Parameters**:
```json
{
  "settingKey": {
    "type": "string", 
    "description": "Specific setting to retrieve (optional)"
  }
}
```

### 12. `getWebSocketStats`

**Description**: Retrieves WebSocket connection statistics.

**Parameters**:
```json
{
  "timeframe": {
    "type": "string",
    "enum": ["now", "today", "week"],
    "required": true,
    "description": "Time period for connection statistics"
  }
}
```

### 13. `getIPBanStatus`

**Description**: Retrieves information about banned IP addresses.

**Parameters**:
```json
{
  "ipAddress": {
    "type": "string",
    "description": "Specific IP to check (optional)"
  },
  "limit": {
    "type": "integer",
    "default": 10,
    "description": "Maximum banned IPs to return"
  }
}
```

### 14. `getDiscordWebhookEvents`

**Description**: Retrieves recent Discord notification events.

**Parameters**:
```json
{
  "eventType": {
    "type": "string",
    "enum": ["contest_start", "contest_end", "new_user", "achievement"],
    "description": "Type of Discord event to retrieve"
  },
  "limit": {
    "type": "integer",
    "default": 5,
    "description": "Maximum events to return"
  }
}
```

---

## Error Handling

### Common Error Response Format
```json
{
  "error": "Error description",
  "details": "Detailed error information",
  "function": "functionName",
  "searched": { /* original search parameters */ }
}
```

### Error Types

1. **Permission Denied**
   ```json
   {
     "error": "Permission denied",
     "details": "This info requires administrator privileges",
     "function": "getServiceStatus"
   }
   ```

2. **Not Found**
   ```json
   {
     "error": "Token not found",
     "searched": { "symbol": "INVALID", "address": null },
     "function": "getTokenPrice"
   }
   ```

3. **Invalid Parameters**
   ```json
   {
     "error": "Invalid category",
     "details": "Category 'invalid_cat' is not supported",
     "function": "getTopUsers"
   }
   ```

4. **Database Error**
   ```json
   {
     "error": "Failed to fetch user profile", 
     "details": "Connection timeout",
     "function": "getUserProfile"
   }
   ```

---

## Usage Examples

### Token Information Query
```
User: "What's the current price of DEGEN?"
AI calls: getTokenPrice({ tokenAddressOrSymbol: "DEGEN" })
Response: "DEGEN is currently trading at $1.23 with a market cap of 123.45M..."
```

### Contest Status Check
```
User: "Are there any active contests?"
AI calls: getActiveContests({ limit: 5, includeUpcoming: true })
Response: "Yes! There are 2 active contests: Weekend Warrior (ends in 3h 45m)..."
```

### User Profile Lookup
```
User: "Show me DegenTrader's profile"
AI calls: getUserProfile({ usernameOrWallet: "DegenTrader" })
Response: "DegenTrader is a Level 15 Expert Trader with 8 contest wins..."
```

### Historical Analysis
```
User: "Show me SOL price history for the last week"
AI calls: getTokenPriceHistory({ tokenAddressOrSymbol: "SOL", timeframe: "7d" })
Response: "Here's SOL's price movement over the last 7 days: [chart data]..."
```

---

## Implementation Notes

### Database Integration
- Uses Prisma ORM for database queries
- Leverages PostgreSQL with proper indexing
- Includes related data through Prisma relations
- Optimized queries with selective field fetching

### Performance Considerations
- Default limits prevent excessive data retrieval
- Indexed database columns for fast lookups
- Formatted numbers cached where possible
- Efficient date range calculations

### Security Features
- Role-based access control for admin functions
- Input validation and sanitization
- SQL injection prevention through Prisma
- Rate limiting applied at API level

### Data Formatting
- Large numbers formatted with K/M/B suffixes
- Dates converted to ISO strings
- Decimal precision maintained for financial data
- Social links aggregated from multiple tables

### Future Enhancements
- Additional metric types for `getTokenMetricsHistory`
- More granular timeframe options
- Caching layer for frequently requested data
- Real-time data streaming capabilities
- Enhanced error messages with suggested alternatives

---

## Related Documentation

- **Backend API Documentation**: `/services/ai-service/README.md`
- **Frontend AI Service**: `/src/services/ai.ts`
- **Database Schema**: `/docs/database-schema.md`
- **WebSocket API**: `/docs/websocket-api.md`