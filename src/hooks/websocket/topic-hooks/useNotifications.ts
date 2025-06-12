// src/hooks/websocket/topic-hooks/useNotifications.ts

/**
 * useNotifications Hook
 * 
 * V69 Standardized WebSocket Hook for Notifications
 * This hook provides a standardized interface for notifications using the unified WebSocket system
 * 
 * MAY need to be updated to the latest tenets of v69 unified, but it's a start.
 * 
 * @author @BranchManager69
 * @version 1.8.0
 * @created 2025-04-02
 * @updated 2025-04-02
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDWebSocketActions } from '../../../websocket-types-implementation';
import { DDWebSocketTopic } from '../index';
import { DDExtendedMessageType, SOCKET_TYPES } from '../types';

// Define the Notification interface for consumers of this hook
interface Notification {
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

// Standard interface for notification data messages
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

/**
 * Hook for accessing and managing user notifications
 * Uses the unified WebSocket system for real-time updates
 */
export function useNotifications() {
  // State management
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Try to get WebSocket context - if not available, just return safe defaults
  let ws: any = null;
  let contextAvailable = false;

  try {
    ws = useWebSocket();
    contextAvailable = true;
    console.log('[useNotifications] WebSocket context available');
  } catch (error) {
    // Context not available yet - this is normal during app startup
    console.log('[useNotifications] WebSocket context not available yet');
    contextAvailable = false;
  }

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: any) => {
    try {
      // Extract the notification-specific data from the message
      if (!message.data) return;

      const notificationData = message.data as NotificationData;
      const dataType = notificationData.type;

      switch (dataType) {
        case "NOTIFICATIONS_LIST":
          if (notificationData.notifications) {
            setNotifications(notificationData.notifications);
            if (isLoading) setIsLoading(false);
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
      console.error('[Notifications] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Error processing notification data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading]);

  // Effect for WebSocket listener registration
  useEffect(() => {
    if (!contextAvailable || !ws?.registerListener) {
      return;
    }

    const unregister = ws.registerListener(
      'notifications-hook',
      [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
      handleMessage,
      [DDWebSocketTopic.USER, DDWebSocketTopic.SYSTEM]
    );
    return unregister;
  }, [contextAvailable, ws, handleMessage]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscribe once when ready (prevent duplicate subscriptions)
  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    // Don't do anything if WebSocket context isn't available
    if (!contextAvailable || !ws) {
      console.log('[useNotifications] WebSocket context not available, deferring setup.');
      hasSubscribedRef.current = false;
      return;
    }

    if (ws.isReadyForSecureInteraction && !hasSubscribedRef.current) {
      console.log('[useNotifications] WebSocket ready for secure interaction. Subscribing and requesting notifications.');
      ws.subscribe([DDWebSocketTopic.USER]);
      ws.request(DDWebSocketTopic.USER, DDWebSocketActions.GET_NOTIFICATIONS, {});
      hasSubscribedRef.current = true;

      dispatchWebSocketEvent('notification_subscribe', {
        socketType: SOCKET_TYPES.NOTIFICATION,
        message: 'Subscribing to notifications via unified WebSocket',
        timestamp: new Date().toISOString()
      });

      // Set timeout to clear loading state if no data received
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[Notifications] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 15000);
    } else if (!ws.isReadyForSecureInteraction) {
      // Reset subscription flag when not ready
      hasSubscribedRef.current = false;
      console.log('[useNotifications] WebSocket not ready for secure interaction, deferring setup.');
    }

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (hasSubscribedRef.current && contextAvailable && ws) {
        ws.unsubscribe([DDWebSocketTopic.USER]);
        hasSubscribedRef.current = false;
      }
    };
  }, [contextAvailable, ws?.isReadyForSecureInteraction]); // Simplified dependencies

  // Helper methods for managing notifications
  const markAsRead = useCallback((notificationId: string) => {
    if (!contextAvailable || !ws?.isReadyForSecureInteraction) {
      console.warn('[Notifications] Cannot mark notification as read: WebSocket not ready.');
      return;
    }

    ws.request(DDWebSocketTopic.USER, DDWebSocketActions.MARK_AS_READ, { notificationId });

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
  }, [contextAvailable, ws]);

  const markAllAsRead = useCallback(() => {
    if (!contextAvailable || !ws?.isReadyForSecureInteraction) {
      console.warn('[Notifications] Cannot mark all notifications as read: WebSocket not ready.');
      return;
    }

    ws.request(DDWebSocketTopic.USER, DDWebSocketActions.MARK_ALL_AS_READ, {});

    // Optimistic update
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    dispatchWebSocketEvent('notification_mark_all_read', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      message: 'Marking all notifications as read',
      timestamp: new Date().toISOString()
    });
  }, [contextAvailable, ws]);

  const refreshNotifications = useCallback(() => {
    if (!contextAvailable || !ws?.isReadyForSecureInteraction) {
      console.warn('[Notifications] Cannot refresh: WebSocket not ready.');
      setIsLoading(false); // Ensure loading is false if we can't proceed
      return;
    }
    setIsLoading(true);
    ws.request(DDWebSocketTopic.USER, DDWebSocketActions.GET_NOTIFICATIONS, {});
    dispatchWebSocketEvent('notification_refresh', {
      socketType: SOCKET_TYPES.NOTIFICATION,
      message: 'Refreshing notification data',
      timestamp: new Date().toISOString()
    });

    const refreshTimeoutId = setTimeout(() => {
      // Only clear loading if still waiting and connection is stable
      if (isLoading && contextAvailable && ws?.isReadyForSecureInteraction) {
        console.warn('[Notifications] Refresh timed out waiting for data');
        setIsLoading(false);
      }
    }, 15000);
    return () => clearTimeout(refreshTimeoutId);
  }, [contextAvailable, ws, isLoading]);

  return {
    notifications,
    unreadCount,
    isConnected: contextAvailable ? (ws?.isConnected || false) : false,
    isReadyForSecureInteraction: contextAvailable ? (ws?.isReadyForSecureInteraction || false) : false,
    isLoading: contextAvailable ? isLoading : false, // Don't show loading if context isn't available
    error: contextAvailable ? (ws?.connectionError || null) : 'WebSocket context not available',
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    connect: () => contextAvailable && ws?.isReadyForSecureInteraction && ws.subscribe([DDWebSocketTopic.USER, DDWebSocketTopic.SYSTEM]),
    close: () => contextAvailable && ws?.isReadyForSecureInteraction && ws.unsubscribe([DDWebSocketTopic.USER, DDWebSocketTopic.SYSTEM])
  };
}