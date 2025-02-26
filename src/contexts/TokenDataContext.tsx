import React, { createContext, useContext, useMemo } from "react";
import {
  TokenData,
  useTokenDataWebSocket,
} from "../hooks/useTokenDataWebSocket";

interface TokenDataContextType {
  tokens: TokenData[];
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

const TokenDataContext = createContext<TokenDataContextType | undefined>(
  undefined
);

export const TokenDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const tokenData = useTokenDataWebSocket("all");

  const value = useMemo(() => tokenData, [tokenData]);

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
