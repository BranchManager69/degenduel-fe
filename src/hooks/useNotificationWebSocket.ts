import { useState, useEffect, useCallback } from "react";

import { useAuth } from "./useAuth";
import { useBaseWebSocket, WebSocketConfig } from "./useBaseWebSocket";

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

export function useNotificationWebSocket(): NotificationState &
  NotificationActions {
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
    url: import.meta.env.VITE_WS_URL || "",
    endpoint: "/api/v69/ws/notifications",
    socketType: "notifications",
    onMessage: handleMessage,
  };

  const { wsRef, status } = useBaseWebSocket(config);

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(
      (notification) => !notification.isRead,
    ).length;
    setUnreadCount(count);
  }, [notifications]);

  // Update connection status when WebSocket status changes
  useEffect(() => {
    setIsConnected(status === "online");
  }, [status]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        switch (lastMessage.type) {
          case "NOTIFICATIONS_LIST":
            setNotifications(lastMessage.notifications);
            setIsLoading(false);
            break;

          case "NEW_NOTIFICATION":
            setNotifications((prev) => [lastMessage.notification, ...prev]);
            break;

          case "NOTIFICATION_READ":
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === lastMessage.notificationId
                  ? { ...notification, isRead: true }
                  : notification,
              ),
            );
            break;

          case "ALL_NOTIFICATIONS_READ":
            setNotifications((prev) =>
              prev.map((notification) => ({ ...notification, isRead: true })),
            );
            break;

          case "ERROR":
            setError(new Error(lastMessage.message));
            break;

          default:
            console.warn(
              "Unknown notification message type:",
              lastMessage.type,
            );
        }
      } catch (err) {
        console.error("Error processing notification message:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [lastMessage]);

  // Request initial notifications when connected
  useEffect(() => {
    if (isConnected && user) {
      refreshNotifications();
    } else if (!isConnected && !isLoading) {
      // Set an error if we're not loading and not connected
      setError(
        new Error("WebSocket connection failed. Unable to load notifications."),
      );
    }
  }, [isConnected, user, isLoading]);

  // Send message helper function
  const sendMessage = useCallback(
    (message: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            typeof message === "string" ? message : JSON.stringify(message),
          );
          return true;
        } catch (err) {
          console.error("Error sending message to WebSocket:", err);
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to send WebSocket message"),
          );
          return false;
        }
      } else {
        console.warn("WebSocket is not connected, cannot send message");
        setError(
          new Error("Unable to send message: WebSocket is not connected"),
        );
        return false;
      }
    },
    [wsRef],
  );

  // Actions
  const markAsRead = useCallback(
    (notificationId: string) => {
      try {
        const success = sendMessage({
          action: "MARK_READ",
          notificationId,
        });

        // Optimistic update if message was sent successfully
        if (success) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          );
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
        setError(
          error instanceof Error
            ? error
            : new Error("Failed to mark notification as read"),
        );
      }
    },
    [sendMessage],
  );

  const markAllAsRead = useCallback(() => {
    try {
      const success = sendMessage({
        action: "MARK_ALL_READ",
      });

      // Optimistic update if message was sent successfully
      if (success) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true })),
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to mark all notifications as read"),
      );
    }
  }, [sendMessage]);

  const refreshNotifications = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors on refresh
      const success = sendMessage({
        action: "GET_NOTIFICATIONS",
      });

      // If message couldn't be sent, set loading to false
      if (!success) {
        setIsLoading(false);
      }

      // Set a timeout to prevent infinite loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError(
            new Error("Notification refresh timed out. Please try again."),
          );
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      setIsLoading(false);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to refresh notifications"),
      );
    }
  }, [sendMessage, isLoading]);

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
