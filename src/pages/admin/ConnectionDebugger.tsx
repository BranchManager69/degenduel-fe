import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { WebSocketMonitor } from "../../components/debug/websocket/WebSocketMonitor";
import { useStore } from "../../store/useStore";

// Config
const WS_URL = import.meta.env.VITE_WS_URL;
////const TOKEN_DATA_WSS_PATH = `/api/v2/ws/tokenData`;
const TOKEN_DATA_WSS_PATH = `/api/ws/token-data`;
const TOKEN_DATA_LOCAL_URL = `localhost:6000`;

// WebSocket Connection Status component
const ConnectionStatus: React.FC<{
  socketType: string;
  url: string;
  endpoint: string;
}> = ({ socketType, url, endpoint }) => {
  const [status, setStatus] = useState<
    "connecting" | "online" | "offline" | "error"
  >("offline");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkConnection();
    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [socketType, url, endpoint]);

  const checkConnection = () => {
    setStatus("connecting");

    // Simple connectivity check using fetch to verify that the URL is reachable
    // Not a perfect test but better than nothing
    const httpUrl = url
      .replace("wss://", "https://")
      .replace("ws://", "http://");

    // Add a random parameter to avoid caching
    fetch(`${httpUrl}/status?t=${Date.now()}`)
      .then(() => {
        // If we get any response, consider it online
        setStatus("online");
        setLastChecked(new Date());
      })
      .catch((error) => {
        console.log(`Connection error for ${socketType}:`, error);
        setStatus("offline");
        setLastChecked(new Date());
      });

    // Production code should rely on actual connection status
    // No mock statuses
  };

  return (
    <div
      className="bg-dark-300 rounded-lg p-4 border border-gray-700 mb-2 cursor-pointer hover:bg-dark-300/50"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              status === "online"
                ? "bg-green-500 animate-pulse"
                : status === "connecting"
                  ? "bg-yellow-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-gray-500"
            }`}
          />
          <span className="font-medium">{socketType}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleTimeString()}`
              : "Not checked"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkConnection();
            }}
            className="px-2 py-1 bg-gray-600/20 text-gray-400 hover:bg-gray-600/40 rounded-md text-xs"
          >
            Refresh
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 text-sm text-gray-400 border-t border-gray-700 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500">URL</div>
              <div className="font-mono">{url}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Endpoint</div>
              <div className="font-mono">{endpoint}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div
                className={`
                ${
                  status === "online"
                    ? "text-green-400"
                    : status === "connecting"
                      ? "text-yellow-400"
                      : status === "error"
                        ? "text-red-400"
                        : "text-gray-400"
                }
              `}
              >
                {status.toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Full Path</div>
              <div className="font-mono text-xs truncate">
                {url}
                {endpoint}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WebSocketDashboard: React.FC = () => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"status" | "testing" | "monitor">(
    "status",
  );

  // All WebSocket hooks and endpoints
  const websocketEndpoints = [
    {
      type: "contest-chat",
      url: WS_URL,
      endpoint: "/v2/ws/contest",
    },
    {
      type: "skyduel",
      url: WS_URL,
      endpoint: "/api/admin/skyduel",
    },
    {
      type: "wallet",
      url: WS_URL,
      endpoint: "/v2/ws/wallet",
    },
    {
      type: "market",
      url: WS_URL,
      endpoint: "/v2/ws/market",
    },
    {
      type: "achievements",
      url: WS_URL,
      endpoint: "/v2/ws/achievements",
    },
    {
      type: "portfolio",
      url: WS_URL,
      endpoint: "/v2/ws/portfolio",
    },
    {
      type: "contest",
      url: WS_URL,
      endpoint: "/v2/ws/contest/:contestId",
    },
    {
      type: "circuit-breaker",
      url: WS_URL,
      endpoint: "/api/admin/circuit-breaker",
    },
    {
      type: "services",
      url: WS_URL,
      endpoint: "/api/admin/services",
    },
    {
      type: "analytics",
      url: WS_URL,
      endpoint: "/analytics",
    },
    {
      type: "token-data",
      url: WS_URL,
      endpoint: TOKEN_DATA_WSS_PATH,
    },
  ];

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

              {websocketEndpoints.map((endpoint) => (
                <ConnectionStatus
                  key={endpoint.type}
                  socketType={endpoint.type}
                  url={endpoint.url}
                  endpoint={endpoint.endpoint}
                />
              ))}
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

const SOCKET_TYPES = {
  portfolio: {
    endpoint: "/api/v2/ws/portfolio",
    messageTypes: ["PORTFOLIO_UPDATED", "TRADE_EXECUTED"],
  },
  contest: {
    endpoint: "/api/v2/ws/contest/:contestId",
    messageTypes: ["CONTEST_UPDATED", "LEADERBOARD_UPDATED"],
  },
  market: {
    endpoint: "/api/v2/ws/market",
    messageTypes: ["MARKET_PRICE", "MARKET_VOLUME", "MARKET_SENTIMENT"],
  },
  analytics: {
    endpoint: "/analytics",
    messageTypes: ["user_activity_update"],
  },
  wallet: {
    endpoint: "/api/v2/ws/wallet",
    messageTypes: ["WALLET_UPDATED", "TRANSFER_COMPLETE"],
  },
  service: {
    endpoint: "/api/admin/services",
    messageTypes: ["service:state", "service:alert"],
  },
  circuitBreaker: {
    endpoint: "/api/admin/circuit-breaker",
    messageTypes: ["health:update", "breaker:trip"],
  },
  tokenData: {
    ////endpoint: "/api/v2/ws/tokenData",
    endpoint: TOKEN_DATA_LOCAL_URL,
    messageTypes: [
      "subscribe",
      "token_update",
      "token_price",
      "token_metadata",
      "token_liquidity",
    ],
  },
} as const;

type SocketType = keyof typeof SOCKET_TYPES;

// This component is now used as a tab inside WebSocketDashboard
const WebSocketTesting: React.FC = () => {
  const [selectedSocket, setSelectedSocket] = useState<SocketType | "">("");
  const [selectedMessageType, setSelectedMessageType] = useState<string>("");
  const [messagePayload, setMessagePayload] = useState<string>("");
  const [testStatus, setTestStatus] = useState<Record<string, boolean>>({});

  // Load example payload when message type is selected
  const loadExamplePayload = (messageType: string) => {
    if (selectedSocket && messageType) {
      const example = EXAMPLE_PAYLOADS[selectedSocket]?.[messageType];
      if (example) {
        setMessagePayload(JSON.stringify(example, null, 2));
      }
    }
  };

  const handleTest = async () => {
    try {
      const response = await fetch("/api/admin/websocket/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socketType: selectedSocket,
          messageType: selectedMessageType,
          payload: JSON.parse(messagePayload),
        }),
      });

      if (!response.ok) {
        throw new Error("Test failed");
      }

      setTestStatus((prev) => ({
        ...prev,
        [selectedSocket]: true,
      }));

      toast.success(
        `Successfully tested ${selectedMessageType} on ${selectedSocket}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    }
  };

  const socketOptions = Object.entries(SOCKET_TYPES).map(([key, value]) => ({
    value: key,
    label: `${key} (${value.endpoint})`,
  }));

  return (
    <div className="bg-dark-200 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">WebSocket Message Testing</h2>
      <p className="text-gray-400 text-sm mb-6">
        Use this panel to test WebSocket message sending and receiving. Select a
        WebSocket type, message type, and payload to send a test message.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select WebSocket Connection
            </label>
            <select
              className="w-full bg-dark-300 border border-gray-700 rounded-md p-2"
              value={selectedSocket}
              onChange={(e) => {
                setSelectedSocket(e.target.value as SocketType);
                setSelectedMessageType("");
                setMessagePayload("");
              }}
            >
              <option value="">Choose a socket type</option>
              {socketOptions.map((option) => (
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
              disabled={!selectedSocket}
            >
              <option value="">Choose a message type</option>
              {selectedSocket &&
                SOCKET_TYPES[selectedSocket].messageTypes.map((type) => (
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
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleTest}
            disabled={
              !selectedSocket || !selectedMessageType || !messagePayload
            }
          >
            Test Connection
          </button>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-dark-300 rounded-lg p-4 border border-gray-700 mb-4">
            <h3 className="font-medium mb-3">Test Results</h3>
            {Object.keys(SOCKET_TYPES).map((socketType) => (
              <div
                key={socketType}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-sm">{socketType}</span>
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      testStatus[socketType] ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  <span className="text-xs ml-2 text-gray-400">
                    {testStatus[socketType] ? "Tested" : "Not Tested"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
            <h3 className="font-medium mb-3">Testing Tips</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Test messages are only sent to your own session</li>
              <li>• Messages should appear in the WebSocket Monitor below</li>
              <li>• Message types vary by WebSocket service</li>
              <li>• Use the example payloads as starting points</li>
              <li>• All test message timestamps are automatically updated</li>
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
