/**
 * usePortfolio Hook
 * 
 * V69 Standardized WebSocket Hook for Portfolio Data
 * This hook provides real-time updates for user portfolios from the unified WebSocket system
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

// Portfolio data interfaces based on backend API documentation
export interface PortfolioHolding {
  token_address: string;
  symbol: string;
  amount: number;
  value_usd: number;
  profit_loss: number;
  profit_loss_percentage: number;
  last_updated: string;
}

export interface Portfolio {
  total_value: number;
  total_profit_loss: number;
  profit_loss_percentage: number;
  holdings: PortfolioHolding[];
}

// Default portfolio for initial state
const DEFAULT_PORTFOLIO: Portfolio = {
  total_value: 0,
  total_profit_loss: 0,
  profit_loss_percentage: 0,
  holdings: []
};

// Define the standard structure for portfolio data updates from the server
// Following the exact format from the backend team
interface WebSocketPortfolioMessage {
  type: string; // 'DATA'
  topic: string; // 'portfolio'
  data: Portfolio;
  timestamp: string;
}

/**
 * Hook for accessing and managing portfolio data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param contestId Optional contest ID to filter portfolio data
 */
export function usePortfolio(contestId?: string) {
  // State for portfolio data
  const [portfolio, setPortfolio] = useState<Portfolio>(DEFAULT_PORTFOLIO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketPortfolioMessage>) => {
    try {
      // Check if this is a valid portfolio message
      if (message.type === 'DATA' && message.topic === 'portfolio' && message.data) {
        // Update portfolio data
        setPortfolio(message.data);
        setIsLoading(false);
        setLastUpdate(new Date());
        
        dispatchWebSocketEvent('portfolio_update', {
          socketType: TopicType.PORTFOLIO,
          message: 'Updated portfolio data',
          timestamp: new Date().toISOString(),
          holdings: message.data.holdings.length
        });
      }
      
      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Portfolio WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.PORTFOLIO,
        message: 'Error processing portfolio data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'portfolio-hook',
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.PORTFOLIO, TopicType.SYSTEM]
  );

  // Subscribe to portfolio data when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to portfolio data topic
      ws.subscribe([TopicType.PORTFOLIO]);
      
      // Request initial portfolio data
      if (contestId) {
        ws.request(TopicType.PORTFOLIO, 'GET_PORTFOLIO', { contestId });
      } else {
        ws.request(TopicType.PORTFOLIO, 'GET_PORTFOLIO');
      }
      
      dispatchWebSocketEvent('portfolio_subscribe', {
        socketType: TopicType.PORTFOLIO,
        message: 'Subscribing to portfolio data',
        timestamp: new Date().toISOString(),
        contestId: contestId || 'none'
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[Portfolio WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request, contestId]);

  // Update portfolio tokens
  const updatePortfolio = useCallback((tokens: { symbol: string, amount: number }[]) => {
    if (!ws.isConnected) {
      console.warn('[Portfolio WebSocket] Cannot update portfolio - WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    return new Promise<void>((resolve, reject) => {
      const params: Record<string, unknown> = { tokens };
      
      if (contestId) {
        params.contestId = contestId;
      }
      
      // The request method returns a boolean indicating if the message was sent
      const requestSent = ws.request(TopicType.PORTFOLIO, 'UPDATE_PORTFOLIO', params);
      
      if (requestSent) {
        // Success path - request was sent
        dispatchWebSocketEvent('portfolio_update_request', {
          socketType: TopicType.PORTFOLIO,
          message: 'Requested portfolio update',
          timestamp: new Date().toISOString(),
          tokenCount: tokens.length
        });
        
        // Resolve immediately when request is sent successfully
        resolve();
      } else {
        // Error path - request failed to send
        const errorMessage = 'Failed to send portfolio update request';
        dispatchWebSocketEvent('error', {
          socketType: TopicType.PORTFOLIO,
          message: 'Error updating portfolio',
          error: errorMessage
        });
        reject(new Error(errorMessage));
      }
    });
  }, [ws.isConnected, ws.request, contestId]);

  // Force refresh function
  const refreshPortfolio = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh portfolio data
      if (contestId) {
        ws.request(TopicType.PORTFOLIO, 'GET_PORTFOLIO', { contestId });
      } else {
        ws.request(TopicType.PORTFOLIO, 'GET_PORTFOLIO');
      }
      
      dispatchWebSocketEvent('portfolio_refresh', {
        socketType: TopicType.PORTFOLIO,
        message: 'Refreshing portfolio data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[Portfolio WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, contestId, isLoading]);

  // Return the portfolio data and helper functions
  return {
    portfolio,
    holdings: portfolio.holdings,
    totalValue: portfolio.total_value,
    totalProfitLoss: portfolio.total_profit_loss,
    profitLossPercentage: portfolio.profit_loss_percentage,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshPortfolio,
    updatePortfolio
  };
}