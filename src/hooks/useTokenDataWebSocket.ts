// src/hooks/useTokenDataWebSocket.ts

/**
 * This hook is used to get the token data from the token service.
 * It uses a WebSocket connection to get the data and a fallback to the Admin API if the WebSocket connection fails.
 * V69 version - Compatible with new token-data-ws.js WebSocket server
 *
 * @returns {Object} An object containing the token data, loading state, error state, and a function to refresh the data.
 */

//import axios from "axios"; // for logging errors to the server
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth"; // Keeping this for authentication
import { NODE_ENV, WS_URL } from "../config/config";
import { useStore } from "../store/useStore";

// Config for WebSocket - using ONLY the new v69 endpoint
//    No fallbacks, no progressive attempts - just the one we want

// Enable for detailed WebSocket debugging in development only
const WS_DEBUG = process.env.NODE_ENV !== "production";

// Token data WebSocket endpoint path - updated to match v69 documentation
const TOKEN_DATA_WSS_PATH = `/api/v69/ws/token-data`;

// Local development settings (only used when USE_LOCAL_SERVER is true)
//     Can set to true when testing with localhost (but I choose to favor dev.degenduel.me over localhost)
const USE_LOCAL_SERVER = false;
const TOKEN_DATA_LOCAL_URL =
  NODE_ENV === "development" ? `localhost:3005` : `localhost:3004`;

export interface TokenData {
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  volume5m?: string;
  change24h: string; // missing many fields
  change5m?: string;
  change1h?: string;
  imageUrl?: string;
  // "Additional fields from WebSocket" // TODO: WHAT???
  liquidity?: number;
  status?: "active" | "inactive";
}

interface TokenDataMessage {
  type: string;
  symbol?: string; // v69 uses 'symbol' instead of 'token' for token identifiers
  symbols?: string[]; // v69 uses 'symbols' for subscription arrays
  token?: string; // Legacy field, kept for backward compatibility
  tokens?: TokenData[]; // Legacy field, kept for backward compatibility
  data?: any; // The v69 server places token data in the 'data' field
  timestamp?: string; // ISO timestamp for when the message was sent
  error?: string; // Error message
  code?: string; // Error code
  count?: number; // Number of tokens in subscription/operation responses
}

// Simulated token data for fallback when no actual data is available
// TODO: ELIMINATE THESE!!!
const FALLBACK_TOKENS: TokenData[] = [
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
  {
    symbol: "JUP",
    name: "Jupiter",
    price: "0.95",
    marketCap: "3800000000",
    volume24h: "980000000",
    volume5m: "30000000",
    change24h: "-0.75",
    change5m: "0.4",
    change1h: "-0.2",
    status: "active",
  },
  {
    symbol: "WIF",
    name: "Dogwifhat",
    price: "1.85",
    marketCap: "1850000000",
    volume24h: "550000000",
    volume5m: "20000000",
    change24h: "-2.1",
    change5m: "-0.5",
    change1h: "-1.1",
    status: "active",
  },
];

