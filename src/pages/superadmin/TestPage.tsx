// src/pages/superadmin/TestPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../store/useStore";

interface Message {
  type: string;
  timestamp: string;
  data?: any;
  error?: string;
  latency?: number;
}

interface Stats {
  avgLatency: number;
  messageCount: number;
  errorCount: number;
  lastReconnect: Date | null;
  connectedClients?: number;
}

interface PortfolioData {
  tokens: Array<{
    symbol: string;
    amount: number;
  }>;
  total_value: number;
  performance_24h: number;
}

export const TestPage: React.FC = () => {
  const { user } = useStore();
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [stats, setStats] = useState<Stats>({
    avgLatency: 0,
    messageCount: 0,
    errorCount: 0,
    lastReconnect: null,
    connectedClients: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectWebSocket = () => {
    try {
      if (!user?.jwt) {
        setError("No authentication token available");
        return;
      }

      setStatus("connecting");

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log("Attempting WebSocket connection...");

      // Create WebSocket with JWT token in protocol
      const ws = new WebSocket(
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v2/ws/portfolio`,
        user.jwt
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setStatus("connected");
        setError(null);
        setStats((prev) => ({ ...prev, lastReconnect: new Date() }));

        // Send initial ping
        ws.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          console.log("Received message:", message);

          // Calculate latency for ping/pong
          if (message.type === "pong") {
            const latency = Date.now() - new Date(message.timestamp).getTime();
            message.latency = latency;
            
            setStats((prev) => ({
              ...prev,
              messageCount: prev.messageCount + 1,
              avgLatency: (prev.avgLatency * prev.messageCount + latency) / (prev.messageCount + 1),
            }));
          } else {
            setStats((prev) => ({
              ...prev,
              messageCount: prev.messageCount + 1,
            }));
          }

          // Handle specific message types
          switch (message.type) {
            case "CONNECTED":
              console.log("Connection confirmed");
              break;
            case "PORTFOLIO_UPDATED":
              console.log("Portfolio updated:", message.data);
              break;
            case "ERROR":
              setError(message.error || "Unknown error");
              setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
              break;
          }

          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error("Error parsing message:", err);
          setError("Failed to parse message");
          setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Disconnected", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setStatus("disconnected");

        // Auto reconnect logic
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket Error:", event);
        setError(`WebSocket error: ${(event as ErrorEvent).message || "Unknown error"}`);
        setStatus("disconnected");
        setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError(
        `Failed to create WebSocket: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setStatus("disconnected");
      setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  const sendTestPortfolio = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected");
      return;
    }

    const testPortfolio: PortfolioData = {
      tokens: [
        { symbol: "SOL", amount: 1.5 },
        { symbol: "BONK", amount: 1000000 },
      ],
      total_value: 150,
      performance_24h: 5.2,
    };

    wsRef.current.send(
      JSON.stringify({
        type: "PORTFOLIO_UPDATE_REQUEST",
        data: testPortfolio,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const clearMessages = () => {
    setMessages([]);
    setStats((prev) => ({ ...prev, messageCount: 0, avgLatency: 0 }));
  };

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const filteredMessages = filterType
    ? messages.filter((msg) => msg.type.toLowerCase().includes(filterType.toLowerCase()))
    : messages;

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100">Portfolio WebSocket Test</h1>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                status === "connected"
                  ? "bg-green-500 animate-pulse"
                  : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium text-gray-300 capitalize">{status}</span>
          </div>

          {/* Auto Reconnect Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Auto Reconnect</label>
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="form-checkbox h-4 w-4 text-brand-500 rounded border-dark-400 bg-dark-300 focus:ring-brand-500"
            />
          </div>

          {/* Connection Controls */}
          <div className="flex gap-2">
            <button
              onClick={connectWebSocket}
              disabled={status === "connected"}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50 hover:bg-brand-600 transition-colors"
            >
              Connect
            </button>
            <button
              onClick={disconnectWebSocket}
              disabled={status === "disconnected"}
              className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Connection Status</div>
          <div className="text-xl font-semibold text-gray-100 capitalize">{status}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.lastReconnect && `Last reconnect: ${stats.lastReconnect.toLocaleTimeString()}`}
          </div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Performance</div>
          <div className="text-xl font-semibold text-gray-100">{stats.avgLatency.toFixed(2)}ms</div>
          <div className="text-xs text-gray-500 mt-1">Average latency</div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Messages</div>
          <div className="text-xl font-semibold text-gray-100">{stats.messageCount}</div>
          <div className="text-xs text-gray-500 mt-1">Total received</div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Errors</div>
          <div className="text-xl font-semibold text-red-400">{stats.errorCount}</div>
          <div className="text-xs text-gray-500 mt-1">Total errors</div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter messages by type..."
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={sendTestPortfolio}
          disabled={status !== "connected"}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50 hover:bg-brand-600 transition-colors"
        >
          Send Test Portfolio
        </button>
        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
        >
          Clear Log
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Message Log */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300">
        <div className="p-4 border-b border-dark-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">Message Log</h2>
          <span className="text-sm text-gray-400">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""}
            {filterType && ` (filtered by "${filterType}")`}
          </span>
        </div>
        <div className="overflow-auto max-h-[500px]">
          {filteredMessages.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">No messages received</div>
          ) : (
            <div className="divide-y divide-dark-300">
              {filteredMessages.map((msg, index) => (
                <div key={index} className="p-4 hover:bg-dark-300/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-4">
                      {msg.latency && (
                        <span className="text-xs text-gray-500">{msg.latency.toFixed(2)}ms</span>
                      )}
                      <span className="text-sm font-mono text-brand-400">{msg.type}</span>
                    </div>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-auto">
                    {JSON.stringify(msg.data || msg.error || {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
