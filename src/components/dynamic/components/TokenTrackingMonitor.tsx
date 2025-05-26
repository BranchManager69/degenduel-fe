// src/components/dynamic/components/TokenTrackingMonitor.tsx

/**
 * DADDIOS - Advanced Token Tracking and Market Monitoring System
 * 
 * @description Real-time token data aggregation and market intelligence monitoring
 * @author BranchManager69 + Claude Code
 * @version 1.0.0 - Production Ready
 * @created 2025-05-26
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicComponentProps } from '../types';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useTokenSchedulerStatus } from '../../../hooks/websocket/topic-hooks/useTokenSchedulerStatus';

// This interface is no longer used since we're using the real WebSocket hook data

// Token Health Status Utilities
const getTokenStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return 'bg-green-500 text-white border-green-400';
    case 'warning': return 'bg-yellow-500 text-black border-yellow-400';
    case 'critical': return 'bg-orange-500 text-white border-orange-400';
    case 'queued_inactive': return 'bg-red-500 text-white border-red-400';
    case 'inactive': return 'bg-gray-600 text-gray-300 border-gray-500';
    default: return 'bg-gray-700 text-gray-300 border-gray-600';
  }
};

const getTokenStatusIcon = (status: string): string => {
  switch (status) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🟠';
    case 'queued_inactive': return '🔴';
    case 'inactive': return '⚫';
    default: return '❓';
  }
};

const getFailureLevel = (failures: number): string => {
  if (failures === 0) return 'healthy';
  if (failures <= 2) return 'warning';
  if (failures <= 4) return 'critical';
  return 'queued_inactive';
};

// Individual Token Tile Component
interface TokenTileProps {
  token: any; // Use any to match the real token structure from the hook
  compact?: boolean;
  onClick?: (token: any) => void;
}

const TokenTile: React.FC<TokenTileProps> = ({ token, compact = false, onClick }) => {
  const status = token.status || getFailureLevel(token.failures);
  const colorClass = getTokenStatusColor(status);
  const icon = getTokenStatusIcon(status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      className={`
        cursor-pointer rounded-lg border-2 transition-all duration-300 p-2
        ${colorClass} hover:shadow-lg hover:shadow-mauve/20
        ${compact ? 'h-12' : 'h-16'}
        flex flex-col justify-between
      `}
      onClick={() => onClick?.(token)}
    >
      <div className="flex justify-between items-start">
        <span className={`font-bold font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
          {token.symbol}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      
      {!compact && (
        <div className="flex justify-between items-end text-xs font-mono">
          <span>F: {token.failures}</span>
          <span>{token.queuedForInactive ? 'Q' : ''}</span>
        </div>
      )}
    </motion.div>
  );
};

// Activity Feed Event Component
interface ActivityEventProps {
  event: any; // Use any to match the real event structure from the hook
  compact?: boolean;
}

const ActivityEvent: React.FC<ActivityEventProps> = ({ event, compact = false }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'batch_started': return '⚡';
      case 'batch_completed': return '✅';
      case 'tokens_marked_inactive': return '❌';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'batch_started': return 'text-blue-400';
      case 'batch_completed': return 'text-green-400';
      case 'tokens_marked_inactive': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'batch_started':
        return `Batch ${event.batchNumber}/${event.totalBatches} started (${event.tokenCount} tokens)`;
      case 'batch_completed':
        return `Batch completed (${event.tokenCount} tokens processed)`;
      case 'tokens_marked_inactive':
        const dbMismatch = event.dbUpdatedCount !== event.tokenCount;
        return `${event.tokenCount} tokens marked inactive${dbMismatch ? ` (DB: ${event.dbUpdatedCount})` : ''}`;
      default:
        return `Unknown event: ${event.tokenCount} tokens`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-center gap-2 p-2 rounded border border-mauve/20 
        bg-darkGrey-dark/30 ${compact ? 'text-xs' : 'text-sm'}
      `}
    >
      <span className="text-lg">{getEventIcon(event.type)}</span>
      <div className="flex-1">
        <div className={`font-mono ${getEventColor(event.type)}`}>
          {getEventDescription(event)}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {event.timestamp.toLocaleTimeString()}
        </div>
      </div>
      
      {/* Database persistence warning */}
      {event.type === 'tokens_marked_inactive' && event.dbUpdatedCount !== event.tokenCount && (
        <Badge variant="destructive" className="text-xs">
          DB Mismatch!
        </Badge>
      )}
    </motion.div>
  );
};

