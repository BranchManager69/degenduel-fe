/**
 * Achievement WebSocket Hook - V69 Unified WebSocket Implementation
 * 
 * This hook connects to the unified WebSocket system for achievement-related events
 * like unlocking achievements, user progress, and level ups.
 * 
 * Achievements are delivered through the notification topic in the unified system.
 */

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { MessageType, TopicType, useUnifiedWebSocket } from '../index';
import { SOCKET_TYPES } from '../types';

// Achievement-related message types
type AchievementMessageType = 
  | "achievement:unlock" 
  | "user:progress" 
  | "user:levelup";

export function useAchievementWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { updateUserProgress, addAchievement, addCelebration } = useStore();

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      // Achievement messages come with specific types that we need to handle
      const messageType = message.data?.type as AchievementMessageType;
      
      if (!messageType) return;
      
      console.log('[AchievementWebSocket] Received message:', messageType);
      
      switch (messageType) {
        case "achievement:unlock":
          const achievementData = message.data?.data;
          if (achievementData) {
            addAchievement(achievementData);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('achievement_unlock', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'Achievement unlocked',
              achievement: achievementData.name || 'unknown',
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "user:progress":
          const progressData = message.data?.data;
          if (progressData) {
            updateUserProgress(progressData);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('user_progress', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'User progress updated',
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "user:levelup":
          const levelUpData = message.data?.data;
          if (levelUpData) {
            addCelebration({
              type: "level_up",
              data: levelUpData,
              timestamp: new Date().toISOString(),
            });
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('user_levelup', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'User leveled up',
              level: levelUpData.level || 'unknown',
              timestamp: new Date().toISOString()
            });
          }
          break;
      }
      
      // Mark as not loading once we've processed any achievement message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[AchievementWebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Error processing achievement data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [addAchievement, updateUserProgress, addCelebration, isLoading, setIsLoading]);

  // Connect to the unified WebSocket system
  const ws = useUnifiedWebSocket(
    'achievement-websocket',
    [MessageType.DATA, MessageType.ERROR], // Message types to subscribe to
    handleMessage,
    [TopicType.SYSTEM, TopicType.USER] // Topics to subscribe to (achievements come through USER topic)
  );

  // Subscribe to the achievements data when the WebSocket is connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to the USER topic which includes achievements
      ws.subscribe([TopicType.USER]);
      
      // Request achievement data specifically
      ws.request(TopicType.USER, 'get_achievements');
      
      dispatchWebSocketEvent('achievement_subscribe', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Subscribing to achievement notifications via unified WebSocket',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[AchievementWebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Helper method to refresh achievements
  const refreshAchievements = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh achievement data
      ws.request(TopicType.USER, 'get_achievements');
      dispatchWebSocketEvent('achievement_refresh', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Refreshing achievement data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get a response
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[AchievementWebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);

  return {
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    isLoading,
    refreshAchievements,
    // For backward compatibility with components that use this hook
    connect: () => ws.subscribe([TopicType.USER]),
    close: () => ws.unsubscribe([TopicType.USER])
  };
}