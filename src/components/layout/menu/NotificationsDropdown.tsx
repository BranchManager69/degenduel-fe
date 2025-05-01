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
import { FaBell, FaCheckDouble, FaRegBell, FaSpinner } from 'react-icons/fa';
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
    markAllAsRead
  } = useNotifications();

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Get max 5 most recent notifications for preview
  const recentNotifications = notifications?.slice(0, 5) || [];
  
  // Color mapping for notification priorities
  const priorityColors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-blue-500 text-white',
    normal: 'bg-brand-500 text-white',
  };

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

            {/* Notifications Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-80 max-h-[70vh] overflow-hidden
                bg-dark-200/95 border border-brand-500/30 rounded-lg shadow-lg z-50 origin-top-right backdrop-blur-xl`}
            >
              {/* Header */}
              <div className="flex items-center justify-between py-2 px-4 border-b border-brand-500/20 bg-dark-300/40">
                <h3 className="text-sm font-medium text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1"
                      aria-label="Mark all as read"
                    >
                      <FaCheckDouble className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[50vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="w-6 h-6 text-brand-400 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-400 text-sm">
                    Failed to load notifications. Try again later.
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <div className="flex justify-center mb-2">
                      <FaRegBell className="w-8 h-8 text-gray-500/50" />
                    </div>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <ul className="py-1">
                    {recentNotifications.map((notification) => (
                      <li key={notification.id} className="relative">
                        <Link
                          to={notification.link || '#'}
                          onClick={() => handleNotificationClick(notification.id, notification.link)}
                          className={`block px-4 py-3 hover:bg-brand-500/10 transition-all duration-200
                            ${!notification.isRead ? 'bg-brand-500/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Priority Dot */}
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                              priorityColors[notification.priority as keyof typeof priorityColors] || priorityColors.normal
                            }`} />
                            
                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <p className={`text-sm ${!notification.isRead ? 'font-medium text-white' : 'text-gray-300'}`}>
                                {notification.title}
                              </p>
                              
                              {/* Message Preview */}
                              {notification.content && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
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
                              <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-brand-500/20 bg-dark-300/40">
                <Link
                  to="/notifications"
                  onClick={closeDropdown}
                  className="block w-full text-center py-2 text-sm text-brand-300 hover:text-brand-200 
                    hover:bg-brand-500/10 rounded-md transition-all duration-200"
                >
                  View All Notifications
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};