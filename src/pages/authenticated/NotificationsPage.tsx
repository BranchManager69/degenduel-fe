// src/pages/authenticated/NotificationsPage.tsx

/**
 * Notifications Page - Clean, premium design
 * 
 * @author @BranchManager69
 * @version 2.0.0
 * @updated 2025-06-03
 */

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";

// Clean relative time formatting
const formatRelativeTime = (date: string): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isConnected,
  } = useNotifications();

  // Handle mark notification as read
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead],
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile Header - Sticky with glass effect */}
      <header className="sticky top-0 z-10 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-400">
              {unreadCount} new
            </span>
          )}
        </div>
      </header>

      {/* Desktop Container */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Desktop Header */}
        <div className="mb-8 hidden sm:block">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Stay updated with your contests and activity
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                disabled={isLoading}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Connection Status - Subtle warning */}
        {!isConnected && !error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-900/50 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-200">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            <span>Connecting to notification service...</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-gray-400" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-sm text-red-200">
              {typeof error === 'string' ? error : (error as Error).message}
            </p>
            <button
              onClick={refreshNotifications}
              className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-gray-900/50 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-400">No notifications yet</p>
            <p className="mt-1 text-sm text-gray-500">
              We'll notify you when something happens
            </p>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.map((notification: any, index: number) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
                notification.isRead
                  ? "border-gray-800/50 bg-gray-900/30"
                  : "border-gray-800 bg-gray-900/50"
              } hover:border-gray-700/70 hover:bg-gray-900/40`}
            >
              {/* Unread Indicator - Subtle accent line */}
              {!notification.isRead && (
                <div className="absolute left-0 top-0 h-full w-0.5 bg-brand-400" />
              )}

              <div className="p-4 sm:p-5">
                {/* Header with title and time */}
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className={`text-sm font-medium leading-tight ${
                      notification.isRead ? "text-gray-300" : "text-white"
                    }`}
                  >
                    {notification.title}
                  </h3>
                  <time className="flex-shrink-0 text-xs text-gray-500">
                    {formatRelativeTime(notification.createdAt)}
                  </time>
                </div>

                {/* Message content */}
                {notification.content && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">
                    {notification.content}
                  </p>
                )}

                {/* Footer with type and action */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-gray-500">
                    {notification.type.replace(/_/g, ' ')}
                  </span>

                  <div className="flex items-center gap-3">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200"
                        aria-label="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                    
                    {notification.link && (
                      <Link
                        to={notification.link}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors duration-200"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Mark All Read Button */}
        {unreadCount > 0 && (
          <div className="mt-6 sm:hidden">
            <button
              onClick={markAllAsRead}
              className="w-full rounded-lg border border-gray-800 bg-gray-900/50 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
              disabled={isLoading}
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;