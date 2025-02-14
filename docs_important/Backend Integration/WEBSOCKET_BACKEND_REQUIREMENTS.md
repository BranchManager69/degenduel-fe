# DegenDuel WebSocket Backend Implementation Requirements

## Overview

This document outlines the required WebSocket endpoints and message formats that need to be implemented on the backend to support the frontend's real-time functionality. All WebSocket connections require authentication via session token passed as the WebSocket protocol.

## Required WebSocket Endpoints

### 1. Portfolio WebSocket

- **Endpoint**: `/api/v2/ws/portfolio`
- **Authentication**: Session token as WebSocket protocol
- **Purpose**: Real-time portfolio updates, trade executions, and price updates
- **Message Types**:

  ```typescript
  // Portfolio Update
  {
    type: "PORTFOLIO_UPDATED",
    data: {
      tokens: Array<{
        symbol: string;
        name: string;
        amount: number;
        value: number;
      }>;
      total_value: number;
      performance_24h: number;
    },
    timestamp: string;
  }

  // Trade Execution
  {
    type: "TRADE_EXECUTED",
    data: {
      trade_id: string;
      wallet_address: string;
      symbol: string;
      amount: number;
      price: number;
      timestamp: string;
      contest_id?: string;
    }
  }

  // Price Update
  {
    type: "PRICE_UPDATED",
    data: {
      symbol: string;
      price: number;
      change_24h: number;
      timestamp: string;
    }
  }
  ```

### 2. Contest WebSocket

- **Endpoint**: `/api/v2/ws/contest/:contestId`
- **Authentication**: Session token as WebSocket protocol
- **Purpose**: Real-time contest updates, leaderboard changes, and participant activity
- **Message Types**:

  ```typescript
  // Contest Update
  {
    type: "CONTEST_UPDATED",
    data: {
      contest_id: string;
      status: "active" | "completed" | "cancelled";
      current_round?: number;
      time_remaining?: number;
      total_participants: number;
      total_prize_pool: number;
    }
  }

  // Leaderboard Update
  {
    type: "LEADERBOARD_UPDATED",
    data: {
      contest_id: string;
      leaderboard: Array<{
        rank: number;
        wallet_address: string;
        username: string;
        portfolio_value: number;
        performance: number;
        last_trade_time?: string;
      }>;
      timestamp: string;
    }
  }

  // Participant Activity
  {
    type: "PARTICIPANT_ACTIVITY",
    data: {
      contest_id: string;
      wallet_address: string;
      username: string;
      activity_type: "join" | "leave" | "trade";
      details?: {
        symbol?: string;
        amount?: number;
        price?: number;
      };
      timestamp: string;
    }
  }
  ```

### 3. Market Data WebSocket

- **Endpoint**: `/api/v2/ws/market?symbols=BTC,ETH,SOL`
- **Authentication**: Session token as WebSocket protocol
- **Purpose**: Real-time market data including prices, volumes, and sentiment analysis
- **Message Types**:

  ```typescript
  // Market Price
  {
    type: "MARKET_PRICE",
    data: {
      symbol: string;
      price: number;
      change_24h: number;
      volume_24h: number;
      high_24h: number;
      low_24h: number;
      timestamp: string;
    }
  }

  // Market Volume
  {
    type: "MARKET_VOLUME",
    data: {
      symbol: string;
      volume: number;
      trades_count: number;
      buy_volume: number;
      sell_volume: number;
      interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
      timestamp: string;
    }
  }

  // Market Sentiment
  {
    type: "MARKET_SENTIMENT",
    data: {
      symbol: string;
      sentiment_score: number; // -1 to 1
      buy_pressure: number; // 0 to 1
      sell_pressure: number; // 0 to 1
      volume_trend: "increasing" | "decreasing" | "stable";
      timestamp: string;
    }
  }
  ```

## Implementation Requirements

### Authentication

1. All WebSocket connections must validate the session token passed as the WebSocket protocol
2. Invalid or expired tokens should result in immediate connection closure
3. Implement token refresh mechanism to handle long-lived connections

### Connection Management

1. Implement heartbeat mechanism (client sends ping every 30s, 15s for market data)
2. Close connections after 3 failed heartbeats
3. Support reconnection with exponential backoff
4. Maximum 5 reconnection attempts before requiring client restart

### Performance Requirements

1. Maximum message latency: 100ms
2. Support minimum 10,000 concurrent connections
3. Message rate limits:
   - Portfolio: 1 update/second per user
   - Contest: 2 updates/second per contest
   - Market Data: 10 updates/second per symbol

### Error Handling

1. All messages must include proper error types and descriptions
2. Implement circuit breaker pattern for external data sources
3. Send error messages in format:

```typescript
{
  type: "ERROR",
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Monitoring Requirements

1. Track and expose metrics for:
   - Connected clients count
   - Message throughput
   - Error rates
   - Latency statistics
2. Implement logging for:
   - Connection events
   - Authentication failures
   - Message processing errors
   - Circuit breaker events

## Testing Requirements

### Test Endpoints

Create test endpoints that simulate:

1. Portfolio updates at different frequencies
2. Contest state changes and leaderboard updates
3. Market data streams with configurable update rates
4. Error conditions and edge cases

### Load Testing

1. Test with simulated load of 10,000+ concurrent connections
2. Verify message delivery under high load
3. Measure and optimize latency under different load conditions

## Security Requirements

1. Rate limiting per user/IP
2. Message validation and sanitization
3. Protection against malicious payloads
4. Secure WebSocket connection (WSS only)
5. Access control based on user roles

## Development Timeline

1. Phase 1 (Week 1-2):

   - Basic WebSocket server setup
   - Authentication integration
   - Connection management implementation

2. Phase 2 (Week 3-4):

   - Portfolio WebSocket implementation
   - Contest WebSocket implementation
   - Market Data WebSocket implementation

3. Phase 3 (Week 5):

   - Testing endpoints implementation
   - Monitoring setup
   - Load testing and optimization

4. Phase 4 (Week 6):
   - Security measures implementation
   - Documentation
   - Production deployment

## Contact

For implementation questions:

- Slack: #websocket-integration
- Email: backend@degenduel.com
- Documentation: Create PR in docs_important
