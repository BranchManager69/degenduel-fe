import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useAuth } from "./useAuth"; // Assuming authentication hook

export interface TokenData {
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  change24h: string;
  imageUrl?: string;
  // Additional fields from WebSocket
  liquidity?: number;
  status?: "active" | "inactive";
}

interface TokenDataMessage {
  type: string;
  token?: string;
  tokens?: TokenData[];
  data?: any;
}

export function useTokenDataWebSocket(
  tokensToSubscribe: string[] | "all" = "all"
) {
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const { getAccessToken } = useAuth();
  const { maintenanceMode } = useStore();

  const connect = useCallback(async () => {
    try {
      if (maintenanceMode) return;

      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Get authentication token
      const token = await getAccessToken();

      // Create WebSocket connection
      const wsUrl = `wss://${window.location.host}/api/v2/ws/tokenData`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("[TokenDataWebSocket] Connected");
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Subscribe to tokens
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "subscribe",
              tokens: tokensToSubscribe,
            })
          );

          // Also add authentication
          wsRef.current.send(
            JSON.stringify({
              type: "authenticate",
              token: token,
            })
          );
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: TokenDataMessage = JSON.parse(event.data);

          // Handle different message types
          switch (message.type) {
            case "token_update":
              if (message.tokens) {
                setTokens(message.tokens);
                setLastUpdate(new Date());

                // Dispatch custom event for debugging
                window.dispatchEvent(
                  new CustomEvent("webSocketDebug", {
                    detail: {
                      type: "message",
                      message: "Token data update received",
                      data: {
                        tokenCount: message.tokens.length,
                        timestamp: new Date().toISOString(),
                      },
                    },
                  })
                );
              }
              break;

            case "token_price":
              if (message.token && message.data) {
                // Update single token price
                setTokens((prev) =>
                  prev.map((token) =>
                    token.symbol === message.token
                      ? {
                          ...token,
                          price: message.data.price,
                          change24h: message.data.change24h,
                        }
                      : token
                  )
                );
                setLastUpdate(new Date());
              }
              break;

            case "token_metadata":
              if (message.token && message.data) {
                // Update token metadata
                setTokens((prev) =>
                  prev.map((token) =>
                    token.symbol === message.token
                      ? { ...token, ...message.data }
                      : token
                  )
                );
              }
              break;

            case "token_liquidity":
              if (message.token && message.data) {
                // Update token liquidity
                setTokens((prev) =>
                  prev.map((token) =>
                    token.symbol === message.token
                      ? { ...token, liquidity: message.data.liquidity }
                      : token
                  )
                );
              }
              break;

            case "error":
              console.error("[TokenDataWebSocket] Error:", message.data);
              setError(message.data);
              break;
          }
        } catch (err) {
          console.error("[TokenDataWebSocket] Failed to parse message:", err);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        console.log(`[TokenDataWebSocket] Connection closed: ${event.code}`);

        // Don't reconnect if explicitly closed or in maintenance mode
        if (event.code !== 1000 && !maintenanceMode) {
          const delay = Math.min(
            30000,
            Math.pow(1.5, reconnectAttempts.current) * 1000
          );
          console.log(`[TokenDataWebSocket] Reconnecting in ${delay}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("[TokenDataWebSocket] Error:", error);
        setError("WebSocket connection error");
      };
    } catch (err) {
      console.error("[TokenDataWebSocket] Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [getAccessToken, maintenanceMode, tokensToSubscribe]);

  // Connect on mount, reconnect if tokens change
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    tokens,
    isConnected,
    error,
    lastUpdate,
  };
}
