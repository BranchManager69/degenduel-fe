# DegenDuel WebSocket Messages Catalog

This is a comprehensive catalog of all WebSocket messages used by the frontend, organized by topic.

## Message Format

All messages follow this general format:
```javascript
{
  type: "REQUEST" | "COMMAND",
  topic: "<topic-name>",
  action: "<action-name>",
  data: { /* payload */ }
}
```

## Topics and Their Messages

### SYSTEM Topic (`system`)

#### Requests
- `GET_STATUS` - Get system status
- `GET_FEATURES` - Get enabled features
- `GET_MAINTENANCE` - Get maintenance mode status
- `GET_SETTINGS` - Get system settings
- `GET_COUNTDOWN_DATA` - Get countdown data for launch events
- `getDatabaseStats` - Get database statistics
- `getSystemStatus` - Get detailed system status
- `getRpcBenchmarks` - Get RPC benchmark results

#### Commands
- `UPDATE_SYSTEM_SETTINGS` - Update system settings

#### Incoming Messages (from server)
- `MAINTENANCE_MODE_UPDATE` - Maintenance mode status change
- `STATUS_UPDATE` - System status update
- `SETTINGS_UPDATE` - Settings have been updated

### WALLET Topic (`wallet`)

#### Requests
- `GET_WALLET_DATA` - Get wallet data (transactions, balance, settings)
- `SEND_TRANSACTION` - Send a transaction
- `UPDATE_SETTINGS` - Update wallet settings
- `GET_TRANSACTIONS` - Get transaction history
- `GET_TRANSACTION` - Get specific transaction details
- `GET_RECENT_TRANSACTIONS` - Get recent transactions
- `VERIFY_TRANSACTION` - Verify a transaction
- `GET_WALLET_SETTINGS` - Get wallet settings

### WALLET_BALANCE Topic (`wallet-balance`)

#### Requests
- `GET_SOLANA_BALANCE` - Get SOL balance
- `GET_TOKEN_BALANCE` - Get specific token balance
- `GET_WALLET_BALANCE` - Get complete wallet balance
- `GET_BALANCE` - Generic balance request
- `REFRESH_TOKEN_BALANCE` - Force refresh token balance

#### Incoming Messages
- `TOKEN_BALANCE_UPDATE` - Token balance has changed
- `PORTFOLIO_BALANCE_UPDATE` - Portfolio balance update

### PORTFOLIO Topic (`portfolio`)

#### Requests
- `GET_PORTFOLIO` - Get portfolio data (optionally with contestId)
- `UPDATE_PORTFOLIO` - Update portfolio allocations
- `SUBSCRIBE_PORTFOLIO_UPDATES` - Subscribe to portfolio updates
- `UNSUBSCRIBE_PORTFOLIO_UPDATES` - Unsubscribe from portfolio updates

### USER Topic (`user`)

#### Requests
- `GET_PROFILE` - Get user profile
- `UPDATE_PROFILE` - Update user profile
- `GET_USER_STATS` - Get user statistics
- `GET_USER_ACHIEVEMENTS` - Get user achievements
- `GET_USER_HISTORY` - Get user history
- `GET_USER_ACTIVITY` - Get user activity
- `VERIFY_USER` - Verify user
- `GET_NOTIFICATIONS` - Get notifications
- `MARK_AS_READ` - Mark notification as read
- `MARK_ALL_AS_READ` - Mark all notifications as read
- `CLEAR_NOTIFICATIONS` - Clear notifications
- `GET_ACHIEVEMENTS` - Get achievement list
- `GET_LEVEL` - Get user level
- `UNLOCK_ACHIEVEMENT` - Unlock an achievement
- `GET_ACHIEVEMENT_PROGRESS` - Get achievement progress

### CONTEST Topic (`contest`)

