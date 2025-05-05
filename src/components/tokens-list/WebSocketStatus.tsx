import React, { useEffect, useRef, useState } from 'react';
import { useTokenData } from '../../hooks/data/legacy/useTokenData';

export const WebSocketStatus: React.FC = () => {
  const { isConnected, tokens, lastUpdate, error, connectionState } = useTokenData("all");
  const [updateCount, setUpdateCount] = useState(0);
  const [lastSymbol, setLastSymbol] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [dataStalled, setDataStalled] = useState(false);
  
  // Keep track of the last update time to detect stalled data
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const stalledTimerRef = useRef<number | null>(null);
  
  // Track updates when new data comes in
  useEffect(() => {
    if (lastUpdate) {
      setUpdateCount(prev => prev + 1);
      
      // Reset stalled state since we got an update
      setDataStalled(false);
      lastUpdateTimeRef.current = Date.now();
      
      // Get a random token to show (just for visual variety)
      if (tokens.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(tokens.length, 10));
        setLastSymbol(tokens[randomIndex]?.symbol || tokens[0]?.symbol || null);
      }
      
      // Trigger blink animation
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate, tokens]);
  
  // Set up stalled data detection (10 seconds without updates when connected)
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
        
        // If it's been more than 10 seconds since the last update
        if (timeSinceLastUpdate > 10000) {
          setDataStalled(true);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (stalledTimerRef.current) {
        window.clearInterval(stalledTimerRef.current);
      }
    };
  }, [isConnected]);

  // Format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };
  
  // Determine status text and color
  const getStatusInfo = () => {
    if (!isConnected) {
      return { 
        text: 'OFFLINE', 
        color: 'text-red-400',
        dotColor: 'bg-red-500'
      };
    }
    
    if (dataStalled) {
      return { 
        text: 'STALLED', 
        color: 'text-yellow-400',
        dotColor: 'bg-yellow-500'
      };
    }
    
    if (error) {
      return { 
        text: 'ERROR', 
        color: 'text-red-400',
        dotColor: 'bg-red-500'
      };
    }
    
    return { 
      text: 'LIVE', 
      color: 'text-green-400',
      dotColor: isBlinking ? 'bg-green-400 animate-pulse' : 'bg-green-500'
    };
  };
  
  // Get connection state details for tooltip
  const getConnectionDetails = () => {
    if (error) {
      return `Error: ${error.toString().substring(0, 100)}`;
    }
    
    return `WebSocket state: ${connectionState || 'unknown'}`;
  };
  
  const status = getStatusInfo();
  
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

      {/* Divider */}
      {isConnected && (
        <>
          <span className="text-gray-500">|</span>

          {/* Updates Count */}
          <div>
            <span className="text-gray-300">
              Updates: <span className="text-cyber-400">{updateCount}</span>
            </span>
          </div>

          {/* Last Updated Token */}
          {lastSymbol && (
            <>
              <span className="text-gray-500">|</span>
              <div>
                <span className="text-brand-400">{lastSymbol}</span>
              </div>
            </>
          )}

          {/* Last Update Time */}
          {lastUpdate && (
            <>
              <span className="text-gray-500">|</span>
              <div>
                <span className="text-gray-400">{formatTimeAgo(lastUpdate)}</span>
              </div>
            </>
          )}
        </>
      )}
      
      {/* Tooltip for detailed connection info */}
      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-dark-300 border border-dark-400 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-help">
        <div className="text-gray-200 font-medium mb-1">WebSocket Status:</div>
        <div className="text-gray-400 break-words">{getConnectionDetails()}</div>
        {lastUpdate && (
          <div className="mt-1 text-gray-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatus;