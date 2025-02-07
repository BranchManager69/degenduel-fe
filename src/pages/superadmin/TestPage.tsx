// src/pages/superadmin/TestPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../store/useStore";

interface Message {
  timestamp: string;
  type: string;
  data: any;
  latency?: number;
}

interface Stats {
  avgLatency: number;
  messageCount: number;
  errorCount: number;
  lastReconnect: Date | null;
}

export const TestPage: React.FC = () => {
  const { user } = useStore();
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [messageToSend, setMessageToSend] = useState("");
  const [stats, setStats] = useState<Stats>({
    avgLatency: 0,
    messageCount: 0,
    errorCount: 0,
    lastReconnect: null,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Connect to the WebSocket
  const connectWebSocket = () => {
    try {
      setStatus("connecting");

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Add error logging
      console.log(
        "Attempting WebSocket connection with token:",
        user?.wallet_address
      );

      const ws = new WebSocket(
        `wss://degenduel.me/portfolio?token=${user?.wallet_address}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setStatus("connected");
        setError(null);
        setStats((prev) => ({ ...prev, lastReconnect: new Date() }));

        // Send initial message to test connection
        ws.send(
          JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString(),
          })
        );
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
        // Try to get more error details
        const error = event as ErrorEvent;
        setError(`WebSocket error: ${error.message || "Unknown error"}`);
        setStatus("disconnected");
        setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
      };

      // ... rest of your code ...
    } catch (err: unknown) {
      console.error("Failed to create WebSocket:", err);
      setError(
        `Failed to create WebSocket: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
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

  const sendMessage = () => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      messageToSend
    ) {
      try {
        wsRef.current.send(messageToSend);
        setMessageToSend("");
      } catch (err) {
        setError("Failed to send message");
        setStats((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
      }
    }
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
    ? messages.filter((msg) =>
        msg.type.toLowerCase().includes(filterType.toLowerCase())
      )
    : messages;

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100">
          WebSocket Test Page
        </h1>
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
            <span className="text-sm font-medium text-gray-300 capitalize">
              {status}
            </span>
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
          <div className="text-xl font-semibold text-gray-100 capitalize">
            {status}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.lastReconnect &&
              `Last reconnect: ${stats.lastReconnect.toLocaleTimeString()}`}
          </div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Performance</div>
          <div className="text-xl font-semibold text-gray-100">
            {stats.avgLatency.toFixed(2)}ms
          </div>
          <div className="text-xs text-gray-500 mt-1">Average latency</div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Messages</div>
          <div className="text-xl font-semibold text-gray-100">
            {stats.messageCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total received</div>
        </div>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
          <div className="text-sm text-gray-400">Errors</div>
          <div className="text-xl font-semibold text-red-400">
            {stats.errorCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total errors</div>
        </div>
      </div>

      {/* Message Controls */}
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
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Enter message to send..."
            value={messageToSend}
            onChange={(e) => setMessageToSend(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={sendMessage}
            disabled={!messageToSend || status !== "connected"}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50 hover:bg-brand-600 transition-colors"
          >
            Send
          </button>
        </div>
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
            {filteredMessages.length} message
            {filteredMessages.length !== 1 ? "s" : ""}
            {filterType && ` (filtered by "${filterType}")`}
          </span>
        </div>
        <div className="overflow-auto max-h-[500px]">
          {filteredMessages.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              No messages received
            </div>
          ) : (
            <div className="divide-y divide-dark-300">
              {filteredMessages.map((msg, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-dark-300/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-4">
                      {msg.latency && (
                        <span className="text-xs text-gray-500">
                          {msg.latency.toFixed(2)}ms
                        </span>
                      )}
                      <span className="text-sm font-mono text-brand-400">
                        {msg.type}
                      </span>
                    </div>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-auto">
                    {JSON.stringify(msg.data, null, 2)}
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