#### Requests
- `getContests` - Get all contests
- `GET_CONTESTS` - Get contests (alternative)
- `GET_CONTEST` - Get specific contest details
- `CREATE_CONTEST` - Create a new contest
- `JOIN_CONTEST` - Join a contest
- `LEAVE_CONTEST` - Leave a contest
- `GET_CONTEST_SCHEDULES` - Get contest schedules
- `GET_USER_CONTESTS` - Get user's contests
- `UPDATE_CONTEST` - Update contest details
- `CANCEL_CONTEST` - Cancel a contest
- `START_CONTEST` - Start a contest
- `END_CONTEST` - End a contest
- `GET_CONTEST_PARTICIPANTS` - Get contest participants
- `GET_CONTEST_LEADERBOARD` - Get contest leaderboard
- `GET_CONTEST_RESULTS` - Get contest results
- `SUBMIT_PORTFOLIO` - Submit portfolio for contest
- `UPDATE_PORTFOLIO` - Update contest portfolio
- `SUBSCRIBE_CONTEST_POSITIONS` - Subscribe to position updates
- `UNSUBSCRIBE_CONTEST_POSITIONS` - Unsubscribe from positions

### CONTEST_CHAT Topic (`contest-chat`)

#### Requests
- `GET_MESSAGES` - Get chat messages for a contest
- `SEND_MESSAGE` - Send a chat message
- `DELETE_MESSAGE` - Delete a message
- `PIN_MESSAGE` - Pin a message

#### Incoming Messages
- `NEW_MESSAGE` - New chat message received

### CONTEST_PARTICIPANTS Topic (`contest-participants`)

#### Requests
- `get_participants` - Get participants for a contest
- `subscribe_contest` - Subscribe to contest participant updates
- `unsubscribe_contest` - Unsubscribe from participant updates

### ADMIN Topic (`admin`)

#### Requests
- `GET_ANALYTICS` - Get analytics data
- `getContestSchedulerStatus` - Get contest scheduler status
- `controlContestScheduler` - Control contest scheduler
- `GET_SYSTEM_STATUS` - Get system status
- `GET_USER_LIST` - Get user list
- `BAN_USER` - Ban a user
- `UNBAN_USER` - Unban a user
- `GET_SYSTEM_METRICS` - Get system metrics
- `GET_ERROR_LOGS` - Get error logs
- `RESTART_SERVICE` - Restart a service
- `UPDATE_SYSTEM_SETTINGS` - Update system settings
- `rpc-benchmarks/trigger` - Trigger RPC benchmark

### MARKET_DATA Topic (`market_data`)

#### Requests
- `GET_TOKENS` - Get token list
- `GET_TOKEN` - Get specific token data
- `GET_TOKEN_DETAILS` - Get detailed token information
- `GET_PRICE_HISTORY` - Get price history
- `GET_PRICE_UPDATES` - Get price updates
- `GET_TOP_TOKENS` - Get top tokens
- `GET_TRENDING_TOKENS` - Get trending tokens
- `GET_TOKEN_STATS` - Get token statistics
- `SEARCH_TOKENS` - Search for tokens

#### Incoming Messages
- `TOKEN_UPDATE` - Token data updated
- `PRICE_UPDATE` - Price updated

### SKYDUEL Topic (`skyduel`)

#### Requests
- `get_state` - Get game state
- `GET_GAME_STATE` - Get game state (alternative)
- `JOIN_GAME` - Join a game
- `MAKE_MOVE` - Make a game move
- `FORFEIT_GAME` - Forfeit the game
- `GET_LEADERBOARD` - Get leaderboard

### TERMINAL Topic (`terminal`)

#### Requests
- `getVanityDashboard` - Get vanity dashboard data
- `GET_DATA` - Get terminal data
- `GET_COMMANDS` - Get available commands
- `EXECUTE_COMMAND` - Execute a terminal command

#### Incoming Messages
- `update` - Terminal update

### SERVICE Topic (`service`)

