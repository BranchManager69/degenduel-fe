import { useState, useEffect, useCallback } from 'react';
import { useBaseWebSocket, WebSocketConfig } from './useBaseWebSocket';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface NotificationActions {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

export function useNotificationWebSocket(): NotificationState & NotificationActions {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user } = useAuth();

  // Handle WebSocket messages
  const handleMessage = useCallback((message: any) => {
    setLastMessage(message);
  }, []);

  // Initialize WebSocket connection
  const config: WebSocketConfig = {
    url: import.meta.env.VITE_WS_URL || '',
    endpoint: '/api/v69/ws/notifications',
    socketType: 'notifications',
    onMessage: handleMessage
  };
  
  const { wsRef, status } = useBaseWebSocket(config);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Update connection status when WebSocket status changes
  useEffect(() => {
    setIsConnected(status === 'online');
  }, [status]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        switch (lastMessage.type) {
          case 'NOTIFICATIONS_LIST':
            setNotifications(lastMessage.notifications);
            setIsLoading(false);
            break;
          
          case 'NEW_NOTIFICATION':
            setNotifications(prev => [lastMessage.notification, ...prev]);
            break;
          
          case 'NOTIFICATION_READ':
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === lastMessage.notificationId 
                  ? { ...notification, isRead: true } 
                  : notification
              )
            );
            break;
          
          case 'ALL_NOTIFICATIONS_READ':
            setNotifications(prev => 
              prev.map(notification => ({ ...notification, isRead: true }))
            );
            break;
          
          case 'ERROR':
            setError(new Error(lastMessage.message));
            break;
            
          default:
            console.warn('Unknown notification message type:', lastMessage.type);
        }
      } catch (err) {
        console.error('Error processing notification message:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [lastMessage]);

  // Request initial notifications when connected
  useEffect(() => {
    if (isConnected && user) {
      refreshNotifications();
    }
  }, [isConnected, user]);

  // Send message helper function
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }, [wsRef]);

  // Actions
  const markAsRead = useCallback((notificationId: string) => {
    sendMessage({
      action: 'MARK_READ',
      notificationId
    });
  }, [sendMessage]);

  const markAllAsRead = useCallback(() => {
    sendMessage({
      action: 'MARK_ALL_READ'
    });
  }, [sendMessage]);

  const refreshNotifications = useCallback(() => {
    setIsLoading(true);
    sendMessage({
      action: 'GET_NOTIFICATIONS'
    });
  }, [sendMessage]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}