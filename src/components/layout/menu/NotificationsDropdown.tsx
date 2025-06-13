/**
 * Notifications Dropdown Component
 * 
 * Provides a dropdown panel for displaying recent notifications without
 * navigating away from the current page. Includes a link to the full
 * notifications page for viewing all notifications.
 */

import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { FaBell, FaRegBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../../hooks/websocket/topic-hooks/useNotifications';

interface NotificationsDropdownProps {
  unreadCount?: number;
  isMobile?: boolean;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  unreadCount = 0,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead,
    isConnected,
    isAuthenticated
  } = useNotifications();

  // Debug logging
  console.log('[NotificationsDropdown] State:', {
    notifications: notifications?.length || 0,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    unreadCount
  });

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Get max 5 most recent notifications for preview
  const recentNotifications = notifications?.slice(0, 5) || [];

  // Format notification time as relative
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  // Handle notification click - mark as read and follow link if provided
  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    
    if (link) {
      // If it's an internal link (starts with /), use router navigation
      if (link.startsWith('/')) {
        // Close dropdown first
        setIsOpen(false);
      } else {
        // External link, open in new tab
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center transition-all duration-200
          hover:bg-dark-300/30 active:bg-dark-300/40 rounded-full p-2 z-50
          ${isMobile ? "w-9 h-9" : "w-8 h-8"}`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon - solid when there are unread notifications */}
        {unreadCount > 0 ? (
          <FaBell className="w-5 h-5 text-brand-300" />
        ) : (
          <FaRegBell className="w-5 h-5 text-gray-300" />
        )}
        
        {/* Notification Count Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white border border-dark-200 shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing when clicked outside */}
            <div 
              className="fixed inset-0 z-40"
              onClick={closeDropdown}
            />

            {/* Notifications Panel - Clean Design */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-80 max-h-[70vh] overflow-hidden
                bg-gray-900/95 border border-gray-800 rounded-lg shadow-xl z-50 origin-top-right backdrop-blur-xl`}
            >
              {/* Header */}
              <div className="flex items-center justify-between py-3 px-4 border-b border-gray-800">
                <h3 className="text-sm font-medium text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[50vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-gray-400" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-400 text-sm">
                    Failed to load notifications
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="mb-3 h-10 w-10 mx-auto rounded-full bg-gray-800 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-gray-600"
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
                    <p className="text-sm text-gray-400">No notifications</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {recentNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={notification.link || '#'}
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                        className={`block px-4 py-3 border-l-2 transition-all duration-200 ${
                          !notification.isRead 
                            ? 'border-l-brand-400 bg-gray-800/50 hover:bg-gray-800/70' 
                            : 'border-l-transparent hover:bg-gray-800/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <p className={`text-sm leading-tight ${
                              !notification.isRead ? 'font-medium text-white' : 'text-gray-300'
                            }`}>
                              {notification.title}
                            </p>
                            
                            {/* Message Preview */}
                            {notification.content && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {notification.content}
                              </p>
                            )}
                            
                            {/* Timestamp */}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-brand-400 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-800 p-2">
                <Link
                  to="/notifications"
                  onClick={closeDropdown}
                  className="block w-full text-center py-2 text-sm text-gray-400 hover:text-white 
                    hover:bg-gray-800/50 rounded transition-all duration-200"
                >
                  View All Notifications →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};