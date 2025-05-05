// src/hooks/useTokenData.ts

/**
 * Token Data Hook
 * 
 * This hook uses the unified WebSocket system to get token data.
 * It subscribes to the market-data topic and processes token updates.
 * Uses address-based token identification as the primary key.
 * 
 * ⚠️ HOOK MIGRATION NOTICE ⚠️
 * This is the ORIGINAL token data hook. For new code, consider using one of the following:
 * - For WebSocket connections: use hooks/websocket/topic-hooks/useTokenData.ts (v69 architecture)
 * - For UI components: use hooks/useStandardizedTokenData.ts (provides standardized data processing)
 * 
 * The migration path is:
 * useTokenData.ts (original) → topic-hooks/useTokenData.ts (v69) → useStandardizedTokenData.ts (UI standardization)
 */

import { useCallback, useEffect, useState } from "react";
import { MessageType, TopicType } from "../../websocket";
import { useWebSocketTopic } from "../../websocket/useWebSocketTopic";

// Config
import { config } from "../../../config/config";
const NODE_ENV = config.ENV.NODE_ENV;
const VERBOSE_USETOKENDATA_LOGGING = 'true'; // (quick fix) Logging verbosity

export interface TokenData {
  contractAddress: string; // Primary identifier
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
  images?: {
    imageUrl: string;
    headerImage: string;
    openGraphImage: string;
  };
  socials?: {
    twitter?: { url: string; count: number | null };
    telegram?: { url: string; count: number | null };
    discord?: { url: string; count: number | null };
  };
  websites?: Array<{
    url: string;
    label: string;
  }> | string[];
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
  address?: string; // Use address instead of symbol
  contractAddress?: string; // Alternative field name
  symbol?: string; // Keep for backwards compatibility
  data: Partial<TokenData>;
}

