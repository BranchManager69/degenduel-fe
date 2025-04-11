# DegenDuel WebSocket System

## Architecture Overview

The DegenDuel WebSocket system uses a unified architecture to provide real-time data through a single WebSocket connection:

```
  ┌────────────────────────────────────────────────────────────────┐
  │                          App                                    │
  │                                                                 │
  │  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
  │  │TokenData    │  │Contest           │  │Terminal           │  │
  │  │Context      │  │Context           │  │Context            │  │
  │  └─────┬───────┘  └────────┬─────────┘  └─────────┬─────────┘  │
  │        │                   │                      │            │
  │        │                   │                      │            │
  │        ▼                   ▼                      ▼            │
  │  ┌────────────────────────────────────────────────────────┐    │
  │  │                    Unified WebSocket                    │    │
  │  │                (useUnifiedWebSocket.ts)                 │    │
  │  └───────────────────────────┬────────────────────────────┘    │
  │                              │                                  │
  │                              │                                  │
  │                              ▼                                  │
  │  ┌────────────────────────────────────────────────────────┐    │
  │  │                  WebSocketManager                       │    │
  │  │              (single connection to server)              │    │
  │  └────────────────────────────────────────────────────────┘    │
  └────────────────────────────────────────────────────────────────┘
```

## Core Components

### WebSocketManager (Component)

- Creates and manages a single WebSocket connection
- Handles authentication, reconnection, and message routing
- Located in `/components/websocket/WebSocketManager.tsx`

### useUnifiedWebSocket (Hook)

- Provides a hook interface to the unified WebSocket system
- Allows components to subscribe to specific message types and topics
- Located in `/hooks/websocket/useUnifiedWebSocket.ts`

### Topic-Specific Hooks (New Pattern)

- Built on top of useUnifiedWebSocket for specific topics
- Located in `/hooks/websocket/topic-hooks/`
- Examples: useTerminalData, useNotifications

## V69 WebSocket System Standardization

All WebSocket functionality is being consolidated using the standardized v69 approach:

1. Single WebSocket connection with topic-based subscription
2. New hooks follow the pattern in `/hooks/websocket/topic-hooks/`
3. Consistent message format and error handling

### Migration Status

| Topic | Status | Hook Location |
|-------|--------|--------------|
| terminal | ✅ Completed | /hooks/websocket/topic-hooks/useTerminalData.ts |
| notification | ✅ Completed | /hooks/websocket/topic-hooks/useNotifications.ts |
| token-data | ✅ Completed | /hooks/websocket/topic-hooks/useTokenData.ts |
| market-data | ✅ Completed | /hooks/websocket/topic-hooks/useMarketData.ts |
| contest | ✅ Completed | /hooks/websocket/topic-hooks/useContests.ts |
| portfolio | ✅ Completed | /hooks/websocket/topic-hooks/usePortfolio.ts |
| wallet | ✅ Completed | /hooks/websocket/topic-hooks/useWallet.ts |
| contest-chat | ✅ Completed | /hooks/websocket/topic-hooks/useContestChat.ts |
| achievement | ✅ Completed | /hooks/websocket/topic-hooks/useAchievements.ts |
| system | ✅ Completed | /hooks/websocket/topic-hooks/useSystemSettings.ts |
| skyduel | ✅ Completed | /hooks/websocket/topic-hooks/useSkyDuel.ts |
| admin | ✅ Completed | /hooks/websocket/topic-hooks/useAnalytics.ts |
| circuit-breaker | ✅ Completed | /hooks/websocket/topic-hooks/useCircuitBreaker.ts |
| service | ✅ Completed | /hooks/websocket/topic-hooks/useService.ts |
| rpc-benchmark | ✅ Completed | /hooks/websocket/topic-hooks/useRPCBenchmark.ts |

### Standard Message Format

All WebSocket messages follow this standard format:

```typescript
{
  type: 'DATA',          // Message type (DATA, ERROR, SYSTEM, etc.)
  topic: 'topic-name',   // Topic identifier (terminal, market-data, etc.)
  subtype: 'update',     // Optional subtype for more specific categorization
  action: 'update',      // Action being performed
  data: {                // Topic-specific data payload
    // Properties depend on the topic
  },
  timestamp: "2025-04-10T12:34:56.789Z"  // ISO timestamp
}
```

## Migration Strategy

1. Create a new hook in `/hooks/websocket/topic-hooks/` following the useTerminalData pattern
2. Update the existing hook to use the new hook internally
3. Export the new hook from the service
4. Gradually update components to use the new hook

### Migration Template

For each topic, create a new hook following this pattern:

```typescript
/**
 * use[Topic]Data Hook
 * 
 * V69 Standardized WebSocket Hook for [Topic] Data
 * 
 * @author [Your Name]
 * @created [Date]
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

// Define message types and interfaces

/**
 * Hook for accessing and managing [topic] data with real-time updates
 */
export function use[Topic]Data() {
  // State for data
  const [data, setData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler
  const handleMessage = useCallback((message) => {
    // Process message
  }, []);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    '[topic]-data-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.TOPIC]
  );

  // Return data and functions
  return {
    data,
    isLoading,
    isConnected: ws.isConnected,
    lastUpdate,
    refresh: () => {},
    // Other topic-specific helpers
  };
}
```

## Usage Guidelines

### For New Components

Always use the standardized topic hooks:

#### Terminal Data Example

```typescript
import { useTerminalData } from '../hooks/websocket/topic-hooks/useTerminalData';

// Inside your component:
const { 
  terminalData, 
  isLoading,
  isConnected,
  lastUpdate,
  refreshTerminalData
} = useTerminalData();

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading...</p>
    ) : (
      <p>Platform: {terminalData.platformName}</p>
    )}
    <button onClick={refreshTerminalData}>Refresh</button>
  </div>
);
```

#### Token Data Example

```typescript
import { useTokenData } from '../hooks/websocket/topic-hooks/useTokenData';

// Inside your component:
const { 
  tokens, 
  isLoading,
  isConnected,
  lastUpdate,
  refresh
} = useTokenData(); // For all tokens
// OR
const { tokens } = useTokenData(['SOL', 'BTC', 'ETH']); // For specific tokens

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading tokens...</p>
    ) : (
      <ul>
        {tokens.map(token => (
          <li key={token.symbol}>
            {token.name}: ${token.price}
          </li>
        ))}
      </ul>
    )}
    <button onClick={refresh}>Refresh</button>
  </div>
);
```

#### Market Data Example

```typescript
import { useMarketData } from '../hooks/websocket/topic-hooks/useMarketData';

// Inside your component:
const { 
  marketData, 
  isLoading,
  isConnected,
  lastUpdate,
  refreshMarketData
} = useMarketData();

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading market data...</p>
    ) : (
      <div>
        <p>Global Market Cap: {marketData.globalMarketCap}</p>
        <p>BTC Dominance: {marketData.btcDominance}</p>
        <p>24h Volume: {marketData.volume24h}</p>
        <p>Market Sentiment: {marketData.marketSentiment}</p>
      </div>
    )}
    <button onClick={refreshMarketData}>Refresh</button>
  </div>
);
```

#### Contest Example

```typescript
import { useContests } from '../hooks/websocket/topic-hooks/useContests';

// Inside your component:
const { 
  contests,
  activeContests,
  upcomingContests,
  isLoading,
  isConnected,
  refreshContests,
  joinContest
} = useContests();

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading contests...</p>
    ) : (
      <div>
        <h2>Active Contests ({activeContests.length})</h2>
        <ul>
          {activeContests.map(contest => (
            <li key={contest.contest_id}>
              {contest.name} - Prize Pool: ${contest.prize_pool}
            </li>
          ))}
        </ul>
        
        <h2>Upcoming Contests</h2>
        <ul>
          {upcomingContests.map(contest => (
            <li key={contest.contest_id}>
              {contest.name} - Starts: {new Date(contest.start_time).toLocaleString()}
              <button onClick={() => joinContest(contest.contest_id)}>Join</button>
            </li>
          ))}
        </ul>
      </div>
    )}
    <button onClick={refreshContests}>Refresh</button>
  </div>
);
```

#### Portfolio Example

```typescript
import { usePortfolio } from '../hooks/websocket/topic-hooks/usePortfolio';

// Inside your component:
const { 
  portfolio,
  holdings,
  totalValue,
  totalProfitLoss,
  profitLossPercentage,
  isLoading,
  updatePortfolio,
  refreshPortfolio
} = usePortfolio();
// OR for a contest-specific portfolio
// const { portfolio } = usePortfolio('contest-123');

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading portfolio...</p>
    ) : (
      <div>
        <h2>Portfolio Overview</h2>
        <p>Total Value: ${totalValue.toFixed(2)}</p>
        <p>Profit/Loss: ${totalProfitLoss.toFixed(2)} ({profitLossPercentage.toFixed(2)}%)</p>
        
        <h3>Holdings</h3>
        <ul>
          {holdings.map(holding => (
            <li key={holding.symbol}>
              {holding.symbol}: {holding.amount} tokens (${holding.value_usd.toFixed(2)})
              <span className={holding.profit_loss >= 0 ? 'profit' : 'loss'}>
                {holding.profit_loss >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
        
        <button onClick={() => updatePortfolio([
          { symbol: 'SOL', amount: 5.0 },
          { symbol: 'BTC', amount: 0.1 }
        ])}>Update Portfolio</button>
      </div>
    )}
    <button onClick={refreshPortfolio}>Refresh</button>
  </div>
);
```

#### Wallet Example

```typescript
import { useWallet } from '../hooks/websocket/topic-hooks/useWallet';

// Inside your component:
const { 
  transactions,
  balance,
  settings,
  isLoading,
  sendTransaction,
  updateSettings,
  refreshWallet,
  getTokenBalance
} = useWallet();
// OR for a specific wallet address
// const { balance, transactions } = useWallet('solana-wallet-address');

// Use the data in your component
return (
  <div>
    {isLoading ? (
      <p>Loading wallet data...</p>
    ) : (
      <div>
        <h2>Wallet Overview</h2>
        {balance && (
          <>
            <p>SOL Balance: {balance.sol_balance} SOL</p>
            <h3>Token Balances</h3>
            <ul>
              {balance.tokens.map(token => (
                <li key={token.symbol}>
                  {token.symbol}: {token.balance} 
                  {token.value_usd && ` ($${token.value_usd.toFixed(2)})`}
                </li>
              ))}
            </ul>
          </>
        )}
        
        <h3>Recent Transactions</h3>
        <ul>
          {transactions.map(tx => (
            <li key={tx.id} className={tx.status === 'failed' ? 'error' : ''}>
              {tx.type}: {tx.amount} {tx.token} - {tx.status}
              <br />
              {new Date(tx.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
        
        <h3>Send Transaction</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          sendTransaction({
            recipient: form.recipient.value,
            amount: parseFloat(form.amount.value),
            token: form.token.value
          });
        }}>
          <input name="recipient" placeholder="Recipient address" />
          <input name="amount" type="number" step="0.01" placeholder="Amount" />
          <select name="token">
            <option value="SOL">SOL</option>
            <option value="USDC">USDC</option>
          </select>
          <button type="submit">Send</button>
        </form>
      </div>
    )}
    <button onClick={refreshWallet}>Refresh Wallet</button>
  </div>
);
```

#### SkyDuel Example

```typescript
import { useSkyDuel } from "../hooks/websocket/topic-hooks/useSkyDuel";

// Inside your component:
const { 
  state,
  isLoading,
  isConnected,
  error,
  lastUpdate,
  requestData,
  restartNode,
  acknowledgeAlert
} = useSkyDuel();

// Use the data in your component
return (
  <div className="skyduel-dashboard">
    <h2>SkyDuel Service Visualization</h2>
    
    {/* Connection status */}
    <div className="status-bar">
      <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      {lastUpdate && (
        <div className="last-update">
          Last update: {lastUpdate.toLocaleString()}
        </div>
      )}
      <button 
        onClick={() => requestData("get_state")}
        disabled={!isConnected || isLoading}
      >
        Refresh Data
      </button>
    </div>
    
    {/* System status banner */}
    <div className={`system-status ${state.systemStatus.overall}`}>
      <h3>System Status: {state.systemStatus.overall.toUpperCase()}</h3>
      <p>{state.systemStatus.message}</p>
      <span className="timestamp">
        Updated: {new Date(state.systemStatus.timestamp).toLocaleString()}
      </span>
    </div>
    
    {/* Service nodes */}
    <div className="nodes-panel">
      <h3>Service Nodes ({state.nodes.length})</h3>
      {isLoading ? (
        <p>Loading service data...</p>
      ) : (
        <div className="nodes-grid">
          {state.nodes.map(node => (
            <div key={node.id} className={`node-card ${node.status}`}>
              <div className="node-header">
                <h4>{node.name}</h4>
                <span className={`status-badge ${node.status}`}>
                  {node.status}
                </span>
              </div>
              
              <div className="node-details">
                <p>Type: {node.type}</p>
                <p>Health: {node.health}%</p>
                <p>Uptime: {formatDuration(node.uptime)}</p>
                
                <div className="metrics">
                  <div className="metric">
                    <span className="label">CPU</span>
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${node.metrics.cpu}%` }}
                      ></div>
                    </div>
                    <span className="value">{node.metrics.cpu}%</span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Memory</span>
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${node.metrics.memory}%` }}
                      ></div>
                    </div>
                    <span className="value">{node.metrics.memory}%</span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Connections</span>
                    <span className="value">{node.metrics.connections}</span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Req/min</span>
                    <span className="value">{node.metrics.requestsPerMinute}</span>
                  </div>
                  
                  <div className="metric">
                    <span className="label">Error Rate</span>
                    <span className="value">{node.metrics.errorRate}%</span>
                  </div>
                </div>
                
                {/* Node alerts */}
                {node.alerts.length > 0 && (
                  <div className="alerts">
                    <h5>Alerts ({node.alerts.length})</h5>
                    {node.alerts.map(alert => (
                      <div key={alert.id} className={`alert ${alert.severity}`}>
                        <p>{alert.message}</p>
                        <span className="timestamp">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {!alert.acknowledged && (
                          <button 
                            onClick={() => acknowledgeAlert(node.id, alert.id)}
                            className="acknowledge-button"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Node controls */}
                <div className="node-controls">
                  <button 
                    onClick={() => restartNode(node.id)}
                    className="restart-button"
                    disabled={node.status === "restarting"}
                  >
                    Restart Node
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
    {/* Service connections */}
    <div className="connections-panel">
      <h3>Service Connections ({state.connections.length})</h3>
      <div className="connections-list">
        {state.connections.map(connection => (
          <div 
            key={`${connection.source}-${connection.target}`} 
            className={`connection-item ${connection.status}`}
          >
            <span className="source">{connection.source}</span>
            <span className="arrow">→</span>
            <span className="target">{connection.target}</span>
            <span className="metrics">
              <span className="latency">
                {connection.latency}ms
              </span>
              <span className="throughput">
                {connection.throughput} req/s
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
```

