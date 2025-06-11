# DegenDuel Frontend REST API Endpoints Reference

> **Generated from actual codebase analysis - NOT from outdated documentation**
> Last Updated: January 2025

This document provides a comprehensive list of all REST API endpoints used in the DegenDuel frontend codebase, organized by category.

---

## 📊 Portfolio Management Endpoints

### Core Portfolio Operations
- **GET** `/api/contests/{contestId}/portfolio/{walletAddress}`
  - Retrieves user's portfolio for a specific contest
  - Returns: `{ tokens: [{contractAddress, weight}] }`

- **POST** `/api/contests/{contestId}/portfolio`
  - Submit initial portfolio for a contest
  - Body: `{ wallet_address, tokens: [{contractAddress, weight}] }`

- **PUT** `/api/contests/{contestId}/portfolio`
  - Update existing portfolio for a contest
  - Body: `{ wallet_address, tokens: [{contractAddress, weight}] }`

### Portfolio Data & Analytics
- **GET** `/api/portfolios/user/{walletAddress}`
  - Get all portfolios for a user across contests
  - Query params: `?limit=50&offset=0&include_tokens=true&include_performance=false`

- **POST** `/api/portfolios/batch`
  - Batch retrieve portfolios for multiple contests
  - Body: `{ contest_ids: number[], include_tokens: boolean }`

- **GET** `/api/contests/{contestId}/performance?wallet_address={wallet}`
  - Get portfolio performance metrics for a contest
  - Returns: portfolio value, change percentage, ranking

- **GET** `/api/blinks/ai-portfolio?contest_id={id}&wallet_address={wallet}`
  - Get AI-recommended portfolio selection

---

## 🏆 Contest Management Endpoints

### Contest CRUD Operations
- **GET** `/api/contests`
  - List all contests with optional filtering/sorting
  - Returns array with participation status if authenticated

- **GET** `/api/contests/{contestId}`
  - Get detailed information for a specific contest

- **POST** `/api/contests` *(Admin only)*
  - Create a new contest
  - Body: Full contest configuration

- **PUT** `/api/contests/{contestId}` *(Admin only)*
  - Update existing contest
  - Body: Partial contest data to update

- **DELETE** `/api/contests/{contestId}` *(Admin only)*
  - Delete a contest

### Contest Participation
- **POST** `/api/contests/{contestId}/join`
  - Join a contest (without portfolio)
  - Body: `{ wallet_address, transaction_signature? }`

- **POST** `/api/contests/{contestId}/enter`
  - Enter contest with portfolio selection
  - Body: `{ wallet_address, portfolio: { tokens: [{contractAddress, weight}] }, transaction_signature? }`

- **GET** `/api/contests/{contestId}/check-participation?wallet_address={wallet}`
  - Check if user is participating in contest
  - Returns: `{ participating: boolean, participant_data? }`

- **GET** `/api/contests/{contestId}/view`
  - Get comprehensive contest view data
  - Includes participants, portfolios, leaderboard

- **GET** `/api/contests/participations/{walletAddress}`
  - Get all contests user is participating in

### Contest Scheduling
- **GET** `/api/contests/schedules`
  - Get all scheduled contests

- **GET** `/api/contests/schedules/{id}`
  - Get specific contest schedule details

---

## 💳 Contest Credits System

- **GET** `/api/contests/credits/balance`
  - Get user's current credit balance
  - Requires: Authorization header

- **GET** `/api/contests/credits/config`
  - Get credit system configuration
  - Returns pricing tiers, bonus rates

- **POST** `/api/contests/credits/purchase`
  - Purchase contest credits
  - Body: `{ transaction_signature, token_amount, credits_requested }`

- **POST** `/api/blinks/purchase-contest-credit`
  - Generate Solana transaction for credit purchase
  - Body: `{ account, params: { tokenAmount, creditAmount } }`

---

## 📈 Token & Trading Endpoints

### Token Data
- **GET** `/api/tokens`
  - Get all available tokens
  - Query params: `?active=true&bucket=1&search=term`

- **GET** `/api/tokens/{id}`
  - Get detailed information for specific token

- **GET** `/api/tokens/trending`
  - Get trending tokens list
  - Query params: `?limit=50&offset=0&format=paginated`

- **POST** `/api/tokens` *(Admin only)*
  - Add new token to platform
  - Body: `{ symbol, name, bucket_id?, is_active? }`

- **PUT** `/api/tokens/{id}` *(Admin only)*
  - Update token information

### Price Data
- **GET** `/api/tokens/prices`
  - Get current prices for all tokens

