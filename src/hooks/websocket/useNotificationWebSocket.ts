/**
 * Notification WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the notification WebSocket service and provides real-time
 * user notifications including achievements, system notifications, and alerts.
 */

import { useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINTS, MessageType } f
import useWebSocket from './useWebSocket';

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

interface NotificationMessage {
  type: string; // Using string since server may send application-specific types
  notifications?: Notification[];
  notification?: Notification;
  notificationId?: string;
  error?: string;
  message?: string;
}

export function useNotificationWebSocket() {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<NotificationMessage>({
    endpoint: WEBSOCKET_ENDPOINT,
    socketType: SOCKET_TYPES.NOTIFICATION,
    requiresAuth: true, // Notifications require authentication
    heartbeatInterval: 30000,
    autoConnect: true // Ensure we try to connect automatically
  });

  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('notification_status', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      status,
      message: `Notification WebSocket is ${status}`
    });
    
    // Set isConnected based on status
    const isConnected = status === 'online';
    
    // Request all notifications when connected and loading
    if (isConnected && isLoading) {
      refreshNotifications();
    }
  }, [status, isLoading]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "NOTIFICATIONS_LIST":
          if (data.notifications) {
            setNotifications(data.notifications);
            setIsLoading(false);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('notifications_list', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: `Received ${data.notifications.length} notifications`,
              count: data.notifications.length,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "NEW_NOTIFICATION":
          if (data.notification) {
            setNotifications(prev => [data.notification!, ...prev]);
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('new_notification', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'New notification received',
              notificationType: data.notification.type,
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case "NOTIFICATION_READ":
          if (data.notificationId) {
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === data.notificationId 
                  ? { ...notification, isRead: true } 
                  : notification
              )
            );
            setLastUpdate(new Date());
            
            dispatchWebSocketEvent('notification_read', {
              socketType: SOCKET_TYPES.NOTIFICATION,
              message: 'Notification marked as read',
              notificationId: data.notificationId,
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
          
        case MessageType.ERROR:
          console.error('Notification error:', data.error || data.message);
          dispatchWebSocketEvent('error', {
            socketType: SOCKET_TYPES.NOTIFICATION,
            message: data.error || data.message || 'Unknown notification error',
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing notification message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Error processing notification data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [data]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Notification WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: error.message,
        error
      });
    }
  }, [error]);
  
  // Helper methods for managing notifications
  const markAsRead = (notificationId: string) => {
    if (status !== 'online') {
      console.warn('Cannot mark notification as read: WebSocket not connected');
      return;
    }
    
    send({
      action: 'MARK_READ',
      notificationId
    });
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    if (status !== 'online') {
      console.warn('Cannot mark all notifications as read: WebSocket not connected');
      return;
    }
    
    send({
      action: 'MARK_ALL_READ'
    });
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  const refreshNotifications = () => {
    if (status !== 'online') {
      console.warn('Cannot refresh notifications: WebSocket not connected');
      return;
    }
    
    setIsLoading(true);
    
    send({
      action: 'GET_NOTIFICATIONS'
    });
    
    // Set a timeout to prevent infinite loading state
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000);
  };
  
  return {
    notifications,
    unreadCount,
    isConnected: status === 'online',
    isLoading,
    error: error ? error.message : null,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    connect,
    close
  };
}