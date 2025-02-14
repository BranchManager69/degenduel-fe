import React, { useState } from "react";
import toast from "react-hot-toast";
import { WebSocketMonitor } from "../../components/debug/WebSocketMonitor";
import { useStore } from "../../store/useStore";

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
} as const;

type SocketType = keyof typeof SOCKET_TYPES;

export const WebSocketTesting: React.FC = () => {
  const { user } = useStore();
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

  if (!user?.is_superadmin) {
    return (
      <div className="p-4">
        <p className="text-red-500">
          Access Denied: Superadmin privileges required.
        </p>
      </div>
    );
  }

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
        `Successfully tested ${selectedMessageType} on ${selectedSocket}`
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket Testing Panel</h1>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-dark-200 rounded-lg p-6 shadow-lg">
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
                rows={6}
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
        </div>

        <div className="col-span-4">
          <div className="bg-dark-200 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4">Connection Status</h2>
            {Object.keys(SOCKET_TYPES).map((socketType) => (
              <div
                key={socketType}
                className="flex justify-between items-center mb-2"
              >
                <span>{socketType}</span>
                <div
                  className={`w-3 h-3 rounded-full ${
                    testStatus[socketType] ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-dark-200 rounded-lg p-6 shadow-lg">
        <h2 className="text-lg font-bold mb-4">WebSocket Monitor</h2>
        <WebSocketMonitor />
      </div>
    </div>
  );
};
