import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface PortfolioToken {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  price: number;
  change_24h: number;
}

export interface PortfolioData {
  id?: string;
  userId?: string;
  contestId?: string;
  tokens: PortfolioToken[];
  total_value: number;
  performance_24h: number;
  lastUpdated: string;
}

export function usePortfolioWebSocket(contestId?: string) {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    tokens: [],
    total_value: 0,
    performance_24h: 0,
    lastUpdated: new Date().toISOString()
  });
  
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Initialize WebSocket connection using the new hook
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('portfolio', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    // Handle portfolio updates
    if (data.type === 'portfolio_update') {
      setPortfolio({
        ...data.data,
        lastUpdated: data.timestamp
      });
    }
    // Handle token value updates
    else if (data.type === 'token_value_update') {
      // Update a single token in the portfolio
      setPortfolio(prev => {
        const updatedTokens = prev.tokens.map(token => {
          if (token.symbol === data.symbol) {
            return {
              ...token,
              price: data.price,
              value: token.amount * data.price,
              change_24h: data.change_24h
            };
          }
          return token;
        });
        
        // Calculate new total value and performance
        const newTotalValue = updatedTokens.reduce((sum, token) => sum + token.value, 0);
        
        return {
          ...prev,
          tokens: updatedTokens,
          total_value: newTotalValue,
          lastUpdated: data.timestamp
        };
      });
    }
  }

  // Request portfolio data when connected and contest changes
  useEffect(() => {
    if (isConnected && user) {
      sendMessage({
        type: 'get_portfolio',
        contestId
      });
    }
  }, [isConnected, contestId, user, sendMessage]);

  // Function to manually refresh the portfolio
  const refreshPortfolio = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'get_portfolio',
        contestId
      });
      return true;
    }
    return false;
  }, [isConnected, contestId, sendMessage]);

  return {
    portfolio,
    isConnected,
    refreshPortfolio,
    close: disconnect
  };
}

export default usePortfolioWebSocket;