/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * No components are using this hook.
 * 
 * useAchievements Hook
 * 
 * V69 Standardized WebSocket Hook for Achievements
 * This hook provides real-time updates for user achievements
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';
import { TopicType } from '../index';

// Achievement data interfaces based on backend API documentation
export interface Achievement {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  reward?: {
    type: string;
    amount: number;
    description: string;
  };
  criteria?: {
    type: string;
    threshold: number;
    current?: number;
  };
  category?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | string;
  unlocked?: boolean;
  unlocked_at?: string;
  progress?: number; // 0-100
}

// User level data
export interface UserLevel {
  current: number;
  previous: number;
  xp: number;
  xp_required: number;
  rewards: any[];
}

// Achievement state
export interface AchievementState {
  achievements: Achievement[];
  recentlyUnlocked: Achievement[];
  level: UserLevel | null;
  isLoading: boolean;
}

// Default state
const DEFAULT_STATE: AchievementState = {
  achievements: [],
  recentlyUnlocked: [],
  level: null,
  isLoading: true
};

// Define the standard structure for achievement updates from the server
// Following the exact format from the backend team
interface WebSocketAchievementMessage {
  type: string; // 'DATA'
  topic: string; // 'user'
  subtype: 'achievement' | 'level';
  action?: 'update' | 'new' | 'delete';
  data: {
    user_id?: string;
    achievement?: Achievement;
    achievements?: Achievement[];
    level?: UserLevel;
  };
  timestamp: string;
}

/**
 * Hook for accessing and managing user achievements with real-time updates
 * Uses the unified WebSocket system
 * @deprecated This hook is deprecated and will be removed in a future version.
 */
