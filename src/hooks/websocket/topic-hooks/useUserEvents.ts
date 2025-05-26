// src/hooks/websocket/topic-hooks/useUserEvents.ts

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { useStore } from '../../../store/useStore';

interface AchievementUnlockedEvent {
  action: 'USER_ACHIEVEMENT';
  data: {
    achievementId: string;
    title: string;
    description: string;
    iconUrl?: string;
    xpReward: number;
    type: 'bronze' | 'silver' | 'gold' | 'legendary';
  };
  timestamp: string;
}

interface LevelUpEvent {
  action: 'USER_LEVEL_UP';
  data: {
    oldLevel: number;
    newLevel: number;
    totalXp: number;
    rewards?: {
      type: 'credits' | 'badge' | 'feature_unlock';
      amount?: number;
      description: string;
    }[];
  };
  timestamp: string;
}

interface TokenPurchaseEvent {
  action: 'TOKEN_PURCHASE';
  data: {
    tokenSymbol: string;
    tokenAddress: string;
    amount: string;
    price: string;
    totalValue: string;
    transactionId: string;
  };
  timestamp: string;
}

interface TokenSaleEvent {
  action: 'TOKEN_SALE';
  data: {
    tokenSymbol: string;
    tokenAddress: string;
    amount: string;
    price: string;
    totalValue: string;
    transactionId: string;
    profitLoss?: string;
  };
  timestamp: string;
}

type UserEvent = 
  | AchievementUnlockedEvent 
  | LevelUpEvent 
  | TokenPurchaseEvent 
  | TokenSaleEvent;

interface UserEventsStatus {
  connected: boolean;
  recentEvents: UserEvent[];
  unreadAchievements: AchievementUnlockedEvent[];
  recentLevelUps: LevelUpEvent[];
  recentTrades: (TokenPurchaseEvent | TokenSaleEvent)[];
  onAchievementUnlocked?: (achievement: AchievementUnlockedEvent['data']) => void;
  onLevelUp?: (levelUp: LevelUpEvent['data']) => void;
  onTradeConfirmed?: (trade: TokenPurchaseEvent['data'] | TokenSaleEvent['data'], type: 'purchase' | 'sale') => void;
  markAchievementAsRead: (achievementId: string) => void;
}

/**
 * Hook for subscribing to user-specific events
 * Handles achievements, level ups, and trade confirmations
 */
export const useUserEvents = (callbacks?: {
  onAchievementUnlocked?: (achievement: AchievementUnlockedEvent['data']) => void;
  onLevelUp?: (levelUp: LevelUpEvent['data']) => void;
  onTradeConfirmed?: (trade: TokenPurchaseEvent['data'] | TokenSaleEvent['data'], type: 'purchase' | 'sale') => void;
}): UserEventsStatus => {
  const { registerListener, isConnected } = useWebSocket();
  const user = useStore(state => state.user);
  
  const [recentEvents, setRecentEvents] = useState<UserEvent[]>([]);
  const [unreadAchievements, setUnreadAchievements] = useState<AchievementUnlockedEvent[]>([]);
  const [recentLevelUps, setRecentLevelUps] = useState<LevelUpEvent[]>([]);
  const [recentTrades, setRecentTrades] = useState<(TokenPurchaseEvent | TokenSaleEvent)[]>([]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: any) => {
    // User events come on user-specific topics: user:${userId}
    if (message.topic?.startsWith('user:') && user?.wallet_address) {
      const expectedTopic = `user:${user.wallet_address}`;
      
      if (message.topic === expectedTopic) {
        const event: UserEvent = message;
        
        // Add to recent events (keep last 100)
        setRecentEvents(prev => [event, ...prev.slice(0, 99)]);
        
        console.log(`[UserEvents] ${event.action} for user ${user.wallet_address}:`, event.data);
        
        switch (event.action) {
          case 'USER_ACHIEVEMENT':
            setUnreadAchievements(prev => [event, ...prev.slice(0, 9)]); // Keep last 10
            callbacks?.onAchievementUnlocked?.(event.data);
            break;
            
          case 'USER_LEVEL_UP':
            setRecentLevelUps(prev => [event, ...prev.slice(0, 4)]); // Keep last 5
            callbacks?.onLevelUp?.(event.data);
            break;
            
          case 'TOKEN_PURCHASE':
            setRecentTrades(prev => [event, ...prev.slice(0, 19)]); // Keep last 20
            callbacks?.onTradeConfirmed?.(event.data, 'purchase');
            break;
            
          case 'TOKEN_SALE':
            setRecentTrades(prev => [event, ...prev.slice(0, 19)]); // Keep last 20  
            callbacks?.onTradeConfirmed?.(event.data, 'sale');
            break;
        }
      }
    }
  }, [callbacks, user?.wallet_address]);

  // Mark achievement as read
  const markAchievementAsRead = useCallback((achievementId: string) => {
    setUnreadAchievements(prev => 
      prev.filter(achievement => achievement.data.achievementId !== achievementId)
    );
  }, []);

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!registerListener || !isConnected || !user?.wallet_address) return;

    const userTopic = `user:${user.wallet_address}`;
    
    const unregister = registerListener(
      'user-events',
      ['DATA'] as any[], // Message types
      handleMessage,
      [userTopic] // User-specific topic
    );

    console.log(`[UserEvents] Subscribed to ${userTopic}`);

    return unregister;
  }, [registerListener, isConnected, handleMessage, user?.wallet_address]);

  return {
    connected: isConnected,
    recentEvents,
    unreadAchievements,
    recentLevelUps,
    recentTrades,
    onAchievementUnlocked: callbacks?.onAchievementUnlocked,
    onLevelUp: callbacks?.onLevelUp,
    onTradeConfirmed: callbacks?.onTradeConfirmed,
    markAchievementAsRead
  };
};

export default useUserEvents;