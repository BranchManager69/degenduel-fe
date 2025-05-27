import { useCallback, useEffect, useRef } from 'react';
import { useWebSocketTopic } from '../useWebSocketTopic';
import { MessageType } from '../index';

interface TradeEvent {
  type: 'TRADE_EXECUTED' | 'TRADE_FAILED' | 'ORDER_FILLED';
  timestamp: string;
  userId: string;
  tradeId: string;
  data: {
    // Trade execution data
    tokenAddress: string;
    tokenSymbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalValue: number;
    fees?: number;
    slippage?: number;
    
    // Order data
    orderId?: string;
    orderType?: 'market' | 'limit' | 'stop';
    
    // Success/failure data
    success: boolean;
    error?: string;
    errorCode?: string;
    
    // Transaction data
    signature?: string;
    blockNumber?: number;
    gasUsed?: number;
    
    // Portfolio impact
    newBalance?: number;
    newPosition?: {
      quantity: number;
      averagePrice: number;
      value: number;
    };
    
    // Contest context
    contestId?: string;
    portfolioId?: string;
  };
}

interface UseTradeEventsProps {
  userId?: string;
  contestId?: string;
  portfolioId?: string;
  onTradeExecuted?: (data: TradeEvent['data']) => void;
  onTradeFailed?: (data: TradeEvent['data']) => void;
  onOrderFilled?: (data: TradeEvent['data']) => void;
  enabled?: boolean;
}

export const useTradeEvents = ({
  userId,
  contestId,
  portfolioId,
  onTradeExecuted,
  onTradeFailed,
  onOrderFilled,
  enabled = true
}: UseTradeEventsProps = {}) => {
  const callbacksRef = useRef({
    onTradeExecuted,
    onTradeFailed,
    onOrderFilled
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onTradeExecuted,
      onTradeFailed,
      onOrderFilled
    };
  }, [onTradeExecuted, onTradeFailed, onOrderFilled]);

  const handleMessage = useCallback((data: TradeEvent) => {
    // Filter by userId if specified
    if (userId && data.userId !== userId) {
      return;
    }

    // Filter by contestId if specified
    if (contestId && data.data.contestId !== contestId) {
      return;
    }

    // Filter by portfolioId if specified
    if (portfolioId && data.data.portfolioId !== portfolioId) {
      return;
    }

    const callbacks = callbacksRef.current;

    switch (data.type) {
      case 'TRADE_EXECUTED':
        if (data.data.success) {
          callbacks.onTradeExecuted?.(data.data);
        } else {
          callbacks.onTradeFailed?.(data.data);
        }
        break;
      case 'TRADE_FAILED':
        callbacks.onTradeFailed?.(data.data);
        break;
      case 'ORDER_FILLED':
        callbacks.onOrderFilled?.(data.data);
        break;
    }
  }, [userId, contestId, portfolioId]);

  const {
    isConnected,
    subscribe,
    unsubscribe,
    request
  } = useWebSocketTopic(
    'portfolio', // Trade events come through portfolio topic
    [MessageType.DATA],
    handleMessage,
    { autoSubscribe: enabled }
  );

  // Subscribe to trade events
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const subscriptionData: any = {};
    
    if (userId) {
      subscriptionData.userId = userId;
    }
    
    if (contestId) {
      subscriptionData.contestId = contestId;
    }
    
    if (portfolioId) {
      subscriptionData.portfolioId = portfolioId;
    }

    request('SUBSCRIBE_TRADE_EVENTS', subscriptionData);

    return () => {
      request('UNSUBSCRIBE_TRADE_EVENTS', subscriptionData);
    };
  }, [enabled, isConnected, userId, contestId, portfolioId, request]);

  return {
    isConnected,
    subscribe: () => subscribe(),
    unsubscribe: () => unsubscribe(),
    request: (action: string, data: any = {}) => request(action, data)
  };
};