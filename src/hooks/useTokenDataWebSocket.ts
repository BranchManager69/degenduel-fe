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

  // Unique ID for this hook instance - use a better ID that doesn't reference token-data directly
  const wsId = `market-data-${Math.random().toString(36).substring(2, 9)}`;

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

        // Handle DATA messages exactly as specified in WS.TXT:
        // "1. DATA Message
        //  {
        //    "type": "DATA",
        //    "topic": "market-data",
        //    "action": "getToken",     // Optional: indicates which request/action this data is for
        //    "requestId": "req123",    // Optional: matches client requestId if this is a response
        //    "data": { ... },
        //    "timestamp": "2025-03-27T12:34:56.789Z",
        //    "initialData": false      // Optional: true if this is initial data after subscription
        //  }"
        if (message.type === MessageType.DATA) {
          // Process market-data topic messages
          if (message.topic === TopicType.MARKET_DATA) {
            if (message.data && Array.isArray(message.data)) {
              // Array data format - token list
              setTokens(message.data);
              setLastUpdate(new Date());
              console.log(`[TokenDataWebSocket] Received token list with ${message.data.length} tokens`);
            } else if (message.action === 'getAllTokens' && message.data && Array.isArray(message.data)) {
              // This is the response to getAllTokens request
              setTokens(message.data);
              setLastUpdate(new Date());
              console.log(`[TokenDataWebSocket] Received getAllTokens response with ${message.data.length} tokens`);
            } else if (message.action === 'getToken' && message.data) {
              // Single token update - follow the example in WS.TXT
              const tokenData = message.data;
              if (tokenData && tokenData.symbol) {
                setTokens((prev) => {
                  // Update existing token or add new one
                  const existingIndex = prev.findIndex(token => token.symbol === tokenData.symbol);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...prev[existingIndex], ...tokenData };
                    return updated;
                  } else {
                    return [...prev, tokenData];
                  }
                });
                setLastUpdate(new Date());
                console.log(`[TokenDataWebSocket] Received token update for ${tokenData.symbol}`);
              }
            }
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