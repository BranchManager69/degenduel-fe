import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../contexts/UnifiedWebSocketContext';

interface UnifiedWebSocketStatusProps {
  topic?: string;
  showLastUpdate?: boolean;
  showReconnectInfo?: boolean;
  compact?: boolean;
}

/**
 * Enhanced WebSocket status component for the unified WebSocket system
 * 
 * Shows detailed connection status information including server down detection,
 * reconnection attempts, and last connection time.
 */
export const UnifiedWebSocketStatus: React.FC<UnifiedWebSocketStatusProps> = ({
  topic = 'system',
  showLastUpdate = true,
  showReconnectInfo = true,
  compact = false
}) => {
  // Get WebSocket status from the unified context
  const {
    isConnected,
    connectionState,
    connectionError,
    isServerDown,
    isReconnecting,
    reconnectAttempt,
    lastConnectionTime
  } = useWebSocket();
  
  const [isBlinking, setIsBlinking] = useState(false);
  const [dataStalled, setDataStalled] = useState(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const stalledTimerRef = useRef<number | null>(null);
  
  // Blink effect when data is received (can be triggered by parent component)
  useEffect(() => {
    if (isConnected && !isBlinking) {
      // Trigger blink animation
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);
  
  // Set up stalled data detection (15 seconds without updates when connected)
  useEffect(() => {
    // Clear any existing timer
    if (stalledTimerRef.current) {
      window.clearInterval(stalledTimerRef.current);
      stalledTimerRef.current = null;
    }
    
    // Only monitor for stalls when connected
    if (isConnected) {
      stalledTimerRef.current = window.setInterval(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
        
        // If it's been more than 15 seconds since the last update
        // and we're not detecting a server down condition
        if (timeSinceLastUpdate > 15000 && !isServerDown) {
          setDataStalled(true);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (stalledTimerRef.current) {
        window.clearInterval(stalledTimerRef.current);
      }
    };
  }, [isConnected, isServerDown]);
  
  // Format time ago
  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };
  
  // Determine status text and color
  const getStatusInfo = () => {
    if (isServerDown) {
      return { 
        text: 'SERVER DOWN', 
        color: 'text-red-500',
        dotColor: 'bg-red-600'
      };
    }
    
    if (!isConnected) {
      return { 
        text: 'OFFLINE', 
        color: 'text-red-400',
        dotColor: 'bg-red-500'
      };
    }
    
    if (isReconnecting) {
      return { 
        text: `RECONNECTING (${reconnectAttempt})`, 
        color: 'text-amber-400',
        dotColor: 'bg-amber-500 animate-pulse'
      };
    }
    
    if (dataStalled) {
      return { 
        text: 'STALLED', 
        color: 'text-yellow-400',
        dotColor: 'bg-yellow-500'
      };
    }
    
    if (connectionError) {
      return { 
        text: 'ERROR', 
        color: 'text-red-400',
        dotColor: 'bg-red-500'
      };
    }
    
    return { 
      text: 'CONNECTED', 
      color: 'text-green-400',
      dotColor: isBlinking ? 'bg-green-400 animate-pulse' : 'bg-green-500'
    };
  };
  
  // Get connection state details for tooltip
  const getConnectionDetails = () => {
    if (connectionError) {
      return connectionError;
    }
    
    return `WebSocket state: ${connectionState}`;
  };
  
  const status = getStatusInfo();
  
  // Render compact version with just icon + tooltip
  if (compact) {
    return (
      <div className="relative inline-block group">
        <div className={`h-3 w-3 rounded-full ${status.dotColor}`}></div>
        
        {/* Tooltip for detailed connection info */}
        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-dark-300 border border-dark-400 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-help z-50">
          <div className="text-gray-200 font-medium mb-1">WebSocket Status: <span className={status.color}>{status.text}</span></div>
          <div className="text-gray-400 break-words">{getConnectionDetails()}</div>
          {showReconnectInfo && isReconnecting && (
            <div className="mt-1 text-amber-400">
              Reconnection attempt: {reconnectAttempt}
            </div>
          )}
          {showLastUpdate && lastConnectionTime && (
            <div className="mt-1 text-gray-400">
              Last connected: {formatTimeAgo(lastConnectionTime)}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Render full version
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-200/50 backdrop-blur-sm border border-dark-400 text-xs font-mono group relative">
      {/* Connection Status Indicator */}
      <div className="flex items-center">
        <span 
          className={`inline-block h-2 w-2 rounded-full mr-1.5 ${status.dotColor}`}
        />
        <span className={status.color}>
          {status.text}
        </span>
      </div>

      {/* Divider and additional info (only when connected) */}
      {isConnected && !isServerDown && (
        <>
          <span className="text-gray-500">|</span>
          <div>
            <span className="text-gray-300">
              Topic: <span className="text-cyber-400">{topic}</span>
            </span>
          </div>
          
          {/* Show last connection time */}
          {showLastUpdate && lastConnectionTime && (
            <>
              <span className="text-gray-500">|</span>
              <div>
                <span className="text-gray-400">{formatTimeAgo(lastConnectionTime)}</span>
              </div>
            </>
          )}
          
          {/* Show reconnect info */}
          {showReconnectInfo && reconnectAttempt !== undefined && reconnectAttempt > 0 && (
            <>
              <span className="text-gray-500">|</span>
              <div>
                <span className="text-amber-400">Attempt {reconnectAttempt}</span>
              </div>
            </>
          )}
        </>
      )}
      
      {/* Special display for server down scenario */}
      {isServerDown && (
        <>
          <span className="text-gray-500">|</span>
          <div>
            <span className="text-red-400">Retrying {reconnectAttempt !== undefined && reconnectAttempt > 0 ? `(${reconnectAttempt})` : ''}</span>
          </div>
        </>
      )}
      
      {/* Tooltip for detailed connection info */}
      <div className="absolute bottom-full left-0 mb-2 w-72 p-2 bg-dark-300 border border-dark-400 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-help z-50">
        <div className="text-gray-200 font-medium mb-1">WebSocket Status:</div>
        <div className="text-gray-400 break-words">{getConnectionDetails()}</div>
        
        <div className="mt-2 grid grid-cols-2 gap-1">
          <div className="text-gray-400">Connection State:</div>
          <div className={`${status.color} font-medium`}>{connectionState}</div>
          
          <div className="text-gray-400">Server Status:</div>
          <div className={isServerDown ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
            {isServerDown ? 'DOWN' : 'UP'}
          </div>
          
          {reconnectAttempt !== undefined && reconnectAttempt > 0 && (
            <>
              <div className="text-gray-400">Reconnect Attempts:</div>
              <div className="text-amber-400 font-medium">{reconnectAttempt}</div>
            </>
          )}
          
          {lastConnectionTime && (
            <>
              <div className="text-gray-400">Last Connected:</div>
              <div className="text-gray-300">
                {new Date(lastConnectionTime).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedWebSocketStatus;