/**
 * Portfolio WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the portfolio WebSocket service and provides real-time
 * portfolio updates, trade executions, and price updates.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
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
    requiresAuth: true, // Portfolio updates require authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('portfolio_status', {
      socketType: SOCKET_TYPES.PORTFOLIO,
      status,
      message: `Portfolio WebSocket is ${status}`
    });
  }, [status]);

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
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    connect,
    close
  };
}