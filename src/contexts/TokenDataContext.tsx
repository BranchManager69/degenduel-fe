/**
 * We should probably remake this from scratch.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Import types from types folder and hooks from websocket folder 
import { authDebug } from "../config/config";
import { MessageType } from "../hooks/websocket";
import { useUnifiedWebSocket } from "../hooks/websocket/useUnifiedWebSocket";
import { Token } from "../types";

interface TokenDataContextType {
  tokens: Token[];
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void; // Add refresh function to the context
}

const TokenDataContext = createContext<TokenDataContextType | undefined>(
  undefined,
);

// No fallback tokens - we want real data only
const FALLBACK_TOKENS: Token[] = [];

export const TokenDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State for token data
  const [tokens, setTokens] = useState<Token[]>(FALLBACK_TOKENS);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);
  
  const processTokensInChunks = (tokenData: Token[]) => {
    let index = 0;
    const chunkSize = 100; // Process 100 tokens at a time

    function processChunk() {
      const chunk = tokenData.slice(index, index + chunkSize);
      if (chunk.length > 0) {
        setTokens(prevTokens => [...prevTokens, ...chunk]);
        index += chunkSize;
        requestAnimationFrame(processChunk);
      } else {
        setLastUpdate(new Date());
        authDebug('TokenData', `Finished processing ${tokenData.length} tokens in chunks.`);
      }
    }
    
    // Start with a clean slate
    setTokens([]);
    requestAnimationFrame(processChunk);
  };
  
  // Use the unified WebSocket hook instead of creating a separate connection
  const {
    isConnected,
    subscribe,
    request
  } = useUnifiedWebSocket('token-data-context', [MessageType.DATA], (message) => {
    authDebug('TokenData', 'Received message from unified WebSocket', { message });
    
    // Process the message based on its type
    try {
      // Process token data messages
      if (message.type === 'DATA' && message.topic === 'market-data') {
        if (message.data && Array.isArray(message.data)) {
          // Bulk token update
          authDebug('TokenData', `Processing ${message.data.length} tokens in chunks.`);
          processTokensInChunks(message.data);
        } else if (message.data && message.data.symbol) {
          // Single token update
          setTokens(prev => 
            prev.map(token => 
              token.symbol === message.data.symbol ? 
              { ...token, ...message.data } : 
              token
            )
          );
          setLastUpdate(new Date());
          authDebug('TokenData', `Updated token ${message.data.symbol}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing token data');
      authDebug('TokenData', 'Error processing message', { error: err });
    }
  }, ['market-data']);
  
  // Subscribe to market data on connection
  useEffect(() => {
    if (isConnected) {
      authDebug('TokenData', 'Connected to unified WebSocket, subscribing to market-data');
      
      // Subscribe to market data for real-time updates
      subscribe(['market-data']);
      
      // DO NOT request initial data here. This should be handled by components
      // that need the data, preferably via a paginated REST API for the initial load.
      // request('market-data', 'getTokens'); // <--- This was the cause of the duplicate load
    }
  }, [isConnected, subscribe]);
  
  // Refresh function
  const refresh = () => {
    if (isConnected) {
      authDebug('TokenData', 'Manually refreshing token data');
      request('market-data', 'getTokens');
    }
  };
  
  // Create the context value
  const value = useMemo(() => ({
    tokens,
    isConnected,
    error,
    lastUpdate,
    refresh
  }), [tokens, isConnected, error, lastUpdate]);

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
};

export const useTokenData = () => {
  const context = useContext(TokenDataContext);
  if (context === undefined) {
    throw new Error("useTokenData must be used within a TokenDataProvider");
  }
  return context;
};
