/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use hooks/websocket/topic-hooks/usePortfolio.ts instead.
 * 
 * Portfolio WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the portfolio WebSocket service and provides real-time
 * portfolio updates, trade executions, and price updates.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from '../types';
import useWebSocket from './useWebSocket';

interface PortfolioUpdate {
  type: "PORTFOLIO_UPDATED";
  data: {
    tokens: Array<{
      symbol: string;
      name: string;
      amount: number;
      value: number;
    }>;
    total_value: number;
    performance_24h: number;
  };
  timestamp: string;
}

interface TradeExecution {
  type: "TRADE_EXECUTED";
  data: {
    trade_id: string;
    wallet_address: string;
    symbol: string;
    amount: number;
    price: number;
    timestamp: string;
    contest_id?: string;
  };
}

interface PriceUpdate {
  type: "PRICE_UPDATED";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    timestamp: string;
  };
}

type PortfolioMessage = PortfolioUpdate | TradeExecution | PriceUpdate;

export function usePortfolioWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { updatePortfolio, updateTokenPrice, addTradeNotification } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    connect,
    close
  } = useWebSocket<PortfolioMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.PORTFOLIO,
    requiresAuth: false, // Allow more flexible connection handling
    heartbeatInterval: 30000,
    autoConnect: true // Ensure we try to connect automatically
  });

  // Track loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('portfolio_status', {
      socketType: SOCKET_TYPES.PORTFOLIO,
      status,
      message: `Portfolio WebSocket is ${status}`
    });
    
    // Reset loading state when connected
    if (status === 'online') {
      setIsLoading(false);
    }
    
    // If we're not connected but should be loading, trigger connection with timeout
    if (status !== 'online' && isLoading) {
      // Attempt connection
      connect();
      
      // Set a timeout to prevent endless loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Portfolio connection timed out, resetting loading state');
          setIsLoading(false);
        }
      }, 10000);
      
      // Clean up the timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [status, isLoading, connect]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "PORTFOLIO_UPDATED":
          updatePortfolio(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('portfolio_update', {
            socketType: SOCKET_TYPES.PORTFOLIO,
            message: 'Portfolio updated',
            timestamp: new Date().toISOString()
          });
          break;
          
        case "TRADE_EXECUTED":
          addTradeNotification(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('trade_executed', {
            socketType: SOCKET_TYPES.PORTFOLIO,
            message: `Trade executed for ${data.data.symbol}`,
            tradeId: data.data.trade_id,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "PRICE_UPDATED":
          updateTokenPrice(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('price_update', {
            socketType: SOCKET_TYPES.PORTFOLIO,
            message: `Price updated for ${data.data.symbol}`,
            symbol: data.data.symbol,
            price: data.data.price,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing portfolio message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.PORTFOLIO,
        message: 'Error processing portfolio data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, updatePortfolio, updateTokenPrice, addTradeNotification]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Portfolio WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.PORTFOLIO,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  // Helper method to refresh portfolio data
  const refreshPortfolio = () => {
    // If not connected, try to establish connection first
    if (status !== 'online') {
      console.warn('WebSocket not connected, attempting to connect before refreshing portfolio');
      setIsLoading(true);
      
      // Try to connect
      connect();
      
      // Set a timeout to prevent infinite loading state
      setTimeout(() => {
        if (isLoading) {
          console.warn('Portfolio connection timed out during refresh');
          setIsLoading(false);
        }
      }, 10000);
      
      return;
    }
    
    // Mark that we're refreshed
    setLastUpdate(new Date());
  };

  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    isLoading,
    refreshPortfolio,
    connect,
    close
  };
}