import { useCallback, useEffect, useRef } from 'react';
import { useWebSocketTopic } from '../useWebSocketTopic';
import { MessageType } from '../index';

interface PortfolioUpdateEvent {
  type: 'PORTFOLIO_VALUE_CHANGED' | 'POSITION_UPDATED' | 'PNL_CHANGED';
  timestamp: string;
  userId: string;
  portfolioId?: string;
  data: {
    totalValue?: number;
    totalPnl?: number;
    totalPnlPercentage?: number;
    position?: {
      tokenAddress: string;
      tokenSymbol: string;
      quantity: number;
      averagePrice: number;
      currentPrice: number;
      value: number;
      pnl: number;
      pnlPercentage: number;
    };
    previousValue?: number;
    change?: number;
    changePercentage?: number;
  };
}

interface UsePortfolioUpdatesProps {
  userId?: string;
  portfolioId?: string;
  onPortfolioValueChanged?: (data: PortfolioUpdateEvent['data']) => void;
  onPositionUpdated?: (data: PortfolioUpdateEvent['data']) => void;
  onPnlChanged?: (data: PortfolioUpdateEvent['data']) => void;
  enabled?: boolean;
}

export const usePortfolioUpdates = ({
  userId,
  portfolioId,
  onPortfolioValueChanged,
  onPositionUpdated,
  onPnlChanged,
  enabled = true
}: UsePortfolioUpdatesProps = {}) => {
  const callbacksRef = useRef({
    onPortfolioValueChanged,
    onPositionUpdated,
    onPnlChanged
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onPortfolioValueChanged,
      onPositionUpdated,
      onPnlChanged
    };
  }, [onPortfolioValueChanged, onPositionUpdated, onPnlChanged]);

  const handleMessage = useCallback((data: PortfolioUpdateEvent) => {
    // Filter by userId if specified
    if (userId && data.userId !== userId) {
      return;
    }

    // Filter by portfolioId if specified
    if (portfolioId && data.portfolioId !== portfolioId) {
      return;
    }

    const callbacks = callbacksRef.current;

    switch (data.type) {
      case 'PORTFOLIO_VALUE_CHANGED':
        callbacks.onPortfolioValueChanged?.(data.data);
        break;
      case 'POSITION_UPDATED':
        callbacks.onPositionUpdated?.(data.data);
        break;
      case 'PNL_CHANGED':
        callbacks.onPnlChanged?.(data.data);
        break;
    }
  }, [userId, portfolioId]);

  const {
    isConnected,
    subscribe,
    unsubscribe,
    request
  } = useWebSocketTopic(
    'portfolio',
    [MessageType.DATA],
    handleMessage,
    { autoSubscribe: enabled }
  );

  // Subscribe to portfolio updates for specific user
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const subscriptionData: any = {};
    
    if (userId) {
      subscriptionData.userId = userId;
    }
    
    if (portfolioId) {
      subscriptionData.portfolioId = portfolioId;
    }

    request('SUBSCRIBE_PORTFOLIO_UPDATES', subscriptionData);

    return () => {
      request('UNSUBSCRIBE_PORTFOLIO_UPDATES', subscriptionData);
    };
  }, [enabled, isConnected, userId, portfolioId, request]);

  return {
    isConnected,
    subscribe: () => subscribe(),
    unsubscribe: () => unsubscribe(),
    request: (action: string, data: any = {}) => request(action, data)
  };
};