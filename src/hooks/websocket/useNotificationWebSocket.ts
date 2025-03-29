/**
 * Notification WebSocket Hook - V69 Unified WebSocket Implementation
 * 
 * This hook connects to the unified WebSocket system for real-time user notifications
 * including general notifications, alerts, and system messages.
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { TopicType, useUnifiedWebSocket } from './index';
import { MessageType, SOCKET_TYPES } from './types';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority: "low" | "medium" | "high" | "urgent";
  link?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// Notification message types from the unified WebSocket
type NotificationActionType = 
  | "NOTIFICATIONS_LIST"
  | "NEW_NOTIFICATION"
  | "NOTIFICATION_READ" 
  | "ALL_NOTIFICATIONS_READ";

interface NotificationData {
  type: NotificationActionType;
  notifications?: Notification[];
  notification?: Notification;
  notificationId?: string;
  timestamp?: string;
}

export function useNotificationWebSocket() {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      // Extract the notification-specific data from the message
      if (!message.data) return;
      
      const notificationData = message.data as NotificationData;
      const dataType = notificationData.type;
      
      console.log('[NotificationWebSocket] Received message:', dataType);
      
      switch (dataType) {
        case "NOTIFICATIONS_LIST":
          if (notificationData.notifications) {
            setNotifications(notificationData.notifications);
            setIsLoading(false);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('notifications_list', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: `Received ${notificationData.notifications.length} notifications`,
              count: notificationData.notifications.length,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "NEW_NOTIFICATION":
          if (notificationData.notification) {
            setNotifications(prev => [notificationData.notification!, ...prev]);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('new_notification', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'New notification received',
              notificationType: notificationData.notification.type,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "NOTIFICATION_READ":
          if (notificationData.notificationId) {
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === notificationData.notificationId 
                  ? { ...notification, isRead: true } 
                  : notification
              )
            );
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('notification_read', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'Notification marked as read',
              notificationId: notificationData.notificationId,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "ALL_NOTIFICATIONS_READ":
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
          );
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('all_notifications_read', {
            socketType: SOCKET_TYPES.NOTIFICATION,
            message: 'All notifications marked as read',
            timestamp: new Date().toISOString()
          });
          break;
      }
      
      // Mark as not loading once we've processed any notification message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[NotificationWebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Error processing notification data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Connect to the unified WebSocket system
  const ws = useUnifiedWebSocket(
    'notification-websocket',
    [MessageType.DATA, MessageType.ERROR], // Message types to subscribe to
    handleMessage,
    [TopicType.SYSTEM, TopicType.USER] // Topics to subscribe to (notifications are in USER topic)
  );

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscribe to notification data when the WebSocket is connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to the USER topic which includes notifications
      ws.subscribe([TopicType.USER]);
      
      // Request notifications specifically
      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');
      
      dispatchWebSocketEvent('notification_subscribe', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Subscribing to notifications via unified WebSocket',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[NotificationWebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request]);

  // Helper methods for managing notifications
  const markAsRead = useCallback((notificationId: string) => {
    if (!ws.isConnected) {
      console.warn('[NotificationWebSocket] Cannot mark notification as read: WebSocket not connected');
      return;
    }
    
    ws.request(TopicType.USER, 'MARK_READ', { notificationId });
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    dispatchWebSocketEvent('notification_mark_read', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      message: 'Marking notification as read',
      notificationId,
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, ws.request]);
  
  const markAllAsRead = useCallback(() => {
    if (!ws.isConnected) {
      console.warn('[NotificationWebSocket] Cannot mark all notifications as read: WebSocket not connected');
      return;
    }
    
    ws.request(TopicType.USER, 'MARK_ALL_READ');
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    
    dispatchWebSocketEvent('notification_mark_all_read', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      message: 'Marking all notifications as read',
      timestamp: new Date().toISOString()
    });
  }, [ws.isConnected, ws.request]);
  
  const refreshNotifications = useCallback(() => {
    setIsLoading(true);
    
    if (ws.isConnected) {
      // Request fresh notification data
      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');
      dispatchWebSocketEvent('notification_refresh', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Refreshing notification data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get a response
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.warn('[NotificationWebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, isLoading]);
  
  return {
    notifications,
    unreadCount,
    isConnected: ws.isConnected,
    isLoading,
    error: ws.error,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    // For backward compatibility with components that use this hook
    connect: () => ws.subscribe([TopicType.USER]),
    close: () => ws.unsubscribe([TopicType.USER])
  };
}