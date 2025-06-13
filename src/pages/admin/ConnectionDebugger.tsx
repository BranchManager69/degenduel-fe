import React, { useState } from "react";
import toast from "react-hot-toast";

import { WebSocketMonitor } from "../../components/debug/websocket/WebSocketMonitor";
import { useStore } from "../../store/useStore";

// Config
const WS_URL = import.meta.env.VITE_WS_URL;

// DEPRECATED: Old connection status component - removed for unified system
/* ... ConnectionStatus component removed ... */

const WebSocketDashboard: React.FC = () => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"status" | "testing" | "monitor">(
    "status",
  );

  // UNIFIED WEBSOCKET SYSTEM - All topics use single connection
  // NOTE: The unified system uses topic-based subscriptions through one connection
  const websocketTopics = [
    {
      type: "market_data",
      description: "Real-time market data for tokens",
      authRequired: false,
    },
    {
      type: "portfolio", 
      description: "User portfolio information",
      authRequired: true,
    },
    {
      type: "system",
      description: "System-wide notifications and events", 
      authRequired: false,
    },
    {
      type: "contest",
      description: "Contest information and updates",
      authRequired: false, // Public data, Yes for user-specific
    },
    {
      type: "user",
      description: "User profile and statistics",
      authRequired: true,
    },
    {
      type: "admin",
      description: "Administrative functions",
      authRequired: true, // Admin role required
    },
    {
      type: "wallet",
      description: "Wallet information and transactions",
      authRequired: true,
    },
    {
      type: "skyduel",
      description: "SkyDuel game data", 
      authRequired: false, // Public data, Yes for user-specific
    },
    {
      type: "logs",
      description: "Client logging facility",
      authRequired: false,
    },
  ];

  // DEPRECATED: Old endpoint testing - DO NOT USE  
  // (removed deprecatedEndpoints - not needed in UI)

  if (!user?.is_admin && !user?.is_superadmin) {
    return (
      <div className="p-4">
        <p className="text-red-500">
          Access Denied: Admin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">WebSocket Management System</h1>
        <div className="text-sm text-gray-400">
          {user?.is_superadmin ? "SuperAdmin Access" : "Admin Access"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "status"
              ? "text-brand-400 border-b-2 border-brand-400"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("status")}
        >
          Connection Status
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "testing"
              ? "text-brand-400 border-b-2 border-brand-400"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("testing")}
        >
          Testing
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "monitor"
              ? "text-brand-400 border-b-2 border-brand-400"
              : "text-gray-400"
          }`}
          onClick={() => setActiveTab("monitor")}
        >
          Live Monitor
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "status" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-200 rounded-lg p-6 shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">
                WebSocket Connection Status
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                The following WebSocket connections are configured in this
                application. Click on a connection to see more details.
              </p>

              {/* Current Unified System Status */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-md p-4 mb-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Unified WebSocket System (Current)</h3>
                <div className="space-y-2">
                  <div><strong>Connection URL:</strong> <code className="text-green-400">{WS_URL}</code></div>
                  <div><strong>Architecture:</strong> Single connection with topic-based subscriptions</div>
                  <div><strong>Topics Available:</strong></div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {websocketTopics.map((topic) => (
                      <div key={topic.type} className="bg-dark-300/50 p-2 rounded text-sm">
                        <div className="font-medium text-green-400">{topic.type}</div>
                        <div className="text-xs text-gray-400">{topic.description}</div>
                        <div className="text-xs">{topic.authRequired ? "🔒 Auth Required" : "🌐 Public"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deprecated System Warning */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-md p-4">
                <h3 className="text-red-400 font-semibold mb-2">❌ Deprecated v2 WebSocket System</h3>
                <p className="text-red-300 text-sm mb-2">
                  The following endpoints NO LONGER EXIST and will cause connection failures:
                </p>
                <div className="bg-dark-300/50 p-3 rounded font-mono text-xs text-red-400 space-y-1">
                  <div>❌ /v2/ws/contest</div>
                  <div>❌ /v2/ws/wallet</div>
                  <div>❌ /v2/ws/market</div>
                  <div>❌ /v2/ws/portfolio</div>
                  <div>❌ /api/admin/skyduel</div>
                  <div>❌ /api/admin/circuit-breaker</div>
                  <div>❌ /api/admin/services</div>
                  <div>❌ /analytics</div>
                </div>
                <p className="text-yellow-400 text-sm mt-2">
                  <strong>Migration:</strong> All functionality has been moved to the unified topic-based system above.
                </p>
              </div>
            </div>

            <div className="bg-dark-200 rounded-lg p-6 shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">
                Configuration Details
              </h2>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">WebSocket Base URL</h3>
                <div className="bg-dark-300 p-3 rounded-md">
                  <code className="text-brand-400">
                    {import.meta.env.VITE_WS_URL}
                  </code>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Environment</h3>
                <div className="bg-dark-300 p-3 rounded-md">
                  <code className="text-brand-400">
                    {import.meta.env.VITE_NODE_ENV || "development"}
                  </code>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Authentication Status</h3>
                <div className="bg-dark-300 p-3 rounded-md">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Session Token:</span>
                      <code className={user?.session_token ? "text-green-400" : "text-red-400"}>
                        {user?.session_token 
                          ? user.session_token.substring(0, 15) + "..." 
                          : "Not available"}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">JWT Token:</span>
                      <code className={user?.jwt ? "text-green-400" : "text-red-400"}>
                        {user?.jwt 
                          ? user.jwt.substring(0, 15) + "..." 
                          : "Not available"}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Authentication Method:</span>
                      <code className="text-brand-400">
                        {user?.jwt && user?.session_token 
                          ? "Both (JWT + Session)" 
                          : user?.jwt 
                            ? "JWT Only" 
                            : user?.session_token 
                              ? "Session Only" 
                              : "None"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Proxy Configuration
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  All WebSocket endpoints are now properly configured in the
                  proxy settings.
                </p>
                <div className="bg-dark-300 p-3 rounded-md">
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                    {`// In vite.config.ts
"/api/v2/ws": {
  target: "wss://degenduel.me", // MANUAL OVERRIDE
  ws: true,
  changeOrigin: true,
  secure: true,
},
"/v2/ws/contest": {...},
"/api/admin/skyduel": {...},
... (8 more endpoints)`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "testing" && <WebSocketTesting />}

      {activeTab === "monitor" && (
        <div>
          <WebSocketMonitor />
        </div>
      )}
    </div>
  );
};

const EXAMPLE_PAYLOADS: Record<string, Record<string, any>> = {
  portfolio: {
    PORTFOLIO_UPDATED: {
      type: "PORTFOLIO_UPDATED",
      data: {
        tokens: [
          {
            symbol: "SOL",
            name: "Solana",
            amount: 12.5,
            value: 1375.25,
          },
          {
            symbol: "BONK",
            name: "Bonk",
            amount: 15000000,
            value: 750.0,
          },
          {
            symbol: "JTO",
            name: "Jito",
            amount: 100,
            value: 250.0,
          },
        ],
        total_value: 2375.25,
        performance_24h: 3.25,
      },
      timestamp: new Date().toISOString(),
    },
    TRADE_EXECUTED: {
      type: "TRADE_EXECUTED",
      data: {
        trade_id: crypto.randomUUID(),
        wallet_address: "GkwZbZwXxqGaseJFCEfMkQwp4K4bjqdwJPjfEcfycxdE",
        symbol: "SOL",
        amount: 2.5,
        price: 110.25,
        timestamp: new Date().toISOString(),
        contest_id: "contest_" + crypto.randomUUID(),
      },
    },
  },
  tokenData: {
    subscribe: {
      type: "subscribe",
      tokens: "all", // Can also be an array like ["SOL", "BONK", "JTO"]
    },
    token_update: {
      type: "token_update",
      tokens: [
        {
          symbol: "SOL",
          name: "Solana",
          price: "112.50",
          marketCap: "50000000000",
          volume24h: "3500000000",
          volume5m: "75000000",
          change24h: "2.5",
          change5m: "0.75",
          change1h: "1.2",
          imageUrl: "https://solana.com/src/img/branding/solanaLogoMark.svg",
          status: "active",
        },
        {
          symbol: "BONK",
          name: "Bonk",
          price: "0.00002156",
          marketCap: "1250000000",
          volume24h: "450000000",
          volume5m: "25000000",
          change24h: "5.2",
          change5m: "1.8",
          change1h: "3.1",
          status: "active",
        },
      ],
      timestamp: new Date().toISOString(),
    },
    token_price: {
      type: "token_price",
      token: "SOL",
      data: {
        price: "113.75",
        change24h: "3.5",
        change1h: "1.5",
        timestamp: new Date().toISOString(),
      },
    },
    token_metadata: {
      type: "token_metadata",
      token: "BONK",
      data: {
        name: "Bonk",
        imageUrl: "https://example.com/bonk.png",
        description: "Solana's first community-driven dog coin",
        website: "https://bonkcoin.com",
        twitter: "@bonk_inu",
      },
    },
    token_liquidity: {
      type: "token_liquidity",
      token: "JTO",
      data: {
        liquidity: 75000000,
        liquidity24h: 72000000,
        change24h: "4.16",
        timestamp: new Date().toISOString(),
      },
    },
  },
  contest: {
    CONTEST_UPDATED: {
      type: "CONTEST_UPDATED",
      data: {
        contest_id: "contest_" + crypto.randomUUID(),
        status: "active",
        current_round: 1,
        time_remaining: 7200,
        total_participants: 128,
        total_prize_pool: 10000,
      },
    },
    LEADERBOARD_UPDATED: {
      type: "LEADERBOARD_UPDATED",
      data: {
        contest_id: "contest_" + crypto.randomUUID(),
        leaderboard: [
          {
            rank: 1,
            wallet_address: "GkwZbZwXxqGaseJFCEfMkQwp4K4bjqdwJPjfEcfycxdE",
            username: "trader_1",
            portfolio_value: 12500,
            performance: 25.5,
            last_trade_time: new Date().toISOString(),
          },
        ],
        timestamp: new Date().toISOString(),
      },
    },
  },
  market: {
    MARKET_PRICE: {
      type: "MARKET_PRICE",
      data: {
        symbol: "SOL",
        price: 110.25,
        change_24h: 2.5,
        volume_24h: 1250000000,
        high_24h: 112.5,
        low_24h: 108.75,
        timestamp: new Date().toISOString(),
      },
    },
    MARKET_VOLUME: {
      type: "MARKET_VOLUME",
      data: {
        symbol: "BONK",
        volume: 75000000000,
        trades_count: 12500,
        buy_volume: 42000000000,
        sell_volume: 33000000000,
        interval: "1h",
        timestamp: new Date().toISOString(),
      },
    },
    MARKET_SENTIMENT: {
      type: "MARKET_SENTIMENT",
      data: {
        symbol: "JTO",
        sentiment_score: 0.75,
        buy_pressure: 0.65,
        sell_pressure: 0.35,
        volume_trend: "increasing",
        timestamp: new Date().toISOString(),
      },
    },
  },
  analytics: {
    user_activity_update: {
      type: "user_activity_update",
      users: [
        {
          wallet: "GkwZbZwXxqGaseJFCEfMkQwp4K4bjqdwJPjfEcfycxdE",
          nickname: "trader_1",
          current_zone: "TRADING",
          last_action: "place_trade",
          last_active: new Date().toISOString(),
          session_duration: 1800,
        },
      ],
      timestamp: new Date().toISOString(),
    },
  },
  wallet: {
    WALLET_UPDATED: {
      type: "WALLET_UPDATED",
      data: {
        type: "balanceChanged",
        publicKey: "GkwZbZwXxqGaseJFCEfMkQwp4K4bjqdwJPjfEcfycxdE",
        balance: 1000.5,
        status: "active",
      },
    },
    TRANSFER_COMPLETE: {
      type: "TRANSFER_COMPLETE",
      data: {
        transfer_id: crypto.randomUUID(),
        status: "success",
        timestamp: new Date().toISOString(),
      },
    },
  },
  service: {
    "service:state": {
      type: "service:state",
      service: "trading-engine",
      data: {
        status: "active",
        metrics: {
          uptime: 3600,
          latency: 50,
          activeUsers: 1000,
        },
      },
      timestamp: new Date().toISOString(),
    },
    "service:alert": {
      type: "service:alert",
      service: "trading-engine",
      data: {
        alert: {
          type: "warning",
          message: "High latency detected",
        },
      },
      timestamp: new Date().toISOString(),
    },
  },
  circuitBreaker: {
    "health:update": {
      type: "health:update",
      service: "trading-engine",
      data: {
        status: "healthy",
        circuit: {
          state: "closed",
          failureCount: 0,
          lastFailure: null,
          recoveryAttempts: 0,
        },
      },
      timestamp: new Date().toISOString(),
    },
    "breaker:trip": {
      type: "breaker:trip",
      service: "trading-engine",
      data: {
        status: "failed",
        circuit: {
          state: "open",
          failureCount: 5,
          lastFailure: new Date().toISOString(),
          recoveryAttempts: 0,
        },
        error: "High error rate detected",
      },
      timestamp: new Date().toISOString(),
    },
  },
};

// UNIFIED WEBSOCKET TOPICS - All use single connection with topic subscriptions
const UNIFIED_TOPICS = {
  "market_data": {
    description: "Real-time market data for tokens",
    authRequired: false,
    messageTypes: ["MARKET_PRICE", "MARKET_VOLUME", "MARKET_SENTIMENT", "TOKEN_UPDATE"],
  },
  portfolio: {
    description: "User portfolio information", 
    authRequired: true,
    messageTypes: ["PORTFOLIO_UPDATED", "TRADE_EXECUTED"],
  },
  system: {
    description: "System-wide notifications and events",
    authRequired: false,
    messageTypes: ["SYSTEM_NOTIFICATION", "MAINTENANCE_UPDATE"],
  },
  contest: {
    description: "Contest information and updates",
    authRequired: false, // Public data, auth required for user-specific
    messageTypes: ["CONTEST_UPDATED", "LEADERBOARD_UPDATED"],
  },
  user: {
    description: "User profile and statistics",
    authRequired: true,
    messageTypes: ["USER_UPDATED", "STATS_UPDATED"],
  },
  admin: {
    description: "Administrative functions",
    authRequired: true, // Admin role required
    messageTypes: ["ADMIN_NOTIFICATION", "SERVICE_ALERT"],
  },
  wallet: {
    description: "Wallet information and transactions",
    authRequired: true,
    messageTypes: ["WALLET_UPDATED", "TRANSFER_COMPLETE"],
  },
  skyduel: {
    description: "SkyDuel game data",
    authRequired: false, // Public data, auth required for user-specific  
    messageTypes: ["GAME_STATE", "PLAYER_UPDATE"],
  },
  logs: {
    description: "Client logging facility",
    authRequired: false,
    messageTypes: ["LOG_ENTRY", "ERROR_REPORT"],
  },
} as const;

// DEPRECATED - All v2 WebSocket endpoints removed and replaced with unified topic system

type TopicType = keyof typeof UNIFIED_TOPICS;

// This component is now used as a tab inside WebSocketDashboard  
const WebSocketTesting: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<TopicType | "">("");
  const [selectedMessageType, setSelectedMessageType] = useState<string>("");
  const [messagePayload, setMessagePayload] = useState<string>("");
  // Note: testStatus removed - not used in unified system

  // Load example payload when message type is selected
  const loadExamplePayload = (messageType: string) => {
    if (selectedTopic && messageType) {
      const example = EXAMPLE_PAYLOADS[selectedTopic]?.[messageType];
      if (example) {
        setMessagePayload(JSON.stringify(example, null, 2));
      }
    }
  };

  const handleTest = async () => {
    try {
      // NOTE: This would need to be updated to work with the unified WebSocket system
      // Currently this is a placeholder for unified topic testing
      toast.error("Testing not yet implemented for unified WebSocket system. Use the Live Monitor tab to see actual WebSocket traffic.");
      
      // TODO: Implement unified WebSocket topic testing
      // This would involve:
      // 1. Connecting to the unified WebSocket
      // 2. Subscribing to the selected topic
      // 3. Sending test messages through the topic system
      
      return;

      /* DEPRECATED - Old testing method
      const response = await fetch("/api/admin/websocket/test", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: selectedTopic,
          messageType: selectedMessageType,
          payload: JSON.parse(messagePayload),
        }),
      });

      if (!response.ok) {
        throw new Error("Test failed");
      }

      setTestStatus((prev) => ({
        ...prev,
        [selectedTopic]: true,
      }));

      toast.success(
        `Successfully tested ${selectedMessageType} on ${selectedTopic} topic`,
      );
      */
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    }
  };

  const topicOptions = Object.entries(UNIFIED_TOPICS).map(([key, value]) => ({
    value: key,
    label: `${key} - ${value.description}`,
  }));

  return (
    <div className="bg-dark-200 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">WebSocket Message Testing</h2>
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-md p-4 mb-6">
        <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Unified WebSocket System</h3>
        <p className="text-yellow-300 text-sm">
          The testing functionality is being updated for the new unified WebSocket system. 
          Use the <strong>Live Monitor</strong> tab to see actual WebSocket traffic.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select WebSocket Topic
            </label>
            <select
              className="w-full bg-dark-300 border border-gray-700 rounded-md p-2"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value as TopicType);
                setSelectedMessageType("");
                setMessagePayload("");
              }}
            >
              <option value="">Choose a topic</option>
              {topicOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Message Type
            </label>
            <select
              className="w-full bg-dark-300 border border-gray-700 rounded-md p-2"
              value={selectedMessageType}
              onChange={(e) => {
                setSelectedMessageType(e.target.value);
                loadExamplePayload(e.target.value);
              }}
              disabled={!selectedTopic}
            >
              <option value="">Choose a message type</option>
              {selectedTopic &&
                UNIFIED_TOPICS[selectedTopic].messageTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Message Payload (JSON)
            </label>
            <textarea
              className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 font-mono"
              value={messagePayload}
              onChange={(e) => setMessagePayload(e.target.value)}
              rows={10}
              placeholder="Enter JSON payload"
            />
          </div>

          <button
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleTest}
            disabled={true}
          >
            Topic Testing (Coming Soon)
          </button>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-dark-300 rounded-lg p-4 border border-gray-700 mb-4">
            <h3 className="font-medium mb-3">Unified Topics Status</h3>
            {Object.keys(UNIFIED_TOPICS).map((topicType) => (
              <div
                key={topicType}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-sm">{topicType}</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs ml-2 text-gray-400">
                    Available
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
            <h3 className="font-medium mb-3">Unified System Info</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• All topics use single WebSocket connection</li>
              <li>• Authentication handled per topic subscription</li>
              <li>• Use the Live Monitor tab to see real traffic</li>
              <li>• Topic-based messaging replaces old endpoints</li>
              <li>• Connection automatically handles reconnection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the dashboard as the main component
export default WebSocketDashboard;

// For clarity in imports, also export as ConnectionDebugger
export { WebSocketDashboard as ConnectionDebugger };
