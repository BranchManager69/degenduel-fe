// src/pages/superadmin/WssPlayground.tsx

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../../store/useStore";

interface Message {
  type: string;
  timestamp: string;
  data?: any;
  error?: string;
  latency?: number;
  direction?: "incoming" | "outgoing";
}

interface Stats {
  avgLatency: number;
  messageCount: number;
  errorCount: number;
  lastReconnect: Date | null;
  connectedClients?: number;
  outgoingCount: number;
  incomingCount: number;
  connectionDuration: number;
}

interface PortfolioData {
  tokens: Array<{
    symbol: string;
    amount: number;
  }>;
  total_value: number;
  performance_24h: number;
}

export const WssPlayground: React.FC = () => {
  const { user } = useStore();
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
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
    outgoingCount: 0,
    incomingCount: 0,
    connectionDuration: 0,
  });
  
  const [pingInterval] = useState<number>(5000);
  const [autoPing] = useState<boolean>(true);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Predefined test messages

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const setupAutoPing = () => {
    // Clear existing interval if any
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (autoPing && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      pingIntervalRef.current = setInterval(() => {
        sendMessage("ping", {});
      }, pingInterval);
    }
  };

  const setupConnectionDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    connectionStartTimeRef.current = Date.now();
    
    durationIntervalRef.current = setInterval(() => {
      if (connectionStartTimeRef.current) {
        const duration = Math.floor((Date.now() - connectionStartTimeRef.current) / 1000);
        setStats(prev => ({ ...prev, connectionDuration: duration }));
      }
    }, 1000);
  };

  const connectWebSocket = () => {
    try {
      if (!user?.jwt) {
        setError("No authentication token available");
        return;
      }

      setStatus("connecting");

      // Clear any existing timers
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Reset connection stats
      connectionStartTimeRef.current = null;
      setStats(prev => ({
        ...prev,
        connectionDuration: 0,
        lastReconnect: new Date()
      }));

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log("Attempting WebSocket connection...");

      // Create the Portfolio WebSocket with JWT token in protocol
      const ws = new WebSocket(
        `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
          window.location.host
        }/api/v2/ws/portfolio`,
        user.jwt
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setStatus("connected");
        setError(null);
        
        // Start tracking connection duration
        setupConnectionDurationTimer();
        
        // Setup auto-ping if enabled
        setupAutoPing();
        
        // Add connection message to the log
        const connectionMsg: Message = {
          type: "CONNECTION_ESTABLISHED",
          timestamp: new Date().toISOString(),
          data: { status: "connected" },
          direction: "incoming"
        };
        
        setMessages(prev => [connectionMsg, ...prev]);
        setStats((prev) => ({ 
          ...prev, 
          lastReconnect: new Date(),
          incomingCount: prev.incomingCount + 1,
          messageCount: prev.messageCount + 1
        }));

        // Send initial ping
        sendMessage("ping", {});
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          message.direction = "incoming";
          console.log("Received message:", message);

          // Calculate latency for ping/pong
          if (message.type === "pong") {
            const latency = Date.now() - new Date(message.timestamp).getTime();
            message.latency = latency;

            setStats((prev) => ({
              ...prev,
              messageCount: prev.messageCount + 1,
              incomingCount: prev.incomingCount + 1,
              avgLatency:
                (prev.avgLatency * prev.messageCount + latency) /
                (prev.messageCount + 1),
            }));
          } else {
            setStats((prev) => ({
              ...prev,
              messageCount: prev.messageCount + 1,
              incomingCount: prev.incomingCount + 1,
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
              setStats((prev) => ({
                ...prev,
                errorCount: prev.errorCount + 1,
              }));
              break;
            case "CONNECTED_CLIENTS":
              if (message.data && typeof message.data.count === 'number') {
                setStats(prev => ({
                  ...prev,
                  connectedClients: message.data.count
                }));
              }
              break;
          }

          setMessages((prev) => [message, ...prev]);
        } catch (err) {
          console.error("Error parsing message:", err);
          setError("Failed to parse message");
          setStats((prev) => ({ 
            ...prev, 
            errorCount: prev.errorCount + 1,
            messageCount: prev.messageCount + 1,
            incomingCount: prev.incomingCount + 1
          }));
          
          // Add error message to the log
          const errorMsg: Message = {
            type: "PARSE_ERROR",
            timestamp: new Date().toISOString(),
            error: `Failed to parse: ${event.data}`,
            direction: "incoming"
          };
          
          setMessages(prev => [errorMsg, ...prev]);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Disconnected", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        setStatus("disconnected");
        
        // Stop all timers
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        // Add disconnect message to the log
        const disconnectMsg: Message = {
          type: "CONNECTION_CLOSED",
          timestamp: new Date().toISOString(),
          data: { 
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          },
          direction: "incoming"
        };
        
        setMessages(prev => [disconnectMsg, ...prev]);
        setStats(prev => ({
          ...prev,
          incomingCount: prev.incomingCount + 1,
          messageCount: prev.messageCount + 1
        }));

        // Auto reconnect logic
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket Error:", event);
        const errorMessage = (event as ErrorEvent).message || "Unknown error";
        setError(`WebSocket error: ${errorMessage}`);
        setStatus("disconnected");
        
        // Add error message to the log
        const errorMsg: Message = {
          type: "CONNECTION_ERROR",
          timestamp: new Date().toISOString(),
          error: errorMessage,
          direction: "incoming"
        };
        
        setMessages(prev => [errorMsg, ...prev]);
        setStats((prev) => ({ 
          ...prev, 
          errorCount: prev.errorCount + 1,
          messageCount: prev.messageCount + 1,
          incomingCount: prev.incomingCount + 1
        }));
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to create WebSocket: ${errorMessage}`);
      setStatus("disconnected");
      
      // Add error message to the log
      const errorMsg: Message = {
        type: "INITIALIZATION_ERROR",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        direction: "incoming"
      };
      
      setMessages(prev => [errorMsg, ...prev]);
      setStats((prev) => ({ 
        ...prev, 
        errorCount: prev.errorCount + 1,
        messageCount: prev.messageCount + 1,
        incomingCount: prev.incomingCount + 1
      }));
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear all timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };
  
  const sendMessage = (type: string, data: any = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected");
      return false;
    }
    
    try {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      
      wsRef.current.send(JSON.stringify(message));
      
      // Add to message log
      const logMessage: Message = {
        ...message,
        direction: "outgoing"
      };
      
      setMessages(prev => [logMessage, ...prev]);
      setStats(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
        outgoingCount: prev.outgoingCount + 1
      }));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to send message: ${errorMessage}`);
      
      // Add error to message log
      const errorMsg: Message = {
        type: "SEND_ERROR",
        timestamp: new Date().toISOString(),
        error: errorMessage,
        direction: "outgoing"
      };
      
      setMessages(prev => [errorMsg, ...prev]);
      setStats(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        messageCount: prev.messageCount + 1,
        outgoingCount: prev.outgoingCount + 1
      }));
      
      return false;
    }
  };

  const sendTestPortfolio = () => {
    const testPortfolio: PortfolioData = {
      tokens: [
        { symbol: "DUEL", amount: 1420069 },
        { symbol: "BONKFA", amount: 696969 },
        { symbol: "ASS", amount: 420420 },
        { symbol: "TITS", amount: 8008135 },
        { symbol: "SOL", amount: 0.69 },
      ],
      total_value: 169,
      performance_24h: 69.0,
    };

    return sendMessage("PORTFOLIO_UPDATE_REQUEST", testPortfolio);
  };

  const clearMessages = () => {
    setMessages([]);
    setStats((prev) => ({ 
      ...prev, 
      messageCount: 0, 
      avgLatency: 0,
      incomingCount: 0,
      outgoingCount: 0
    }));
  };

  // Setup autoPing when settings change
  useEffect(() => {
    setupAutoPing();
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [autoPing, pingInterval, status]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
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
        <h1 className="text-3xl font-bold text-gray-100">WSS Playground</h1>
        <h2 className="text-xl font-bold text-gray-100">
          WebSocket Playground
        </h2>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <h2 className="text-xl font-bold text-gray-100">
            Portfolio Connection
          </h2>
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
            <label className="text-sm text-gray-400">Auto-Reconnect</label>
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
          Clear Logs
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
          <h2 className="text-xl font-semibold text-gray-100">Message Logs</h2>
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