// Main DADDIOS TokenTrackingMonitor Component
const TokenTrackingMonitor: React.FC<DynamicComponentProps> = ({
  onInteraction,
  className = ''
}) => {
  // Use real WebSocket hook for token scheduler status
  const {
    connected,
    loading,
    error,
    tokens,
    events,
    queueStatus,
    persistenceIssues,
    totalTokens,
    healthyTokens,
    warningTokens,
    criticalTokens,
    inactiveTokens,
    refreshStatus
  } = useTokenSchedulerStatus();

  // Component state
  const [view, setView] = useState<'grid' | 'feed' | 'stats'>('grid');
  const [compact, setCompact] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);

  // Statistics are provided by the hook
  const stats = {
    total: totalTokens,
    healthy: healthyTokens,
    warning: warningTokens,
    critical: criticalTokens,
    inactive: inactiveTokens,
    queued: tokens.filter(t => t.queuedForInactive).length
  };

  // Handle token selection
  const handleTokenClick = (token: any) => {
    setSelectedToken(token);
    onInteraction?.('token_selected', { token });
  };

  // Handle view changes
  const handleViewChange = (newView: 'grid' | 'feed' | 'stats') => {
    setView(newView);
    onInteraction?.('view_changed', { view: newView });
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-2">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-red-400 text-center">
          <div className="text-lg font-mono font-semibold mb-2">Connection Error</div>
          <div className="text-sm mb-4">{error}</div>
          <Button onClick={refreshStatus} size="sm">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-mauve/20">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-mono text-white font-semibold">
              DADDIOS Monitor
            </h3>
            <p className="text-sm text-gray-400 font-mono">
              {stats.total} tokens • {connected ? (queueStatus.processing ? 'Processing...' : 'Idle') : 'Disconnected'}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-green-400 border-green-400">
              {stats.healthy} Healthy
            </Badge>
            {stats.warning > 0 && (
              <Badge variant="warning" className="text-yellow-400 border-yellow-400">
                {stats.warning} Warning
              </Badge>
            )}
            {stats.critical > 0 && (
              <Badge variant="error" className="text-orange-400 border-orange-400">
                {stats.critical} Critical
              </Badge>
            )}
            {stats.inactive > 0 && (
              <Badge variant="secondary" className="text-gray-400 border-gray-400">
                {stats.inactive} Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {(['grid', 'feed', 'stats'] as const).map((viewOption) => (
              <Button
                key={viewOption}
                size="sm"
                variant={view === viewOption ? "primary" : "outline"}
                onClick={() => handleViewChange(viewOption)}
                className="text-xs capitalize"
              >
                {viewOption}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={compact ? "primary" : "outline"}
              onClick={() => setCompact(!compact)}
              className="text-xs"
            >
              {compact ? 'Expanded' : 'Compact'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshStatus}
              className="text-xs"
            >
              ↻ Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {view === 'grid' && (
          <div className={`grid gap-2 ${
            compact 
              ? 'grid-cols-6 sm:grid-cols-8 lg:grid-cols-12' 
              : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
          }`}>
            <AnimatePresence mode="popLayout">
              {tokens.map((token) => (
                <TokenTile
                  key={token.id}
                  token={token}
                  compact={compact}
                  onClick={handleTokenClick}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {view === 'feed' && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {events
                .filter(event => event.type === 'batch_started' || event.type === 'batch_completed' || event.type === 'tokens_marked_inactive')
                .slice(0, 20)
                .map((event, index) => (
                  <ActivityEvent
                    key={`${event.type}-${index}`}
                    event={{
                      id: `${event.type}-${index}`,
                      type: event.type as any,
                      batchNumber: 'batchNumber' in event ? event.batchNumber : undefined,
                      totalBatches: 'totalBatches' in event ? event.totalBatches : undefined,
                      tokenCount: 'tokenCount' in event ? event.tokenCount : 0,
                      dbUpdatedCount: 'dbUpdatedCount' in event ? event.dbUpdatedCount : undefined,
                      timestamp: new Date(event.timestamp)
                    }}
                    compact={compact}
                  />
                ))}
            </AnimatePresence>
            {events.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-sm">No recent activity</div>
                <Button onClick={refreshStatus} size="sm" className="mt-2">
                  Check for Updates
                </Button>
              </div>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-darkGrey-dark/30 p-3 rounded border border-mauve/20">
              <div className="text-2xl font-mono font-bold text-green-400">{stats.healthy}</div>
              <div className="text-xs text-gray-400">Healthy Tokens</div>
            </div>
            <div className="bg-darkGrey-dark/30 p-3 rounded border border-mauve/20">
              <div className="text-2xl font-mono font-bold text-red-400">{stats.critical + stats.inactive}</div>
              <div className="text-xs text-gray-400">Failed Tokens</div>
            </div>
            <div className="bg-darkGrey-dark/30 p-3 rounded border border-mauve/20">
              <div className="text-2xl font-mono font-bold text-blue-400">
                {queueStatus.processing ? `${queueStatus.batchNumber}/${queueStatus.totalBatches}` : 'Idle'}
              </div>
              <div className="text-xs text-gray-400">Batch Status</div>
            </div>
            
            {/* Database Persistence Issues */}
            {persistenceIssues.length > 0 && (
              <div className="col-span-full">
                <h4 className="text-sm font-mono text-red-400 mb-2">🚨 Database Issues</h4>
                <div className="space-y-1">
                  {persistenceIssues.slice(0, 3).map((issue, idx) => (
                    <div key={idx} className="text-xs font-mono text-red-300 bg-red-900/20 p-2 rounded">
                      Expected {issue.expectedCount}, got {issue.actualCount} at {issue.timestamp.toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Token Details Modal */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-darkGrey-dark border border-mauve/30 rounded-lg p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  {getTokenStatusIcon(selectedToken.status || getFailureLevel(selectedToken.failures))}
                  {selectedToken.symbol}
                </h4>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedToken.address.slice(0, 8)}...{selectedToken.address.slice(-4)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Failures:</span>
                  <span className="text-white font-mono">{selectedToken.failures}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <Badge className={getTokenStatusColor(selectedToken.status || getFailureLevel(selectedToken.failures))}>
                    {selectedToken.status || getFailureLevel(selectedToken.failures)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Queued for Inactive:</span>
                  <span className={selectedToken.queuedForInactive ? 'text-red-400' : 'text-green-400'}>
                    {selectedToken.queuedForInactive ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedToken.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenTrackingMonitor;