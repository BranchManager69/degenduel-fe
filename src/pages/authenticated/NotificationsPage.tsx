import React, { useCallback } from 'react';
import { useNotificationWebSocket } from '../../hooks/useNotificationWebSocket';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaRegBell } from 'react-icons/fa';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications,
    isConnected
  } = useNotificationWebSocket();

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-brand-300';
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return <FaExclamationTriangle className="text-red-400" />;
      case 'high':
        return <FaExclamationTriangle className="text-orange-400" />;
      case 'medium':
        return <FaInfoCircle className="text-yellow-400" />;
      default:
        return <FaInfoCircle className="text-brand-300" />;
    }
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-brand-500/20 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <FaBell className="text-brand-400 text-xl" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-red-500/80 text-white">
              {unreadCount}
            </span>
          )}
          {isLoading && (
            <div className="w-4 h-4 border-2 border-brand-500/70 border-t-transparent rounded-full animate-spin ml-2"></div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshNotifications} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="relative overflow-hidden"
          >
            {isLoading ? (
              <span className="flex items-center">
                <span className="animate-pulse">Loading...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Refresh
              </span>
            )}
          </Button>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm" 
              className="text-brand-300 hover:text-white"
              disabled={isLoading}
            >
              <span className="flex items-center gap-1">
                <FaCheckCircle className="h-3 w-3" />
                Mark All Read
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status Indicator */}
      {!isConnected && !error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-yellow-400">Attempting to connect to notification service...</span>
          </div>
        </div>
      )}

      {isLoading && notifications.length === 0 && (
        <div className="flex flex-col justify-center items-center h-40 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-bold mb-1">Error loading notifications</h3>
              <p className="text-red-300">{error.message}</p>
              <div className="mt-3">
                <Button 
                  onClick={refreshNotifications}
                  size="sm"
                  variant="outline"
                  className="text-red-400 hover:text-white border-red-500/20 hover:border-red-400"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FaRegBell className="text-5xl mb-4 opacity-30" />
          <p className="text-lg">No notifications yet</p>
          <p className="text-sm mt-2">When you receive notifications, they'll appear here</p>
          <Button 
            onClick={refreshNotifications} 
            variant="ghost" 
            size="sm" 
            className="mt-6 text-brand-400 hover:text-brand-300"
          >
            Check for new notifications
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`relative border rounded-lg p-4 transition-all duration-300 group ${
              notification.isRead 
                ? 'border-dark-300/50 bg-dark-200/30 hover:border-dark-300/80' 
                : 'border-brand-500/30 bg-brand-900/20 hover:border-brand-500/50'
            }`}
          >
            {/* Priority indicator */}
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b from-transparent via-brand-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {getPriorityIcon(notification.priority)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`font-bold ${
                    notification.isRead ? 'text-gray-200' : 'text-white'
                  }`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <p className={`mt-1 text-sm ${
                  notification.isRead ? 'text-gray-400' : 'text-gray-300'
                }`}>
                  {notification.content}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">{notification.type}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notification.link && (
                      <Link 
                        to={notification.link} 
                        className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105 group-hover:underline"
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </Link>
                    )}
                    
                    {!notification.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-brand-300 text-sm transition-all duration-200 rounded-full px-2 py-1 hover:bg-brand-500/10"
                        aria-label="Mark as read"
                      >
                        <FaCheckCircle className="text-xs" />
                        <span className="transition-opacity duration-200">Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;