// src/components/tokens-list/TokenDataFreshnessIndicator.tsx

import React from 'react';
import { useTokenSchedulerStatus } from '../../hooks/websocket';

interface TokenDataFreshnessIndicatorProps {
  compact?: boolean;
}

/**
 * Real-time indicator showing when token price data is being updated
 */
export const TokenDataFreshnessIndicator: React.FC<TokenDataFreshnessIndicatorProps> = ({ 
  compact = false 
}) => {
  const { 
    lastPriceUpdate, 
    isUpdatingPrices, 
    connected 
  } = useTokenSchedulerStatus();

  if (!connected) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Update Status Indicator */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${
        isUpdatingPrices 
          ? 'bg-yellow-500/20 text-yellow-400' 
          : 'bg-green-500/20 text-green-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isUpdatingPrices 
            ? 'bg-yellow-400 animate-pulse' 
            : 'bg-green-400'
        }`} />
        <span className="whitespace-nowrap">
          {isUpdatingPrices ? 'Updating...' : 'Live Data'}
        </span>
      </div>

      {/* Simple timestamp - only show when data was last updated */}
      {!compact && lastPriceUpdate && (
        <div className="text-xs text-gray-400">
          Updated {new Date(lastPriceUpdate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

export default TokenDataFreshnessIndicator;