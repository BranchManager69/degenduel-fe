import React, { createContext, useContext, useMemo } from "react";

// Import the standardized v69 WebSocket hook instead of the original
import {
  TokenData,
  useTokenDataWebSocket,
} from "../hooks/websocket/useTokenDataWebSocket";

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

export const TokenDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the standardized v69 WebSocket hook
  const tokenData = useTokenDataWebSocket("all");
  
  const value = useMemo(() => {
    const mergedValue = {
      ...tokenData,
    };
    // Only add these properties if they don't already exist in tokenData
    if (!('tokens' in tokenData)) mergedValue.tokens = [];
    if (!('error' in tokenData)) mergedValue.error = null;
    if (!('lastUpdate' in tokenData)) mergedValue.lastUpdate = null;
    if (!('refresh' in tokenData)) mergedValue.refresh = () => {};
    
    return mergedValue;
  }, [tokenData]);

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
