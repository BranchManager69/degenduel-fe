// src/hooks/useTokenDataWebSocket.ts

/**
 * This hook uses the unified WebSocket system to get token data
 * It subscribes to the market-data topic and processes token updates
 *
 * @returns {Object} An object containing token data, connection status, and error state
 */

import { useEffect, useState } from "react";
import { MessageType, TopicType, useUnifiedWebSocket } from "./websocket";
import { NODE_ENV } from "../config/config";

export interface TokenData {
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  volume5m?: string;
  change24h: string;
  change5m?: string;
  change1h?: string;
  imageUrl?: string;
  liquidity?: number;
  status?: "active" | "inactive";
}

export function useTokenDataWebSocket(
  tokensToSubscribe: string[] | "all" = "all",
) {
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<TokenData[]>([]); // Initialize with empty array, no fake data
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Unique ID for this hook instance
  const wsId = `token-data-${Math.random().toString(36).substring(2, 9)}`;

  // Use the unified WebSocket with the MARKET_DATA topic
  const ws = useUnifiedWebSocket(
    wsId,
    [MessageType.DATA, MessageType.ERROR],
    (message: any) => {
      // Handle message based on type
      try {
        if (NODE_ENV === "development") {
          console.log(`[TokenDataWebSocket] Received message:`, message);
        }

        if (message.type === MessageType.ERROR) {
          setError(message.error || message.message || "Unknown WebSocket error");
          return;
        }

        if (message.type === "token_update" || message.type === "market_update") {
          if (message.data && Array.isArray(message.data)) {
            setTokens(message.data);
            setLastUpdate(new Date());
          }
        } else if (message.type === "token_data") {
          if (message.symbol && message.data) {
            setTokens((prev) => {
              // Update single token
              const updatedTokens = prev.map((token) => {
                if (token.symbol === message.symbol) {
                  return { ...token, ...message.data };
                }
                return token;
              });
              return updatedTokens;
            });
            setLastUpdate(new Date());
          }
        } else if (message.type === "token_metadata") {
          if (message.symbol && message.data) {
            setTokens((prev) =>
              prev.map((token) =>
                token.symbol === message.symbol
                  ? { ...token, ...message.data }
                  : token
              )
            );
          }
        }
      } catch (err) {
        console.error("[TokenDataWebSocket] Failed to process message:", err);
      }
    },
    [TopicType.MARKET_DATA] // Subscribe to market data topic
  );
  
  // Update connection status from WebSocket
  useEffect(() => {
    setIsConnected(ws.isConnected);
    if (ws.error) {
      setError(ws.error);
    } else if (ws.isConnected) {
      setError(null);
    }
  }, [ws.isConnected, ws.error]);

  // Subscribe to tokens if specified
  useEffect(() => {
    if (ws.isConnected) {
      // First subscribe to the market-data topic
      ws.subscribe([TopicType.MARKET_DATA]);
      
      // Then request all tokens if needed
      if (tokensToSubscribe === "all") {
        ws.request(TopicType.MARKET_DATA, "get_all_tokens");
      } else if (Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
        // Request specific tokens
        ws.request(TopicType.MARKET_DATA, "subscribe_tokens", {
          symbols: tokensToSubscribe
        });
      }
    }
  }, [ws.isConnected, tokensToSubscribe]);

  return {
    tokens,
    isConnected,
    error,
    lastUpdate,
  };
}