interface TokenMetadataMessage extends BaseMessage {
  type: "token_metadata";
  address?: string; // Use address instead of symbol
  contractAddress?: string; // Alternative field name
  symbol?: string; // Keep for backwards compatibility
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
 * @param tokensToSubscribe Array of token addresses or "all" to subscribe to all tokens
 * @returns Object containing token data, connection status, and error state
 */
export function useTokenData(
  tokensToSubscribe: string[] | "all" = "all",
) {
  // Display deprecation warning
  useEffect(() => {
    console.warn(
      "⚠️ DEPRECATED: useTokenData is deprecated and will be removed in a future version.\n" +
      "- For WebSocket connections: use hooks/websocket/topic-hooks/useTokenData.ts\n" +
      "- For UI components: use hooks/data/useStandardizedTokenData.ts"
    );
  }, []);

  // Using a map with addresses as keys for more efficient lookups
  const [tokenMap, setTokenMap] = useState<Record<string, TokenData>>({});
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
          // Create a new map from the token data array
          const newTokenMap: Record<string, TokenData> = {};
          message.data.forEach(token => {
            if (token.contractAddress) {
              newTokenMap[token.contractAddress] = token;
            }
          });
          setTokenMap(newTokenMap);
          setLastUpdate(new Date());
        }
      } 
      // Handle single token updates
      else if (message.type === "token_data") {
        // Get address from any available field
        const address = message.address || message.contractAddress || 
                        (message.data.contractAddress as string) || 
                        (message.symbol ? null : null); // Symbol fallback handled below
        
        if (address && message.data) {
          // Direct update with address
          setTokenMap(prev => {
            const updated = { ...prev };
            if (updated[address]) {
              // Update existing token
              updated[address] = { ...updated[address], ...message.data };
            } else if ('price' in message.data && 'name' in message.data) {
              // Add new token if it has required fields
              updated[address] = { 
                contractAddress: address,
                symbol: message.data.symbol || "",
                name: message.data.name || "",
                price: message.data.price || "0",
                marketCap: message.data.marketCap || "0",
                volume24h: message.data.volume24h || "0",
                change24h: message.data.change24h || "0",
                ...message.data
              } as TokenData;
            }
            return updated;
          });
          setLastUpdate(new Date());
        } 
        // Fallback to symbol lookup if no address but we have a symbol
        else if (message.symbol && message.data) {
          setTokenMap(prev => {
            const updated = { ...prev };
            // Find token by symbol
            const foundToken = Object.values(prev).find(t => 
              t.symbol.toLowerCase() === message.symbol?.toLowerCase()
            );
            
            if (foundToken) {
              // Update existing token
              updated[foundToken.contractAddress] = { 
                ...foundToken, 
                ...message.data 
              };
            } else if ('price' in message.data && 'name' in message.data && message.data.contractAddress) {
              // Add new token if we have an address in the data
              const newAddress = message.data.contractAddress as string;
              updated[newAddress] = {
                contractAddress: newAddress,
                symbol: message.symbol || "",
                name: message.data.name || "",
                price: message.data.price || "0",
                marketCap: message.data.marketCap || "0",
                volume24h: message.data.volume24h || "0",
                change24h: message.data.change24h || "0",
                ...message.data
              } as TokenData;
            }
            return updated;
          });
          setLastUpdate(new Date());
        }
      } 
      // Handle token metadata updates
      else if (message.type === "token_metadata") {
        // Get address from any available field
        const address = message.address || message.contractAddress || 
                     (message.data.contractAddress as string) || 
                     (message.symbol ? null : null); // Symbol fallback handled below
                     
        if (address && message.data) {
          // Direct update with address
          setTokenMap(prev => {
            const updated = { ...prev };
            if (updated[address]) {
              updated[address] = { ...updated[address], ...message.data };
            }
            return updated;
          });
          setLastUpdate(new Date());
        }
        // Fallback to symbol lookup if no address but we have a symbol
        else if (message.symbol && message.data) {
          setTokenMap(prev => {
            const updated = { ...prev };
            // Find token by symbol
            const foundToken = Object.values(prev).find(t => 
              t.symbol.toLowerCase() === message.symbol?.toLowerCase()
            );
            
            if (foundToken) {
              // Update existing token
              updated[foundToken.contractAddress] = { 
                ...foundToken, 
                ...message.data 
              };
            }
            return updated;
          });
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
      // Request specific tokens - use addresses if they look like addresses, otherwise assume symbols
      const addresses: string[] = [];
      const symbols: string[] = [];
      
      tokensToSubscribe.forEach(token => {
        if (token.length > 30 || token.startsWith('0x')) {
          addresses.push(token);
        } else {
          symbols.push(token);
        }
      });
      
      if (addresses.length > 0) {
        ws.request("subscribe_tokens", {
          addresses: addresses
        });
      }
      
      if (symbols.length > 0) {
        ws.request("subscribe_tokens", {
          symbols: symbols
        });
      }
    }
  }, [ws.isConnected, tokensToSubscribe]);
  
  // Update filtered tokens when tokens or tokensToSubscribe changes
  useEffect(() => {
    if (Array.isArray(tokensToSubscribe) && tokensToSubscribe.length > 0) {
      // Filter tokens based on either address or symbol
      const filteredTokenValues = Object.values(tokenMap).filter(token => {
        return tokensToSubscribe.some(id => 
          id === token.contractAddress || 
          id.toLowerCase() === token.symbol.toLowerCase()
        );
      });
      setFilteredTokens(filteredTokenValues);
    } else {
      // No filter, show all tokens
      setFilteredTokens(Object.values(tokenMap));
    }
  }, [tokenMap, tokensToSubscribe]);
  
  // Get a token by address (primary) or symbol (fallback)
  const getToken = useCallback((addressOrSymbol: string) => {
    // Try direct address lookup first (most reliable)
    if (tokenMap[addressOrSymbol]) {
      return tokenMap[addressOrSymbol];
    }
    
    // Try case-insensitive address lookup
    const addressMatch = Object.keys(tokenMap).find(
      addr => addr.toLowerCase() === addressOrSymbol.toLowerCase()
    );
    if (addressMatch) {
      return tokenMap[addressMatch];
    }
    
    // Fall back to symbol lookup for backward compatibility
    const symbolMatch = Object.values(tokenMap).find(
      token => token.symbol.toLowerCase() === addressOrSymbol.toLowerCase()
    );
    if (symbolMatch) {
      return symbolMatch;
    }
    
    if (ws.isConnected) {
      // Request the token data if we don't have it
      // Use address if it looks like one, otherwise use symbol
      if (addressOrSymbol.length > 30 || addressOrSymbol.startsWith('0x')) {
        ws.request("getToken", { address: addressOrSymbol });
      } else {
        ws.request("getToken", { symbol: addressOrSymbol });
      }
    }
    
    return null;
  }, [tokenMap, ws.isConnected]);
  
  // Helper for backward compatibility - explicitly get by symbol
  const getTokenBySymbol = useCallback((symbol: string) => {
    if (!symbol) return null;
    
    return Object.values(tokenMap).find(
      token => token.symbol.toLowerCase() === symbol.toLowerCase()
    ) || null;
  }, [tokenMap]);
  
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
    allTokens: Object.values(tokenMap),
    tokenMap, // Expose the direct map for efficient lookups
    
    // Connection state
    isConnected: ws.isConnected,
    connectionState: ws.connectionState,
    error: ws.error,
    lastUpdate,
    
    // Helper methods
    getToken, // Unified getter with address or symbol
    getTokenBySymbol, // Explicit symbol lookup for compatibility
    
    // For debugging and manual refresh
    _refresh: refreshTokens
  };
}

export default useTokenData;