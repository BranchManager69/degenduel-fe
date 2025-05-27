import { useCallback, useEffect, useRef } from 'react';
import { useWebSocketTopic } from '../useWebSocketTopic';
import { MessageType } from '../index';

interface PriceAlertEvent {
  type: 'PRICE_THRESHOLD_HIT' | 'TOKEN_PUMP_ALERT' | 'VOLUME_SPIKE_ALERT';
  timestamp: string;
  tokenAddress: string;
  tokenSymbol: string;
  data: {
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    priceChangePercentage: number;
    
    // Threshold alert data
    threshold?: {
      type: 'above' | 'below';
      value: number;
      userId?: string; // User-specific alert
    };
    
    // Pump alert data
    pumpData?: {
      timeframe: '5m' | '15m' | '1h' | '4h' | '24h';
      volumeIncrease: number;
      volumeIncreasePercentage: number;
      marketCap?: number;
      liquidityChange?: number;
    };
    
    // Volume spike data
    volumeData?: {
      currentVolume: number;
      averageVolume: number;
      volumeSpike: number; // multiplier (e.g., 5x = 5)
      timeframe: '5m' | '15m' | '1h' | '4h' | '24h';
      unusualActivity: boolean;
    };
    
    // Market context
    marketCap?: number;
    liquidity?: number;
    holders?: number;
    age?: number; // token age in hours
    
    // Alert metadata
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'price' | 'volume' | 'liquidity' | 'social';
  };
}

interface UsePriceAlertsProps {
  userId?: string;
  tokenAddresses?: string[]; // Subscribe to specific tokens
  severityFilter?: ('low' | 'medium' | 'high' | 'critical')[];
  categoryFilter?: ('price' | 'volume' | 'liquidity' | 'social')[];
  onPriceThresholdHit?: (data: PriceAlertEvent['data']) => void;
  onTokenPumpAlert?: (data: PriceAlertEvent['data']) => void;
  onVolumeSpikeAlert?: (data: PriceAlertEvent['data']) => void;
  enabled?: boolean;
}

export const usePriceAlerts = ({
  userId,
  tokenAddresses,
  severityFilter,
  categoryFilter,
  onPriceThresholdHit,
  onTokenPumpAlert,
  onVolumeSpikeAlert,
  enabled = true
}: UsePriceAlertsProps = {}) => {
  const callbacksRef = useRef({
    onPriceThresholdHit,
    onTokenPumpAlert,
    onVolumeSpikeAlert
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onPriceThresholdHit,
      onTokenPumpAlert,
      onVolumeSpikeAlert
    };
  }, [onPriceThresholdHit, onTokenPumpAlert, onVolumeSpikeAlert]);

  const handleMessage = useCallback((data: PriceAlertEvent) => {
    // Filter by token addresses if specified
    if (tokenAddresses && tokenAddresses.length > 0 && !tokenAddresses.includes(data.tokenAddress)) {
      return;
    }

    // Filter by severity if specified
    if (severityFilter && severityFilter.length > 0 && !severityFilter.includes(data.data.severity)) {
      return;
    }

    // Filter by category if specified
    if (categoryFilter && categoryFilter.length > 0 && !categoryFilter.includes(data.data.category)) {
      return;
    }

    // Filter user-specific threshold alerts
    if (data.type === 'PRICE_THRESHOLD_HIT' && data.data.threshold?.userId && userId && data.data.threshold.userId !== userId) {
      return;
    }

    const callbacks = callbacksRef.current;

    switch (data.type) {
      case 'PRICE_THRESHOLD_HIT':
        callbacks.onPriceThresholdHit?.(data.data);
        break;
      case 'TOKEN_PUMP_ALERT':
        callbacks.onTokenPumpAlert?.(data.data);
        break;
      case 'VOLUME_SPIKE_ALERT':
        callbacks.onVolumeSpikeAlert?.(data.data);
        break;
    }
  }, [tokenAddresses, severityFilter, categoryFilter, userId]);

  const {
    isConnected,
    subscribe,
    unsubscribe,
    request
  } = useWebSocketTopic(
    'market-data',
    [MessageType.DATA],
    handleMessage,
    { autoSubscribe: enabled }
  );

  // Subscribe to price alerts
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const subscriptionData: any = {};
    
    if (userId) {
      subscriptionData.userId = userId;
    }
    
    if (tokenAddresses && tokenAddresses.length > 0) {
      subscriptionData.tokenAddresses = tokenAddresses;
    }
    
    if (severityFilter && severityFilter.length > 0) {
      subscriptionData.severityFilter = severityFilter;
    }
    
    if (categoryFilter && categoryFilter.length > 0) {
      subscriptionData.categoryFilter = categoryFilter;
    }

    request('SUBSCRIBE_PRICE_ALERTS', subscriptionData);

    return () => {
      request('UNSUBSCRIBE_PRICE_ALERTS', subscriptionData);
    };
  }, [enabled, isConnected, userId, tokenAddresses, severityFilter, categoryFilter, request]);

  return {
    isConnected,
    subscribe: () => subscribe(),
    unsubscribe: () => unsubscribe(),
    request: (action: string, data: any = {}) => request(action, data)
  };
};