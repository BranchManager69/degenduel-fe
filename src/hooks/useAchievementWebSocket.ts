import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface Achievement {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'TRANSCENDENT';
  xp_awarded: number;
  achieved_at: string;
  context: any;
  name?: string;
  description?: string;
}

export interface UserProgress {
  level: number;
  experiencePoints: number;
  nextLevelThreshold: number;
  tierProgress: {
    achievements: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
      diamond: number;
    };
  };
}

export interface AchievementCelebration {
  type: 'achievement' | 'level_up';
  data: any;
  timestamp: string;
}

export function useAchievementWebSocket() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [pendingCelebrations, setPendingCelebrations] = useState<AchievementCelebration[]>([]);
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Initialize WebSocket connection using the new hook
  const {
    isConnected,
    sendMessage,
    disconnect
  } = useWebSocket('achievements', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    switch(data.type) {
      case 'user_progress':
        setUserProgress(data.data);
        break;
        
      case 'unlocked_achievements':
        setUnlockedAchievements(data.achievements || []);
        break;
        
      case 'achievement_unlocked':
        // Add the new achievement to the list
        setUnlockedAchievements(prev => [data.achievement, ...prev]);
        
        // Add a celebration for this achievement
        setPendingCelebrations(prev => [{
          type: 'achievement',
          data: data.achievement,
          timestamp: data.timestamp
        }, ...prev]);
        break;
        
      case 'level_up':
        // Update the user progress
        setUserProgress(prev => prev ? {
          ...prev,
          level: data.level,
          experiencePoints: data.experiencePoints,
          nextLevelThreshold: data.nextLevelThreshold
        } : null);
        
        // Add a celebration for the level up
        setPendingCelebrations(prev => [{
          type: 'level_up',
          data: {
            level: data.level,
            previousLevel: data.previousLevel
          },
          timestamp: data.timestamp
        }, ...prev]);
        break;
    }
  }

  // Request user progress and achievements when connected
  useEffect(() => {
    if (isConnected && user) {
      sendMessage({
        type: 'get_user_progress'
      });
      
      sendMessage({
        type: 'get_unlocked_achievements'
      });
    }
  }, [isConnected, user, sendMessage]);

  // Function to clear a celebration by timestamp
  const clearCelebration = useCallback((timestamp: string) => {
    setPendingCelebrations(prev => 
      prev.filter(celebration => celebration.timestamp !== timestamp)
    );
  }, []);

  // Function to manually refresh achievements
  const refreshAchievements = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'get_unlocked_achievements'
      });
      return true;
    }
    return false;
  }, [isConnected, sendMessage]);

  return {
    userProgress,
    unlockedAchievements,
    pendingCelebrations,
    isConnected,
    clearCelebration,
    refreshAchievements,
    close: disconnect
  };
}

export default useAchievementWebSocket;