// Helper function for formatting uptime duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours < 24) return `${hours}h ${minutes}m`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return `${days}d ${remainingHours}h`;
}
```

#### Circuit Breaker Example

```typescript
import { useCircuitBreaker } from "../hooks/websocket/topic-hooks/useCircuitBreaker";

// Inside your component:
const { 
  services,
  isLoading,
  isConnected,
  error,
  lastUpdate,
  resetCircuitBreaker,
  updateCircuitConfig
} = useCircuitBreaker();

// Use the data in your component
return (
  <div className="circuit-breaker-dashboard">
    <h2>Circuit Breaker Dashboard</h2>
    
    {/* Connection status and controls */}
    <div className="header-section">
      <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      {lastUpdate && (
        <div className="last-update">
          Last update: {lastUpdate.toLocaleString()}
        </div>
      )}
    </div>
    
    {/* Service list */}
    <div className="services-panel">
      <h3>Services ({services.length})</h3>
      {isLoading ? (
        <p>Loading services...</p>
      ) : (
        <div className="services-grid">
          {services.map(service => (
            <div key={service.name} className={`service-card ${service.status}`}>
              <div className="service-header">
                <h4>{service.name}</h4>
                <span className={`status-badge ${service.status}`}>
                  {service.status}
                </span>
              </div>
              
              <div className="circuit-status">
                <div className="state-indicator">
                  <h5>Circuit State</h5>
                  <div className={`circuit-state ${service.circuit.state}`}>
                    {service.circuit.state === "closed" ? "Closed (Healthy)" : 
                     service.circuit.state === "open" ? "Open (Failed)" : 
                     "Half-Open (Testing)"}
                  </div>
                </div>
                
                <div className="circuit-metrics">
                  <div className="metric">
                    <span className="label">Failures</span>
                    <span className="value">{service.circuit.failureCount}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Recovery Attempts</span>
                    <span className="value">{service.circuit.recoveryAttempts}</span>
                  </div>
                  {service.circuit.lastFailure && (
                    <div className="metric">
                      <span className="label">Last Failure</span>
                      <span className="value">
                        {new Date(service.circuit.lastFailure).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Service metrics */}
              {service.metrics && (
                <div className="performance-metrics">
                  <h5>Performance Metrics</h5>
                  <div className="metrics-grid">
                    <div className="metric">
                      <span className="label">Failure Rate</span>
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ width: `${service.metrics.failureRate}%` }}
                        ></div>
                      </div>
                      <span className="value">{service.metrics.failureRate.toFixed(2)}%</span>
                    </div>
                    
                    <div className="metric">
                      <span className="label">Latency</span>
                      <span className="value">{service.metrics.latency.toFixed(2)}ms</span>
                    </div>
                    
                    <div className="metric">
                      <span className="label">Throughput</span>
                      <span className="value">{service.metrics.throughput} req/s</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Configuration */}
              {service.config && (
                <div className="circuit-config">
                  <h5>Circuit Configuration</h5>
                  <div className="config-grid">
                    <div className="config-item">
                      <span className="label">Failure Threshold</span>
                      <span className="value">{service.config.failureThreshold}</span>
                    </div>
                    <div className="config-item">
                      <span className="label">Recovery Timeout</span>
                      <span className="value">{service.config.recoveryTimeout}ms</span>
                    </div>
                    <div className="config-item">
                      <span className="label">Request Limit</span>
                      <span className="value">{service.config.requestLimit}</span>
                    </div>
                  </div>
                  
                  {/* Admin controls */}
                  <div className="admin-controls">
                    <button 
                      onClick={() => updateCircuitConfig(service.name, {
                        failureThreshold: service.config.failureThreshold + 1
                      })}
                      className="config-button"
                    >
                      Increase Threshold
                    </button>
                    <button 
                      onClick={() => updateCircuitConfig(service.name, {
                        recoveryTimeout: service.config.recoveryTimeout + 1000
                      })}
                      className="config-button"
                    >
                      Increase Timeout
                    </button>
                  </div>
                </div>
              )}
              
              {/* Service controls */}
              <div className="service-controls">
                {service.circuit.state === "open" && (
                  <button 
                    onClick={() => resetCircuitBreaker(service.name)}
                    className="reset-button"
                  >
                    Reset Circuit Breaker
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
```

#### Service Monitoring Example

```typescript
import { useService } from "../hooks/websocket/topic-hooks/useService";

// Inside your component:
const { 
  isConnected,
  isLoading,
  error,
  lastUpdate,
  refreshServiceData
} = useService();

// Service data is stored in the global state - this is by design
// since it's shared by multiple components
const { serviceState, serviceAlerts } = useYourStore(); // This is the global store you're using

// Use the data in your component
return (
  <div className="service-monitor">
    <h2>Service Monitoring</h2>
    
    {/* Connection status */}
    <div className="header-controls">
      <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      {lastUpdate && (
        <div className="last-update">
          Last update: {lastUpdate.toLocaleString()}
        </div>
      )}
      <button 
        onClick={refreshServiceData}
        disabled={!isConnected || isLoading}
      >
        Refresh Service Data
      </button>
    </div>
    
    {/* Service status */}
    <div className={`service-status ${serviceState.status}`}>
      <h3>Service Status: {serviceState.status.toUpperCase()}</h3>
      <div className="metrics">
        <div className="metric">
          <span className="label">Uptime</span>
          <span className="value">{formatDuration(serviceState.metrics.uptime)}</span>
        </div>
        <div className="metric">
          <span className="label">Latency</span>
          <span className="value">
            {serviceState.metrics.latency >= 0 ? `${serviceState.metrics.latency}ms` : 'N/A'}
          </span>
        </div>
        <div className="metric">
          <span className="label">Active Users</span>
          <span className="value">{serviceState.metrics.activeUsers}</span>
        </div>
      </div>
    </div>
    
    {/* Service alerts */}
    {serviceAlerts.length > 0 && (
      <div className="service-alerts">
        <h3>Service Alerts</h3>
        <div className="alerts-list">
          {serviceAlerts.map((alert, index) => (
            <div key={index} className={`alert ${alert.type}`}>
              <span className="icon">{alert.type === "error" ? "❌" : 
                                     alert.type === "warning" ? "⚠️" : "ℹ️"}</span>
              <span className="message">{alert.message}</span>
              {alert.timestamp && (
                <span className="timestamp">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Error handling */}
    {error && (
      <div className="error-message">
        Connection Error: {error}
      </div>
    )}
  </div>
);
```

#### RPC Benchmark Example

```typescript
import { useRPCBenchmark } from "../hooks/websocket/topic-hooks/useRPCBenchmark";

// Inside your component:
const { 
  data,
  isLoading,
  isBenchmarkRunning,
  isConnected,
  isAuthenticated,
  error,
  lastUpdate,
  refreshData,
  triggerBenchmark
} = useRPCBenchmark();

// Use the data in your component
return (
  <div className="rpc-benchmark-dashboard">
    <h2>RPC Benchmark Dashboard</h2>
    
    {/* Connection status and controls */}
    <div className="controls-bar">
      <div className="status-indicators">
        <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
        <div className={`auth-status ${isAuthenticated ? "authenticated" : "unauthenticated"}`}>
          {isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </div>
        {isBenchmarkRunning && (
          <div className="benchmark-status running">
            Benchmark Running...
          </div>
        )}
      </div>
      
      {lastUpdate && (
        <div className="last-update">
          Last update: {lastUpdate.toLocaleString()}
        </div>
      )}
      
      <div className="action-buttons">
        <button 
          onClick={refreshData}
          disabled={!isConnected || !isAuthenticated || isLoading || isBenchmarkRunning}
        >
          Refresh Data
        </button>
        <button 
          onClick={triggerBenchmark}
          disabled={!isConnected || !isAuthenticated || isBenchmarkRunning}
          className="benchmark-button"
        >
          Run New Benchmark
        </button>
      </div>
    </div>
    
    {/* Benchmark results */}
    {isLoading ? (
      <div className="loading-state">
        <p>Loading benchmark data...</p>
      </div>
    ) : data ? (
      <div className="benchmark-results">
        <div className="benchmark-summary">
          <h3>Benchmark Summary</h3>
          <div className="summary-details">
            <div className="detail-item">
              <span className="label">Test Run ID:</span>
              <span className="value">{data.test_run_id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Timestamp:</span>
              <span className="value">{new Date(data.timestamp).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Fastest Provider:</span>
              <span className="value">{data.overall_fastest_provider}</span>
            </div>
            <div className="detail-item">
              <span className="label">Success:</span>
              <span className="value">{data.success ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
        
        {/* Performance advantage */}
        {data.performance_advantage.length > 0 && (
          <div className="performance-advantage">
            <h3>Performance Advantage</h3>
            <div className="advantage-list">
              {data.performance_advantage.map(advantage => (
                <div key={advantage.method} className="advantage-item">
                  <h4>{advantage.method}</h4>
                  <div className="advantage-metrics">
                    <div className="metric">
                      <span className="label">vs {advantage.second_place_provider}:</span>
                      <span className="value">{advantage.vs_second_place.toFixed(2)}%</span>
                    </div>
                    {advantage.third_place_provider && (
                      <div className="metric">
                        <span className="label">vs {advantage.third_place_provider}:</span>
                        <span className="value">{advantage.vs_third_place?.toFixed(2)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Method results */}
        <div className="method-results">
          <h3>Method Results</h3>
          {Object.entries(data.methods).map(([method, methodData]) => (
            <div key={method} className="method-card">
              <h4>{method}</h4>
              <table className="providers-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Median Latency</th>
                    <th>Avg Latency</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Success</th>
                    <th>Failure</th>
                    <th>% Slower</th>
                  </tr>
                </thead>
                <tbody>
                  {methodData.providers
                    .sort((a, b) => a.median_latency - b.median_latency)
                    .map(provider => (
                    <tr key={provider.provider} className={provider.percent_slower === 0 ? "fastest" : ""}>
                      <td>{provider.provider}</td>
                      <td>{provider.median_latency.toFixed(2)}ms</td>
                      <td>{provider.avg_latency.toFixed(2)}ms</td>
                      <td>{provider.min_latency.toFixed(2)}ms</td>
                      <td>{provider.max_latency.toFixed(2)}ms</td>
                      <td>{provider.success_count}</td>
                      <td>{provider.failure_count}</td>
                      <td>
                        {provider.percent_slower !== undefined ? 
                          `${provider.percent_slower.toFixed(2)}%` : 
                          'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="no-data">
        <p>No benchmark data available. Run a benchmark to see results.</p>
      </div>
    )}
    
    {/* Error handling */}
    {error && (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    )}
  </div>
);
```

### For Existing Components

Existing components can continue using the legacy hooks, but new development should use the standardized hooks.

## Authentication

All authentication in the unified system happens through the WebSocketManager. The system will:

1. Attempt to authenticate with the most suitable token
2. Use token priority: wsToken || jwt || sessionToken
3. Handle token expiration and refresh automatically
#### Contest Chat Example

```typescript
import { useContestChat } from "../hooks/websocket/topic-hooks/useContestChat";
import { useState } from "react";

// Inside your component:
const contestId = "123456"; // The contest ID
const { 
  messages,
  pinnedMessages,
  isLoading,
  isConnected,
  sendMessage,
  pinMessage,
  deleteMessage,
  refreshChat
} = useContestChat(contestId);

// State for input field
const [messageText, setMessageText] = useState("");

// Handle form submission
const handleSubmit = (e) => {
  e.preventDefault();
  if (messageText.trim()) {
    sendMessage(messageText.trim());
    setMessageText("");
  }
};

// Use the data in your component
return (
  <div className="contest-chat">
    <h2>Contest Chat</h2>
    
    {/* Connection status */}
    <div className="status">
      {isConnected ? (
        <span className="connected">Connected</span>
      ) : (
        <span className="disconnected">Disconnected</span>
      )}
      <button onClick={refreshChat}>Refresh</button>
    </div>
    
    {/* Pinned messages */}
    {pinnedMessages.length > 0 && (
      <div className="pinned-messages">
        <h3>Pinned Messages</h3>
        {pinnedMessages.map(msg => (
          <div key={msg.id} className="pinned-message">
            <span className="username">{msg.username}</span>: {msg.message}
            <button onClick={() => pinMessage(msg.id, false)}>Unpin</button>
          </div>
        ))}
      </div>
    )}
    
    {/* Chat messages */}
    <div className="messages-container">
      {isLoading ? (
        <p>Loading messages...</p>
      ) : (
        <div className="messages">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message ${msg.is_admin ? "admin" : ""} ${msg.is_system ? "system" : ""}`}
            >
              <span className="time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span className="username">{msg.username}</span>: {msg.message}
              
              {/* Admin controls */}
              <div className="controls">
                <button onClick={() => pinMessage(msg.id, \!msg.is_pinned)}>
                  {msg.is_pinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => deleteMessage(msg.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
    {/* Chat input */}
    <form onSubmit={handleSubmit} className="chat-form">
      <input
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Type a message..."
        disabled={\!isConnected || isLoading}
      />
      <button type="submit" disabled={\!isConnected || isLoading}>
        Send
      </button>
    </form>
  </div>
);
```

#### Achievements Example

```typescript
import { useAchievements } from "../hooks/websocket/topic-hooks/useAchievements";

// Inside your component:
const { 
  achievements,
  recentlyUnlocked,
  level,
  isLoading,
  getUnlockedAchievements,
  getProgressPercentage,
  getAchievementsByCategory,
  refreshAchievements
} = useAchievements();

// Use the data in your component
return (
  <div className="achievements-panel">
    <h2>User Achievements</h2>
    
    {/* Level info */}
    {level && (
      <div className="level-info">
        <h3>Level {level.current}</h3>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${(level.xp / level.xp_required) * 100}%` }}
          ></div>
        </div>
        <div className="xp-text">
          {level.xp} / {level.xp_required} XP
        </div>
      </div>
    )}
    
    {/* Recently unlocked achievements */}
    {recentlyUnlocked.length > 0 && (
      <div className="recent-achievements">
        <h3>Recently Unlocked</h3>
        <div className="achievements-grid">
          {recentlyUnlocked.map(achievement => (
            <div key={achievement.id} className="achievement-card unlocked">
              {achievement.image_url && (
                <img 
                  src={achievement.image_url} 
                  alt={achievement.name} 
                  className="achievement-image"
                />
              )}
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                {achievement.unlocked_at && (
                  <span className="unlock-date">
                    Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Achievement categories */}
    {\!isLoading && (
      <>
        <div className="achievement-stats">
          <div className="stat">
            <span className="label">Progress</span>
            <span className="value">{getProgressPercentage()}%</span>
          </div>
          <div className="stat">
            <span className="label">Unlocked</span>
            <span className="value">{getUnlockedAchievements().length} / {achievements.length}</span>
          </div>
        </div>
        
        {/* Trading achievements */}
        <div className="achievement-category">
          <h3>Trading Achievements</h3>
          <div className="achievements-grid">
            {getAchievementsByCategory("trading").map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}
              >
                {achievement.image_url && (
                  <img 
                    src={achievement.image_url} 
                    alt={achievement.name} 
                    className="achievement-image"
                    style={{ opacity: achievement.unlocked ? 1 : 0.5 }}
                  />
                )}
                <div className="achievement-info">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  {achievement.progress \!== undefined && achievement.progress < 100 && (
                    <div className="achievement-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <span>{achievement.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Contest achievements */}
        <div className="achievement-category">
          <h3>Contest Achievements</h3>
          <div className="achievements-grid">
            {getAchievementsByCategory("contest").map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}
              >
                {/* Achievement content similar to above */}
              </div>
            ))}
          </div>
        </div>
      </>
    )}
    
    {isLoading && (
      <div className="loading">Loading achievements...</div>
    )}
    
    <button 
      onClick={refreshAchievements} 
      className="refresh-button"
      disabled={isLoading}
    >
      Refresh Achievements
    </button>
  </div>
);
```

#### Server Status Example

```typescript
import { useServerStatus } from "../hooks/websocket/topic-hooks/useServerStatus";

// Inside your component:
const { 
  status,
  features,
  isLoading,
  isConnected,
  isOperational,
  isDegraded,
  isInMaintenance,
  isDown,
  hasActiveMaintenance,
  hasActiveIncidents,
  getServiceStatus,
  isFeatureEnabled,
  refreshStatus
} = useServerStatus();

// Use the data in your component
return (
  <div className="server-status-panel">
    <h2>System Status</h2>
    
    {/* Overall status */}
    <div className={`status-indicator ${status.overall}`}>
      <div className="status-icon"></div>
      <div className="status-text">
        <h3>
          {isOperational && "All Systems Operational"}
          {isDegraded && "Some Services Degraded"}
          {isInMaintenance && "Maintenance In Progress"}
          {isDown && "System Outage"}
        </h3>
        {status.message && <p>{status.message}</p>}
        <div className="last-updated">
          Last updated: {new Date(status.lastUpdated).toLocaleString()}
        </div>
      </div>
      <button 
        onClick={refreshStatus}
        disabled={isLoading}
        className="refresh-button"
      >
        Refresh
      </button>
    </div>
    
    {/* Maintenance notice */}
    {hasActiveMaintenance && status.maintenance && (
      <div className="maintenance-notice">
        <h3>Maintenance Notice</h3>
        <p>{status.maintenance.description}</p>
        {status.maintenance.startTime && status.maintenance.endTime && (
          <p>
            Schedule: {new Date(status.maintenance.startTime).toLocaleString()} to{" "}
            {new Date(status.maintenance.endTime).toLocaleString()}
          </p>
        )}
        {status.maintenance.affectedServices && (
          <p>
            Affected Services: {status.maintenance.affectedServices.join(", ")}
          </p>
        )}
      </div>
    )}
    
    {/* Active incidents */}
    {hasActiveIncidents && status.incidents && (
      <div className="incidents">
        <h3>Active Incidents</h3>
        {status.incidents
          .filter(incident => incident.status \!== "resolved")
          .map(incident => (
            <div key={incident.id} className={`incident ${incident.impact}`}>
              <h4>{incident.title}</h4>
              <p>Status: {incident.status}</p>
              <p>Started: {new Date(incident.started).toLocaleString()}</p>
              {incident.updates.length > 0 && (
                <div className="updates">
                  <h5>Updates:</h5>
                  {incident.updates.map((update, index) => (
                    <div key={index} className="update">
                      <p>{update.message}</p>
                      <small>{new Date(update.timestamp).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    )}
    
    {/* Services status */}
    <div className="services">
      <h3>Services</h3>
      {isLoading ? (
        <p>Loading service status...</p>
      ) : (
        <table className="services-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {status.services.map(service => (
              <tr key={service.name} className={service.status}>
                <td>{service.name}</td>
                <td>
                  <span className={`status-badge ${service.status}`}>
                    {service.status}
                  </span>
                </td>
                <td>
                  {service.lastUpdated 
                    ? new Date(service.lastUpdated).toLocaleString() 
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    
    {/* Feature flags (for admins) */}
    {Object.keys(features).length > 0 && (
      <div className="feature-flags">
        <h3>Feature Flags</h3>
        <table className="features-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(features).map(([feature, enabled]) => (
              <tr key={feature}>
                <td>{feature}</td>
                <td>
                  <span className={enabled ? "enabled" : "disabled"}>
                    {enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    
    {/* Feature check example */}
    {isFeatureEnabled("new_contest_ui") && (
      <div className="new-feature-alert">
        New contest UI is now available\!
      </div>
    )}
  </div>
);
```

#### System Settings Example

```typescript
import { useSystemSettings } from "../hooks/websocket/topic-hooks/useSystemSettings";

// Inside your component:
const { 
  settings,
  isFeatureEnabled,
  getActiveTheme,
  getActiveNotices,
  isMaintenanceMode,
  maintenanceMessage,
  isRegistrationOpen,
  limits,
  refreshSettings
} = useSystemSettings();
// OR for specific settings: useSystemSettings([features, themes])

// Get current user role
const userRole = "admin"; // Usually from auth context

// Use the data in your component
return (
  <div className="system-settings">
    <h2>System Settings</h2>
    
    {/* Maintenance Mode Banner */}
    {isMaintenanceMode && (
      <div className="maintenance-banner">
        <h3>Maintenance Mode Active</h3>
        {maintenanceMessage && <p>{maintenanceMessage}</p>}
      </div>
    )}
    
    {/* Active Notices */}
    {getActiveNotices(userRole).length > 0 && (
      <div className="notices">
        <h3>System Notices</h3>
        {getActiveNotices(userRole).map(notice => (
          <div key={notice.id} className={`notice ${notice.type}`}>
            <p>{notice.message}</p>
            {notice.dismissible && (
              <button className="dismiss-button">Dismiss</button>
            )}
          </div>
        ))}
      </div>
    )}
    
    {/* Feature Flags */}
    <div className="features-section">
      <h3>Features</h3>
      <div className="feature-list">
        {settings.features.map(feature => (
          <div key={feature.name} className={`feature ${feature.enabled ? "enabled" : "disabled"}`}>
            <div className="feature-header">
              <h4>{feature.name}</h4>
              <span className="status-indicator"></span>
            </div>
            {feature.description && <p>{feature.description}</p>}
          </div>
        ))}
      </div>
    </div>
    
    {/* Theme Selector */}
    {settings.themes.length > 0 && (
      <div className="theme-section">
        <h3>Themes</h3>
        <div className="theme-list">
          {settings.themes.map(theme => (
            <div 
              key={theme.name}
              className={`theme-card ${theme.active ? "active" : ""}`}
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.primary
              }}
            >
              <h4>{theme.name}</h4>
              <div className="color-samples">
                {Object.entries(theme.colors).map(([name, color]) => (
                  <div 
                    key={name}
                    className="color-sample"
                    style={{ backgroundColor: color }}
                    title={`${name}: ${color}`}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* System Limits */}
    <div className="system-limits">
      <h3>System Limits</h3>
      <ul>
        <li>Max Users Per Contest: {limits.maxUsersPerContest}</li>
        <li>Max Contests Per User: {limits.maxContestsPerUser}</li>
        <li>Max Tokens Per Portfolio: {limits.maxTokensPerPortfolio}</li>
      </ul>
    </div>
    
    {/* Feature Check Examples */}
    {isFeatureEnabled("premium_contests") && (
      <div className="premium-contests-promo">
        Premium contests are now available\!
      </div>
    )}
    
    {getActiveTheme() && (
      <div className="theme-preview">
        <h3>Current Theme: {getActiveTheme()\!.name}</h3>
        <div 
          className="preview-box"
          style={{
            backgroundColor: getActiveTheme()\!.colors.background,
            color: getActiveTheme()\!.colors.text,
            border: `2px solid ${getActiveTheme()\!.colors.primary}`
          }}
        >
          <p>This is how text looks with the current theme</p>
          <button 
            style={{
              backgroundColor: getActiveTheme()\!.colors.primary,
              color: getActiveTheme()\!.colors.background
            }}
          >
            Sample Button
          </button>
        </div>
      </div>
    )}
    
    <button 
      onClick={refreshSettings}
      className="refresh-button"
    >
      Refresh Settings
    </button>
  </div>
);
```