export function useAchievements() {
  const [state, setState] = useState<AchievementState>(DEFAULT_STATE);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketAchievementMessage>) => {
    try {
      // Process only messages for the user topic with achievement or level subtype
      if (message.type === 'DATA' && message.topic === 'user' && message.data) {
        
        // Handle achievement updates
        if (message.subtype === 'achievement') {
          // New achievement unlocked
          if (message.action === 'new' && message.data.achievement) {
            const newAchievement = message.data.achievement;
            
            setState(prev => {
              // Update achievement list
              const updatedAchievements = prev.achievements.map(a => 
                a.id === newAchievement.id ? { ...a, ...newAchievement } : a
              );
              
              // If this achievement wasn't in the list, add it
              if (!updatedAchievements.find(a => a.id === newAchievement.id)) {
                updatedAchievements.push(newAchievement);
              }
              
              // Add to recently unlocked list
              const updatedRecentlyUnlocked = [
                newAchievement,
                ...prev.recentlyUnlocked
              ].slice(0, 5); // Keep only the 5 most recent
              
              return {
                ...prev,
                achievements: updatedAchievements,
                recentlyUnlocked: updatedRecentlyUnlocked,
                isLoading: false
              };
            });
            
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('achievement_unlocked', {
              socketType: TopicType.ACHIEVEMENT,
              message: `New achievement unlocked: ${newAchievement.name}`,
              timestamp: new Date().toISOString(),
              achievementId: newAchievement.id
            });
          }
          
          // Achievement progress update
          else if (message.action === 'update' && message.data.achievement) {
            const updatedAchievement = message.data.achievement;
            
            setState(prev => ({
              ...prev,
              achievements: prev.achievements.map(a => 
                a.id === updatedAchievement.id ? { ...a, ...updatedAchievement } : a
              ),
              isLoading: false
            }));
            
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('achievement_progress', {
              socketType: TopicType.ACHIEVEMENT,
              message: `Achievement progress updated: ${updatedAchievement.name}`,
              timestamp: new Date().toISOString(),
              achievementId: updatedAchievement.id,
              progress: updatedAchievement.progress
            });
          }
          
          // Initial achievements list
          else if (message.data.achievements) {
            const achievements = message.data.achievements;
            
            setState(prev => ({
              ...prev,
              achievements,
              recentlyUnlocked: achievements
                .filter(a => a.unlocked)
                .sort((a, b) => {
                  if (!a.unlocked_at || !b.unlocked_at) return 0;
                  return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
                })
                .slice(0, 5),
              isLoading: false
            }));
            
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('achievements_loaded', {
              socketType: TopicType.ACHIEVEMENT,
              message: `Loaded ${achievements.length} achievements`,
              timestamp: new Date().toISOString(),
              unlockedCount: achievements.filter(a => a.unlocked).length
            });
          }
        }
        
        // Handle level updates
        else if (message.subtype === 'level' && message.data.level) {
          const levelData = message.data.level;
          const isLevelUp = state.level && levelData.current > state.level.current;
          
          setState(prev => ({
            ...prev,
            level: levelData,
            isLoading: false
          }));
          
          setLastUpdate(new Date());
          
          if (isLevelUp) {
            dispatchWebSocketEvent('level_up', {
              socketType: TopicType.ACHIEVEMENT,
              message: `Level up: ${levelData.previous} → ${levelData.current}`,
              timestamp: new Date().toISOString(),
              newLevel: levelData.current
            });
          } else {
            dispatchWebSocketEvent('level_update', {
              socketType: TopicType.ACHIEVEMENT,
              message: `User level data updated`,
              timestamp: new Date().toISOString(),
              level: levelData.current,
              xp: levelData.xp,
              xpRequired: levelData.xp_required
            });
          }
        }
      }
    } catch (err) {
      console.error('[Achievements WebSocket] Error processing message:', err);
      
      dispatchWebSocketEvent('error', {
        socketType: TopicType.ACHIEVEMENT,
        message: 'Error processing achievement data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [state.level]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'achievements-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.USER, TopicType.SYSTEM]
  );

  // Subscribe to user topic when connected
  useEffect(() => {
    if (ws.isConnected && state.isLoading) {
      // Subscribe to user topic (which includes achievements)
      ws.subscribe([TopicType.USER]);
      
      // Request initial achievement data
      ws.request(TopicType.USER, 'GET_ACHIEVEMENTS');
      
      // Request initial level data
      ws.request(TopicType.USER, 'GET_LEVEL');
      
      dispatchWebSocketEvent('achievements_subscribe', {
        socketType: TopicType.ACHIEVEMENT,
        message: 'Subscribing to achievements data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (state.isLoading) {
          console.warn('[Achievements WebSocket] Timed out waiting for data');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, ws.subscribe, ws.request, state.isLoading]);

  // Force refresh achievements data
  const refreshAchievements = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[Achievements WebSocket] Cannot refresh - WebSocket not connected');
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Request fresh achievement data
    ws.request(TopicType.USER, 'GET_ACHIEVEMENTS');
    
    // Request fresh level data
    ws.request(TopicType.USER, 'GET_LEVEL');
    
    dispatchWebSocketEvent('achievements_refresh', {
      socketType: TopicType.ACHIEVEMENT,
      message: 'Refreshing achievements data',
      timestamp: new Date().toISOString()
    });
    
    // Set a timeout to reset loading state if we don't get data
    setTimeout(() => {
      if (state.isLoading) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 10000);
  }, [ws.isConnected, ws.request, state.isLoading]);

  // Return achievements data and helper functions
  return {
    ...state,
    lastUpdate,
    isConnected: ws.isConnected,
    error: ws.error,
    refreshAchievements,
    
    // Helper functions
    getAchievement: useCallback((id: string) => {
      return state.achievements.find(a => a.id === id) || null;
    }, [state.achievements]),
    
    getAchievementsByCategory: useCallback((category: string) => {
      return state.achievements.filter(a => a.category === category);
    }, [state.achievements]),
    
    getUnlockedAchievements: useCallback(() => {
      return state.achievements.filter(a => a.unlocked);
    }, [state.achievements]),
    
    getProgressPercentage: useCallback(() => {
      if (!state.achievements.length) return 0;
      const unlockedCount = state.achievements.filter(a => a.unlocked).length;
      return Math.round((unlockedCount / state.achievements.length) * 100);
    }, [state.achievements])
  };
}