/**
 * Achievement WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the notification WebSocket service and filters for
 * achievement-related events like unlocking achievements, user progress, and level ups.
 * Note: This actually connects to the notification endpoint as per v69 documentation
 * since achievements are delivered through the notification system.
 */

import { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS } from './types';
import useWebSocket from './useWebSocket';
import { useStore } from '../../store/useStore';

interface AchievementMessage {
  type: "achievement:unlock" | "user:progress" | "user:levelup";
  data: any;
}

export function useAchievementWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { updateUserProgress, addAchievement, addCelebration } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<AchievementMessage>({
    endpoint: WEBSOCKET_ENDPOINTS.NOTIFICATION,
    socketType: SOCKET_TYPES.NOTIFICATION,
    requiresAuth: true, // Achievement notifications require authentication
    heartbeatInterval: 30000
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('achievement_status', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      status,
      message: `Achievement WebSocket is ${status}`
    });
    
    // Subscribe to achievement notifications when connected
    if (status === 'online') {
      subscribeToAchievements();
    }
  }, [status]);

  // Subscribe to achievement notifications
  const subscribeToAchievements = () => {
    if (status !== 'online') {
      console.warn('Cannot subscribe to achievements: WebSocket not connected');
      return;
    }
    
    send({
      type: 'subscribe',
      channels: ['achievements']
    });
    
    dispatchWebSocketEvent('achievement_subscribe', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      message: 'Subscribing to achievement notifications',
      timestamp: new Date().toISOString()
    });
  };

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "achievement:unlock":
          addAchievement(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('achievement_unlock', {
            socketType: SOCKET_TYPES.NOTIFICATION,
            message: 'Achievement unlocked',
            achievement: data.data?.name || 'unknown',
            timestamp: new Date().toISOString()
          });
          break;
          
        case "user:progress":
          updateUserProgress(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('user_progress', {
            socketType: SOCKET_TYPES.NOTIFICATION,
            message: 'User progress updated',
            timestamp: new Date().toISOString()
          });
          break;
          
        case "user:levelup":
          addCelebration({
            type: "level_up",
            data: data.data,
            timestamp: new Date().toISOString(),
          });
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('user_levelup', {
            socketType: SOCKET_TYPES.NOTIFICATION,
            message: 'User leveled up',
            level: data.data?.level || 'unknown',
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing achievement message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Error processing achievement data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data, updateUserProgress, addAchievement, addCelebration]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Achievement WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
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