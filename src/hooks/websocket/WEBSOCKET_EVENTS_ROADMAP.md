# WebSocket Events Implementation Roadmap

## 🚨 HIGH PRIORITY - IMPLEMENT NEXT

### Contest Lifecycle Events (⭐⭐⭐)
- `CONTEST_CREATED` - New contests available → Show notification
- `CONTEST_STARTED` - Contest begins → Update UI, notifications  
- `CONTEST_ENDED` - Contest finishes → Show results, celebrations
- `CONTEST_CANCELLED` - Contest cancelled → User notifications
- `CONTEST_ACTIVITY` - User joins/leaves → Live participant updates

### User Achievement Events (⭐⭐⭐) 
- `USER_ACHIEVEMENT` - Achievement unlocked → Toast/modal popup
- `USER_LEVEL_UP` - Level progression → Celebration animation

### Trading Confirmations (⭐⭐⭐)
- `TOKEN_PURCHASE` - Trade confirmations → Success feedback
- `TOKEN_SALE` - Sale confirmations → Success feedback

### Critical System Events (⭐⭐)
- `LARGE_TRANSACTION` - Big trades happening → Excitement notifications
- `LAUNCH_EVENT_ADDRESS_REVEALED` - Launch events → Critical for participants
- `MAINTENANCE_MODE_UPDATED` - System maintenance → System-wide banners
- `SYSTEM_ALERT` - Critical alerts → High-priority notifications

## ✅ IMPLEMENTED 

### Token Scheduler (Working)
- `TOKEN_SCHEDULER_BATCH_STARTED` - Every 500ms
- `TOKEN_SCHEDULER_BATCH_COMPLETED` - Every 500ms  
- `TOKEN_PRICE_HISTORY_RECORDED` - Every 500ms ✅ Just added
- `TOKEN_SCHEDULER_TOKEN_FAILED` - Token failures
- `TOKEN_SCHEDULER_QUEUE_UPDATE` - Queue updates
- `TOKEN_SCHEDULER_TOKENS_MARKED_INACTIVE` - Inactive tokens

### Market Data (Working)
- `market:broadcast` - Market data
- `tokens:discovered` - New tokens found
- `token:enriched` - Token data enriched  
- `tokens:batch_enriched` - Batch enrichment completed

## 🔄 MEDIUM PRIORITY

### Admin/Service Events (⭐)
- `PRIVILEGE_GRANTED` - User privileges changed
- `PRIVILEGE_REVOKED` - User privileges revoked
- `SERVICE_STATUS_CHANGE` - Service up/down notifications
- `service:circuit-breaker` - Circuit breaker triggers
- `service:error` - Service error notifications

### Pool/Market Events (⭐)
- `pool:data_updated` - Pool data changes
- `liquidity:broadcast` - Liquidity simulation results  
- `tokens:significant_change` - Significant token changes

## 🤷‍♂️ LOW PRIORITY

### Operational Events
- `service:heartbeat` - Service health pings
- `service:initialized` - Service startup
- `service:stopped` - Service shutdown
- `admin:log` - Admin log messages
- `token-enrichment:error` - Enrichment errors
- `token-enrichment:status` - Enrichment status
- `service:status:update` - Service status updates

### Other Events
- `terminal:broadcast` - Terminal updates
- `vanity:dashboard_update` - Vanity wallet updates
- `system:status` - System status
- `wallet:balance_update` - Balance updates per wallet

## Implementation Strategy

1. **Phase 1**: Contest lifecycle + User achievements (next sprint)
2. **Phase 2**: Trading confirmations + System alerts
3. **Phase 3**: Admin/service events
4. **Phase 4**: Operational events as needed

Total Events: 30+ (was 14, targeting 20+ high-value implementations)