- **POST** `/api/tokens/prices`
  - Get bulk token prices
  - Body: `{ token_addresses: string[] }`

- **GET** `/api/tokens/prices/{tokenId}`
  - Get historical price data for token

### Transactions
- **GET** `/api/transactions`
  - Get transaction history

---

## 👤 User & Wallet Endpoints

### User Profile
- **GET** `/api/users`
  - Get all users list

- **GET** `/api/users/{wallet}`
  - Get user details and balance

- **PUT** `/api/users/{wallet}`
  - Update user nickname
  - Body: `{ nickname }`

- **PUT** `/api/users/{wallet}/settings`
  - Update user settings/preferences
  - Body: `{ settings }`

- **GET** `/api/users/{wallet}/profile-image`
  - Get user's profile image URL

### User Stats & Achievements
- **GET** `/api/users/{wallet}/level`
  - Get user level and achievements data

- **GET** `/api/stats/{wallet}`
  - Get comprehensive user statistics

- **GET** `/api/stats/{wallet}/history?limit=10&offset=0`
  - Get historical stats data

- **GET** `/api/stats/{wallet}/achievements`
  - Get user's unlocked achievements

### Whale Room
- **GET** `/api/user/whale-status`
  - Check user's whale room eligibility

- **POST** `/api/user/whale-status/refresh`
  - Force refresh whale status check

### Balance Management
- **POST** `/api/users/{wallet}/balance` *(Admin only)*
  - Adjust user's platform balance
  - Body: `{ amount }`

---

## 🏅 Leaderboards & Rankings

- **GET** `/api/leaderboard/global?limit=10&offset=0`
  - Get global rankings by DD Points

- **GET** `/api/leaderboard/contests/performance?timeframe=month&limit=10&offset=0`
  - Get contest performance rankings
  - Timeframe options: day, week, month, all

---

## 🔧 Admin Endpoints

### Platform Statistics
- **GET** `/api/admin/stats/platform`
  - Get overall platform statistics

- **GET** `/api/admin/stats/activity`
  - Get recent platform activity logs

### Maintenance Mode
- **GET** `/api/admin/maintenance`
  - Check maintenance mode status

- **POST** `/api/admin/maintenance`
  - Toggle maintenance mode
  - Body: `{ enabled: boolean }`

### Wallet Management
- **GET** `/api/admin/wallets/contest-wallets`
  - Get all contest wallet information

- **GET** `/api/admin/wallets/total-sol-balance`
  - Get total SOL balance across all wallets

- **GET** `/api/admin/faucet/dashboard`
  - Get faucet dashboard statistics

- **POST** `/api/admin/faucet/transfer`
  - Transfer SOL between wallets
  - Body: `{ fromAddress, toAddress, amount }`

- **POST** `/api/admin/faucet/bulk-transfer`
  - Bulk transfer SOL to multiple wallets
  - Body: `{ wallets: string[], amount }`

### Service Management
- **GET** `/api/admin/settings/service-capacities`
  - Get service capacity configurations

- **PUT** `/api/admin/settings/service-capacities`
  - Update service capacity
  - Body: `{ service, capacity }`

### Performance Monitoring
- **GET** `/api/admin/metrics/performance`
  - Get system performance metrics

- **GET** `/api/admin/metrics/memory`
  - Get memory usage statistics

- **GET** `/api/admin/metrics/service-analytics`
  - Get detailed service analytics

---

## 🔐 Authentication & System

- **GET** `/api/auth/session`
  - Check current authentication session

- **GET** `/api/status`
  - Check API availability and maintenance status

- **GET** `/api/superadmin/token`
  - Get superadmin authentication token

- **GET** `/api/superadmin/logs/available`
  - List available log files

- **GET** `/api/superadmin/logs/{filename}`
  - Retrieve specific log file content

---

## 🔌 WebSocket Connection

- **WSS** `/api/v69/ws`
  - Unified WebSocket endpoint for real-time updates
  - Topics: market-data, portfolio, system, contest, user, admin, wallet, skyduel, logs

---

## 📝 Notes

1. **Authentication**: Most endpoints require JWT authentication via Authorization header
2. **Admin Endpoints**: Require admin role in JWT claims
3. **Free Contests**: `transaction_signature` is optional for free contest entry
4. **Pagination**: Most list endpoints support `limit` and `offset` query parameters
5. **Error Responses**: All endpoints follow consistent error format with status codes and messages

---

*This document was generated by analyzing the actual frontend codebase implementation, not outdated documentation.*