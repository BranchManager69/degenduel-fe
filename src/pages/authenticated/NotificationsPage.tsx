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
    refreshNotifications 
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
          <h1 className="text-2xl font-bold text-white">Noti's</h1>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-red-500/80 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshNotifications} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm" 
              className="text-brand-300 hover:text-white"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">Error loading notifications: {error.message}</p>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FaRegBell className="text-5xl mb-4 opacity-30" />
          <p className="text-lg">No notifications yet</p>
          <p className="text-sm mt-2">When you receive notifications, they'll appear here</p>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`relative border rounded-lg p-4 transition-all duration-300 group ${
              notification.isRead 
                ? 'border-dark-300/50 bg-dark-200/30' 
                : 'border-brand-500/30 bg-brand-900/20'
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
                        className="text-brand-400 hover:text-brand-300 text-sm font-medium"
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        View
                      </Link>
                    )}
                    
                    {!notification.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-brand-300 text-sm"
                      >
                        <FaCheckCircle className="text-xs" />
                        <span>Mark read</span>
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