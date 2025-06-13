/**
 * useNotifications Hook
 * 
 * Copied EXACTLY from working useContests pattern
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { TopicType } from '../index';
import { DDExtendedMessageType } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

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

const DEFAULT_STATE = {
  notifications: [] as Notification[],
  unreadCount: 0
};

export function useNotifications() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleMessage = useCallback((message: any) => {
    try {
      if ((message.type === 'DATA' && message.topic === 'user') ||
          (message.topic === 'user' && message.action === 'GET_NOTIFICATIONS')) {

        if (message.action === 'GET_NOTIFICATIONS' && Array.isArray(message.data)) {
          const notifications = message.data;

          setState({
            notifications,
            unreadCount: notifications.filter((n: Notification) => !n.isRead).length
          });

          setIsLoading(false);
          setLastUpdate(new Date());

          dispatchWebSocketEvent('notification_list_received', {
            socketType: TopicType.USER,
            message: `Received ${notifications.length} notifications`,
            timestamp: new Date().toISOString()
          });
        }
      }

      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Notification WebSocket] Error processing message:', err);
    }
  }, [isLoading]);

  const ws = useUnifiedWebSocket(
    'notification-data-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.USER, TopicType.SYSTEM]
  );

  const hasSubscribedNotificationRef = useRef(false);

  useEffect(() => {
    if (ws.isConnected && !hasSubscribedNotificationRef.current) {
      ws.subscribe([TopicType.USER]);
      hasSubscribedNotificationRef.current = true;

      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');

      dispatchWebSocketEvent('notification_subscribe', {
        socketType: TopicType.USER,
        message: 'Subscribing to notification data',
        timestamp: new Date().toISOString()
      });
    } else if (!ws.isConnected) {
      hasSubscribedNotificationRef.current = false;
    }

    return () => {
      if (hasSubscribedNotificationRef.current) {
        ws.unsubscribe([TopicType.USER]);
        hasSubscribedNotificationRef.current = false;
      }
    };
  }, [ws.isConnected]);

  const markAsRead = useCallback((notificationId: string) => {
    if (!ws.isConnected) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    const requestSent = ws.request(TopicType.USER, 'MARK_AS_READ', { notificationId });
    
    if (requestSent) {
      setState(prevState => ({
        ...prevState,
        notifications: prevState.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      }));
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Failed to send request'));
    }
  }, [ws.isConnected, ws.request]);

  const markAllAsRead = useCallback(() => {
    if (!ws.isConnected) {
      return Promise.reject(new Error('WebSocket not connected'));
    }

    const requestSent = ws.request(TopicType.USER, 'MARK_ALL_AS_READ', {});
    
    if (requestSent) {
      setState(prevState => ({
        ...prevState,
        notifications: prevState.notifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      }));
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Failed to send request'));
    }
  }, [ws.isConnected, ws.request]);

  const refreshNotifications = useCallback(() => {
    setIsLoading(true);

    if (ws.isConnected) {
      ws.request(TopicType.USER, 'GET_NOTIFICATIONS');
    } else {
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading,
    isConnected: ws.isConnected,
    isAuthenticated: ws.isAuthenticated,
    error: ws.error,
    lastUpdate,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
}