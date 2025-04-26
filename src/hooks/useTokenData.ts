// src/hooks/useTokenData.ts

/**
 * Token Data Hook
 * 
 * This hook uses the unified WebSocket system to get token data.
 * It subscribes to the market-data topic and processes token updates.
 */

import { useCallback, useEffect, useState } from "react";
import { MessageType, TopicType } from "./websocket";
import { useWebSocketTopic } from "./websocket/useWebSocketTopic";

// Config
import { config } from "../config/config";
const NODE_ENV = config.ENV.NODE_ENV;
const VERBOSE_USETOKENDATA_LOGGING = 'true'; // (quick fix) Logging verbosity

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

// Message interfaces based on WS.TXT documentation
interface BaseMessage {
  type: string;
  topic?: string;
  timestamp?: string;
}

interface TokenUpdateMessage extends BaseMessage {
  type: "token_update" | "market_update";
  data: TokenData[];
}

interface SingleTokenUpdateMessage extends BaseMessage {
  type: "token_data";
  symbol: string;
  data: Partial<TokenData>;
}

interface TokenMetadataMessage extends BaseMessage {
  type: "token_metadata";
  symbol: string;
  data: Partial<TokenData>;
}

interface ErrorMessage extends BaseMessage {
  type: "ERROR";
  error: string;
  code: number;
}

type TokenDataMessage = 
  | TokenUpdateMessage 
  | SingleTokenUpdateMessage 
  | TokenMetadataMessage 
  | ErrorMessage;

/**
 * Hook for accessing real-time token data
 * 
 * @param tokensToSubscribe Array of token symbols or "all" to subscribe to all tokens
 * @returns Object containing token data, connection status, and error state
 */
export function useTokenData(
  tokensToSubscribe: string[] | "all" = "all",
) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filteredTokens, setFilteredTokens] = useState<TokenData[]>([]);
  
  // Handle incoming messages from the WebSocket
  const handleMessage = useCallback((message: TokenDataMessage) => {
    try {
      if (NODE_ENV === "development") {
        console.log(`[TokenData] Received message:`, message);
      } else {
        if (VERBOSE_USETOKENDATA_LOGGING === "true") {
          console.log(`[TokenData] Received message:`, message);
        }
      }

      // Handle token data messages
      if (message.type === "token_update" || message.type === "market_update") {
        if (message.data && Array.isArray(message.data)) {
          setTokens(message.data);
          setLastUpdate(new Date());
        }
      } 
      // Handle single token updates
      else if (message.type === "token_data") {
        if (message.symbol && message.data) {
          setTokens((prev) => {
            // Find and update the specific token
            const tokenIndex = prev.findIndex(t => t.symbol === message.symbol);
            
            if (tokenIndex >= 0) {
              // Update existing token
              const updated = [...prev];
              updated[tokenIndex] = { ...updated[tokenIndex], ...message.data };
              return updated;
            } else if ('price' in message.data && 'name' in message.data) {
              // Add new token if it has required fields
              return [...prev, { 
                symbol: message.symbol,
                name: message.data.name || message.symbol,
                price: message.data.price || "0",
                marketCap: message.data.marketCap || "0",
                volume24h: message.data.volume24h || "0",
                change24h: message.data.change24h || "0",
                ...message.data
              } as TokenData];
            }
            
            return prev;
          });
          setLastUpdate(new Date());
        }
      } 
      // Handle token metadata updates
      else if (message.type === "token_metadata") {
        if (message.symbol && message.data) {
          setTokens((prev) =>
            prev.map((token) =>
              token.symbol === message.symbol
                ? { ...token, ...message.data }
                : token
            )
          );
          setLastUpdate(new Date());
        }
      }
    } catch (err) {
      console.error("[TokenData] Failed to process message:", err);
    }
  }, []);
  
  // Connect to the WebSocket with the market-data topic
  const ws = useWebSocketTopic<TokenDataMessage>(
    TopicType.MARKET_DATA,
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    {
      autoSubscribe: true,
      requestOnConnect: {
        action: "getAllTokens"
      }
    }
  );
  
  // Subscribe to specific tokens if needed
  useEffect(() => {
    if (ws.isConnected && Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
      // Request specific tokens
      ws.request("subscribe_tokens", {
        symbols: tokensToSubscribe
      });
    }
  }, [ws.isConnected, tokensToSubscribe]);
  
  // Update filtered tokens when tokens or tokensToSubscribe changes
  useEffect(() => {
    if (Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
      // Filter tokens to only include requested ones
      setFilteredTokens(tokens.filter(token => 
        tokensToSubscribe.includes(token.symbol)
      ));
    } else {
      // No filter, show all tokens
      setFilteredTokens(tokens);
    }
  }, [tokens, tokensToSubscribe]);
  
  // Helper to get a specific token
  const getToken = useCallback((symbol: string) => {
    const token = tokens.find(t => t.symbol === symbol);
    
    if (!token && ws.isConnected) {
      // Request the token data if we don't have it
      ws.request("getToken", { symbol });
    }
    
    return token;
  }, [tokens, ws.isConnected]);
  
  // Safer refresh function that checks connection state
  const refreshTokens = useCallback(() => {
    if (ws.isConnected) {
      console.log("[TokenData] Requesting all tokens, WebSocket is connected");
      return ws.request("getAllTokens");
    } else {
      console.warn("[TokenData] Cannot refresh tokens: WebSocket not connected (state:", ws.connectionState, ")");
      return false;
    }
  }, [ws.isConnected, ws.connectionState, ws.request]);
  
  return {
    // Current token data
    tokens: filteredTokens,
    allTokens: tokens,
    
    // Connection state
    isConnected: ws.isConnected,
    connectionState: ws.connectionState,
    error: ws.error,
    lastUpdate,
    
    // Helper methods
    getToken,
    
    // For debugging and manual refresh
    _refresh: refreshTokens
  };
}

export default useTokenData;