#### Requests
- `get_state` - Get service state
- `GET_SERVICE_STATUS` - Get service status
- `UPDATE_SERVICE` - Update service
- `RESTART_SERVICE_INSTANCE` - Restart service instance

### CIRCUIT_BREAKER Topic (`circuit_breaker`)

#### Requests
- `get_services` - Get circuit breaker services
- `reset_breaker` - Reset a circuit breaker
- `update_config` - Update circuit breaker config
- `GET_CIRCUIT_STATUS` - Get circuit status
- `TRIGGER_CIRCUIT` - Trigger circuit breaker
- `RESET_CIRCUIT` - Reset circuit

### RPC_BENCHMARK Topic (`rpc_benchmark`)

#### Requests
- `GET_RPC_STATUS` - Get RPC status
- `RUN_BENCHMARK` - Run benchmark
- `GET_BENCHMARK_RESULTS` - Get benchmark results

### LIQUIDITY_SIM Topic (`liquidity_sim`)

#### Requests
- `simulate` - Run simulation
- `simulateGrid` - Run grid simulation
- `getTokenInfo` - Get token info for simulation
- `GET_SIMULATION_PARAMS` - Get simulation parameters
- `RUN_SIMULATION` - Run simulation (alternative)
- `SAVE_SIMULATION` - Save simulation results
- `GET_SAVED_SIMULATIONS` - Get saved simulations

### VANITY_DASHBOARD Topic (`vanity_dashboard`)

#### Requests
- `GET_VANITY_WALLETS` - Get vanity wallets
- `CREATE_VANITY_WALLET` - Create vanity wallet
- `CHECK_VANITY_POOL` - Check vanity pool

### LAUNCH_EVENTS Topic (`launch_events`)

#### Requests
- `GET_LAUNCH_STATUS` - Get launch status

#### Incoming Messages
- `ADDRESS_REVEALED` - Contract address revealed

### ANALYTICS Topic (`analytics`)

#### Requests
- `GET_USER_ANALYTICS` - Get user analytics
- `GET_SYSTEM_ANALYTICS` - Get system analytics
- `GET_CONTEST_ANALYTICS` - Get contest analytics
- `GET_PERFORMANCE_METRICS` - Get performance metrics

### LOGS Topic (`logs`)

#### Requests
- `SEND_CLIENT_LOG` - Send client log
- `GET_CLIENT_LOGS` - Get client logs
- `CLEAR_LOGS` - Clear logs

## Common Actions (applicable to multiple topics)

- `SUBSCRIBE` - Subscribe to a topic
- `UNSUBSCRIBE` - Unsubscribe from a topic
- `REFRESH` - Refresh data
- `GET_ALL` - Get all items
- `GET_BY_ID` - Get item by ID
- `CREATE` - Create new item
- `UPDATE` - Update existing item
- `DELETE` - Delete item

## Subscription Messages

For real-time updates, topics support:
- `SUBSCRIBE_<DATA_TYPE>` - Subscribe to specific data updates
- `UNSUBSCRIBE_<DATA_TYPE>` - Unsubscribe from updates

Examples:
- `SUBSCRIBE_TRADE_EVENTS`
- `UNSUBSCRIBE_TRADE_EVENTS`
- `SUBSCRIBE_PRICE_ALERTS`
- `UNSUBSCRIBE_PRICE_ALERTS`

## Notes

1. Some hooks use string action names while others use the DDWebSocketActions enum
2. Topic names can be either from TopicType enum or strings like 'contest-chat'
3. Authentication is required for certain topics (wallet, portfolio, user, admin)
4. Some actions have multiple variations (e.g., `getContests` vs `GET_CONTESTS`)
5. The actual implementation may normalize these to a consistent format

## Testing Recommendations

When testing WebSocket functionality:
1. Test both authenticated and unauthenticated states
2. Test subscription/unsubscription flows
3. Test error handling for invalid actions
4. Verify rate limiting behavior
5. Check heartbeat/ping-pong functionality
6. Test reconnection scenarios