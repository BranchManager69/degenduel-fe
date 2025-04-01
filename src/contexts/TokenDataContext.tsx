import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

// Import types from types folder and hooks from websocket folder 
import { TokenData } from "../types";
import { useUnifiedWebSocket } from "../hooks/websocket/useUnifiedWebSocket";
import { MessageType } from "../hooks/websocket/types";
import { authDebug } from "../config/config";

interface TokenDataContextType {
  tokens: TokenData[];
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void; // Add refresh function to the context
}

const TokenDataContext = createContext<TokenDataContextType | undefined>(
  undefined,
);

// Default fallback tokens for when connection is unavailable
const FALLBACK_TOKENS: TokenData[] = [
  {
    symbol: "SOL",
    name: "Solana",
    price: "420.69",
    marketCap: "420420069",
    volume24h: "420420069",
    change24h: "42069.69",
    status: "active",
  },
];

export const TokenDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State for token data
  const [tokens, setTokens] = useState<TokenData[]>(FALLBACK_TOKENS);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [error, setError] = useState<string | null>(null);
  
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
          setTokens(message.data);
          setLastUpdate(new Date());
          authDebug('TokenData', `Updated ${message.data.length} tokens`);
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
      
      // Subscribe to market data
      subscribe(['market-data']);
      
      // Request initial token data
      request('market-data', 'getAllTokens');
    }
  }, [isConnected, subscribe, request]);
  
  // Refresh function
  const refresh = () => {
    if (isConnected) {
      authDebug('TokenData', 'Manually refreshing token data');
      request('market-data', 'getAllTokens');
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
