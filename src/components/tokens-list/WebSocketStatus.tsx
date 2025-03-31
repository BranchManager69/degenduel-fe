import React, { useState, useEffect } from 'react';
import { useTokenData } from '../../hooks/useTokenData';

export const WebSocketStatus: React.FC = () => {
  const { isConnected, tokens, lastUpdate, error } = useTokenData("all");
  const [updateCount, setUpdateCount] = useState(0);
  const [lastSymbol, setLastSymbol] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  // Track updates when new data comes in
  useEffect(() => {
    if (lastUpdate) {
      setUpdateCount(prev => prev + 1);
      
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

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-200/50 backdrop-blur-sm border border-dark-400 text-xs font-mono">
      {/* Connection Status Indicator */}
      <div className="flex items-center">
        <span 
          className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
            isConnected 
              ? isBlinking 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-green-500' 
              : 'bg-red-500'
          }`}
        />
        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
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

      {/* Error Status */}
      {error && (
        <>
          <span className="text-gray-500">|</span>
          <span className="text-red-400">Error</span>
        </>
      )}
    </div>
  );
};

export default WebSocketStatus;