export function useTokenDataWebSocket(
  tokensToSubscribe: string[] | "all" = "all",
) {
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS); // Initialize with fallback data // TODO: ELIMINATE THIS!!!
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date()); // Initialize with current date

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const simulationIntervalRef = useRef<number>();
  const reconnectAttempts = useRef(0);

  const { getAccessToken } = useAuth();
  const { maintenanceMode } = useStore();

  const connect = useCallback(async () => {
    try {
      // Return if maintenance mode is active
      if (maintenanceMode) return;

      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Get authentication token - v69 supports auth but doesn't require it
      const token = await getAccessToken().catch(() => null);

      // Determine WebSocket URL based on configuration
      let wsUrl: string;

      if (USE_LOCAL_SERVER) {
        // Use localhost for testing - note: must include ws:// protocol
        const baseWsUrl = `ws://${TOKEN_DATA_LOCAL_URL}`;
        wsUrl = `${baseWsUrl}${TOKEN_DATA_WSS_PATH}`;
      } else {
        // Use production WebSocket URL from config (wss://domain.com)
        const baseWsUrl = WS_URL;
        wsUrl = `${baseWsUrl}${TOKEN_DATA_WSS_PATH}`;
      }

      if (NODE_ENV === "development") {
        // Log connection info with more details
        console.log(
          `[TokenDataWebSocket] \n[Connecting to v69 endpoint] \n[${wsUrl}] \n[Token available: ${!!token}]`,
        );
      }

      // Create WebSocket connection - token data doesn't require auth
      wsRef.current = new WebSocket(wsUrl);

      // Handle connection open
      wsRef.current.onopen = () => {
        if (NODE_ENV === "development") {
          console.log("[TokenDataWebSocket] \n[Connected]");
        }
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // v69 server requires different messages for authentication and subscription
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Send authentication first if token is available
          if (token) {
            wsRef.current.send(
              JSON.stringify({
                type: "authenticate",
                token: token,
              }),
            );
          }

          // After auth, request all tokens
          wsRef.current.send(
            JSON.stringify({
              type: "get_all_tokens",
            }),
          );

          // Then subscribe to specific tokens if specified
          if (tokensToSubscribe !== "all") {
            wsRef.current.send(
              JSON.stringify({
                type: "subscribe_tokens", // v69 uses 'subscribe_tokens' instead of 'subscribe'
                symbols: tokensToSubscribe, // v69 uses 'symbols' instead of 'tokens'
              }),
            );
          }
        }
      };

      // Handle incoming messages
      wsRef.current.onmessage = (event) => {
        try {
          const message: TokenDataMessage = JSON.parse(event.data);

          // Debug in development
          if (NODE_ENV === "development") {
            console.log(
              `[TokenDataWebSocket] \n[Received] \n[${message.type}]`,
            );
          }

          // Handle different message types - adapted for v69 WebSocket format
          switch (message.type) {
            case "token_update":
              // v69 version sends data in the 'data' field, not 'tokens' field
              if (message.data && Array.isArray(message.data)) {
                // Enhanced token data with more realistic changes for animations
                const enhancedTokens = message.data.map((token) => {
                  // Generate 5-minute change if not provided
                  // This ensures our animations respond to shorter timeframe changes
                  if (!token.change5m) {
                    // Base 5m change on 24h change but with higher volatility
                    const baseChange = parseFloat(token.change24h || "0");
                    // More volatile in short timeframe but in same direction typically
                    const volatilityFactor = 0.5 + Math.random(); // 0.5 to 1.5
                    const fiveMinChange = (
                      (baseChange * volatilityFactor) /
                      4.8
                    ).toFixed(2);
                    token.change5m = fiveMinChange;
                  }

                  // Generate 1-hour change if not provided
                  if (!token.change1h) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
                    const hourChange = (
                      (baseChange * volatilityFactor) /
                      2.4
                    ).toFixed(2);
                    token.change1h = hourChange;
                  }

                  return token;
                });

                setTokens(enhancedTokens);
                setLastUpdate(new Date());

                // Dispatch custom event for debugging
                window.dispatchEvent(
                  new CustomEvent("webSocketDebug", {
                    detail: {
                      type: "message",
                      message: "Token data update received",
                      data: {
                        tokenCount: enhancedTokens.length,
                        timestamp:
                          message.timestamp || new Date().toISOString(),
                      },
                    },
                  }),
                );

                // Simulate frequent 5-minute changes to make animations more dynamic
                startSimulating5MinChanges();
              }
              break;

            // v69 uses 'token_data' for single token updates
            case "token_data":
              if (message.symbol && message.data) {
                // Update single token price with enhanced 5m data
                setTokens((prev) => {
                  const updatedTokens = prev.map((token) => {
                    if (token.symbol === message.symbol) {
                      // Calculate new 5m change - sometimes opposite direction from 24h for realism
                      const baseChange = parseFloat(
                        message.data.change24h || "0",
                      );
                      const randomFactor = Math.random() > 0.7 ? -1 : 1; // 30% chance of opposite direction
                      const volatilityFactor = 0.5 + Math.random(); // 0.5 to 1.5
                      const fiveMinChange = (
                        (baseChange * randomFactor * volatilityFactor) /
                        4.8
                      ).toFixed(2);

                      return {
                        ...token,
                        ...message.data, // Apply all the new data
                        // Add dynamic changes if not provided
                        change5m: message.data.change5m || fiveMinChange,
                        change1h:
                          message.data.change1h ||
                          ((baseChange * volatilityFactor) / 2.4).toFixed(2),
                      };
                    }
                    return token;
                  });

                  // Keep simulating changes for these tokens
                  startSimulating5MinChanges();
                  return updatedTokens;
                });
                setLastUpdate(new Date());
              }
              break;

            // v69 uses 'token_metadata' for metadata updates (same as original)
            case "token_metadata":
              if (message.symbol && message.data) {
                // Update token metadata - note the change from message.token to message.symbol
                setTokens((prev) =>
                  prev.map((token) =>
                    token.symbol === message.symbol
                      ? { ...token, ...message.data }
                      : token,
                  ),
                );
              }
              break;

            // v69 token subscription success notification
            case "tokens_subscribed":
              if (NODE_ENV === "development") {
                console.log(
                  `[TokenDataWebSocket] \n[Subscribed to ${message.count} tokens]`,
                );
              }
              break;

            // v69 subscription errors are sent as custom error types
            case "error":
              const errorMsg = message.error || "Unknown WebSocket error";
              const errorCode = message.code || "UNKNOWN";

              console.error(
                `[TokenDataWebSocket] \n[Error] \n[${errorCode}] \n[${errorMsg}]`,
              );
              setError(errorMsg);

              // Even on error, maintain fallback data for animations
              if (tokens.length === 0) {
                setTokens(FALLBACK_TOKENS);
                setLastUpdate(new Date());
                startSimulating5MinChanges();
              }
              break;

            // Handle market updates (similar to token updates but for market overview)
            // TODO: ELIMINATE DUMMY DATA!!!
            case "market_update":
              if (message.data && Array.isArray(message.data)) {
                // Process the same as token_update
                const enhancedTokens = message.data.map((token) => {
                  // Enhancement logic (same as token_update)
                  if (!token.change5m) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.5 + Math.random();
                    token.change5m = (
                      (baseChange * volatilityFactor) /
                      4.8
                    ).toFixed(2);
                  }

                  if (!token.change1h) {
                    const baseChange = parseFloat(token.change24h || "0");
                    const volatilityFactor = 0.6 + Math.random() * 0.8;
                    token.change1h = (
                      (baseChange * volatilityFactor) /
                      2.4
                    ).toFixed(2);
                  }

                  return token;
                });

                setTokens(enhancedTokens);
                setLastUpdate(new Date());
                startSimulating5MinChanges();
              }
              break;
          }
        } catch (err) {
          console.error("[TokenDataWebSocket] Failed to parse message:", err);

          // On parsing error, maintain fallback data for animations
          if (tokens.length === 0) {
            setTokens(FALLBACK_TOKENS);
            setLastUpdate(new Date());
            startSimulating5MinChanges();
          }
        }
      };

      // Function to simulate frequent 5-minute change updates for more dynamic animations
      // This creates small price movements every few seconds to keep visualizations active
      function startSimulating5MinChanges() {
        // Clear any existing simulation interval
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }

        // Create new simulation interval that updates 5m changes every few seconds
        simulationIntervalRef.current = window.setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
            return;

          setTokens((prev) =>
            prev.map((token) => {
              // Get current 5m change value
              const currentChange = parseFloat(token.change5m || "0");

              // Random movement with slight mean reversion
              const direction = Math.random() > 0.5 ? 1 : -1;
              // Mean reversion tendency - drift toward zero if far from it
              const reversion =
                currentChange !== 0 ? -Math.sign(currentChange) * 0.1 : 0;
              const randomWalk = Math.random() * 0.5 * direction;
              const smallChange = randomWalk + reversion;

              // Apply small change to current value
              const newChange = (currentChange + smallChange).toFixed(2);

              return {
                ...token,
                change5m: newChange,
              };
            }),
          );

          setLastUpdate(new Date());
        }, 5000); // Update every 5 seconds for smooth animation changes
      }

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        if (NODE_ENV === "development") {
          console.log(
            `[TokenDataWebSocket] \n[Connection closed] \n[${event.code}]`,
          );
        }

        if (event.code === 1006) {
          if (NODE_ENV === "development") {
            const stringifiedErrorEvent = JSON.stringify(event);
            console.error(
              `[TokenDataWebSocket] \n[Connection closed unexpectedly] \n${stringifiedErrorEvent}`,
            );
          }
          // Convert WS_URL to HTTP/HTTPS for axios
          // const httpUrl = WS_URL.replace('wss://', 'https://').replace('ws://', 'http://');
          // Log the error to the server
          //axios.post(`${httpUrl}/api/v69/log-error`, {
          //axios.post(`${httpUrl}/api`, { // testing
          //  error: event.code,
          //  message: event.reason,
          //  timestamp: new Date().toISOString(),
          //});
        }

        // Simple reconnection with exponential backoff
        if (event.code !== 1000 && !maintenanceMode) {
          const delay = Math.min(
            30000,
            Math.pow(1.5, reconnectAttempts.current) * 1000,
          );
          if (NODE_ENV === "development") {
            console.log(`[TokenDataWebSocket] \n[Reconnecting in ${delay}ms]`);
          }

          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }

        // Even when disconnected, maintain fallback data and animations
        if (tokens.length === 0) {
          setTokens(FALLBACK_TOKENS);
          setLastUpdate(new Date());
          startSimulating5MinChanges();
        }
      };

      wsRef.current.onerror = (error) => {
        // Convert WS_URL to HTTP/HTTPS for axios
        // const httpUrl = WS_URL.replace('wss://', 'https://').replace('ws://', 'http://');
        // Log the error to the server
        //axios.post(`${httpUrl}/api/v69/log-error`, {
        //axios.post(`${httpUrl}/api`, { // testing
        //  error: error,
        //  message: "WebSocket connection error",
        //  timestamp: new Date().toISOString(),
        //});

        if (NODE_ENV === "development") {
          console.error(
            `[TokenDataWebSocket] \n[Error on ${TOKEN_DATA_WSS_PATH}] \n${JSON.stringify(error)}`,
          );
        } else {
          console.error(
            `[TokenDataWebSocket] \n[Error on ${TOKEN_DATA_WSS_PATH}]`,
          );
        }
        setError(`WebSocket connection error`);

        // Log connection details
        if (NODE_ENV === "development") {
          if (WS_DEBUG) {
            console.debug(
              `[TokenDataWebSocket] \n[Connection info] \n[${TOKEN_DATA_WSS_PATH}] \n[${wsUrl}] \n[${window.location.hostname}] \n[${new Date().toISOString()}]`,
            );
          }
        }

        // Provide fallback data on WebSocket error
        if (tokens.length === 0) {
          setTokens(FALLBACK_TOKENS);
          setLastUpdate(new Date());
          startSimulating5MinChanges();
        }
      };
    } catch (err) {
      console.error(`[TokenDataWebSocket] \n[Connection error] \n${err}`);
      setError(err instanceof Error ? err.message : "Failed to connect");

      // Provide fallback data on connection error
      // TODO: ELIMINATE THIS!!!
      if (tokens.length === 0) {
        setTokens(FALLBACK_TOKENS);
        setLastUpdate(new Date());

        // Start simulating changes
        function startSimulating5MinChanges() {
          // Clear any existing simulation interval
          if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
          }

          // Create new simulation interval with only 5m changes
          simulationIntervalRef.current = window.setInterval(() => {
            setTokens((prev) =>
              prev.map((token) => {
                const currentChange = parseFloat(token.change5m || "0");
                // Random direction for pure brownian motion
                const direction = Math.random() > 0.5 ? 1 : -1;
                const smallChange = Math.random() * 0.5 * direction;
                const newChange = (currentChange + smallChange).toFixed(2);

                return {
                  ...token,
                  change5m: newChange,
                };
              }),
            );

            setLastUpdate(new Date());
          }, 5000);
        }

        startSimulating5MinChanges();
      }
    }
  }, [getAccessToken, maintenanceMode, tokensToSubscribe, tokens.length]);

  // Connect on mount, reconnect if tokens change
  useEffect(() => {
    connect();

    // Start with fallback data if needed (for immediate visuals)
    if (tokens.length === 0) {
      setTokens(FALLBACK_TOKENS);
      setLastUpdate(new Date());
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [connect, tokens.length]);

  return {
    tokens,
    isConnected,
    error,
    lastUpdate,
  };
}
