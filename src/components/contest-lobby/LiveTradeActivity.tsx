import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../contexts/UnifiedWebSocketContext';

interface Trade {
  id: string;
  participant_wallet: string;
  participant_nickname: string;
  action: 'buy' | 'sell' | 'swap';
  token_symbol: string;
  token_name: string;
  percentage_of_portfolio: number;
  executed_at: string;
  impact_on_rank?: number;
}

interface LiveTradeActivityProps {
  contestId: string;
  maxTrades?: number;
}

export const LiveTradeActivity: React.FC<LiveTradeActivityProps> = ({
  contestId,
  maxTrades = 10
}) => {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection for real-time trade updates
  const handleTradeMessage = useCallback((message: any) => {
    console.log('[LiveTradeActivity] Received trade message:', message);
    
    if (message.type === 'TRADE_EXECUTED' && message.trade) {
      const newTrade: Trade = {
        id: `${message.participant_id}-${Date.now()}`,
        participant_wallet: message.participant_id,
        participant_nickname: message.participant_nickname || 'Unknown',
        action: message.trade.action,
        token_symbol: message.trade.token_symbol,
        token_name: message.trade.token_name || message.trade.token_symbol,
        percentage_of_portfolio: parseFloat(message.trade.amount?.replace('%', '') || '0'),
        executed_at: message.trade.timestamp,
        impact_on_rank: message.trade.impact_on_rank
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, maxTrades - 1)]);
    }
  }, [maxTrades]);

  const ws = useWebSocket();

  // Register WebSocket listener for trade events
  useEffect(() => {
    const unregister = ws.registerListener(
      `trade-activity-${contestId}`,
      ['DATA'] as any[],
      handleTradeMessage,
      ['contest-trades']
    );
    return unregister;
  }, [handleTradeMessage, ws.registerListener, contestId]);

  // Subscribe to trade events when connected
  useEffect(() => {
    if (ws.isConnected) {
      console.log('[LiveTradeActivity] Subscribing to contest-trades topic');
      ws.subscribe(['contest-trades']);
    }
  }, [ws.isConnected, ws.subscribe]);

  // Fetch initial recent trades
  useEffect(() => {
    const fetchRecentTrades = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/contests/${contestId}/recent-trades?limit=${maxTrades}`);
        
        if (response.ok) {
          const data = await response.json();
          setRecentTrades(data.trades || []);
        }
      } catch (err) {
        console.error('[LiveTradeActivity] Failed to fetch recent trades:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTrades();
  }, [contestId, maxTrades]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'swap': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return '📈';
      case 'sell': return '📉';
      case 'swap': return '🔄';
      default: return '💱';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const tradeTime = new Date(timestamp);
    const diffMs = now.getTime() - tradeTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return tradeTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatPercentage = (percentage: number) => {
    if (percentage >= 50) return 'ALL-IN';
    if (percentage >= 25) return 'MAJOR';
    if (percentage >= 10) return 'MEDIUM';
    return 'SMALL';
  };

  if (isLoading) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Live Trade Activity</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-dark-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-dark-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-100">Live Trade Activity</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <div>No recent trades</div>
            </div>
          ) : (
            recentTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg border border-dark-300/50 hover:bg-dark-300/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">{getActionIcon(trade.action)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">
                        {trade.participant_nickname}
                      </span>
                      <span className={`text-sm font-bold ${getActionColor(trade.action)}`}>
                        {trade.action.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-300">
                        {trade.token_symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatTimeAgo(trade.executed_at)}</span>
                      <span>•</span>
                      <span className={`font-bold ${
                        trade.percentage_of_portfolio >= 50 ? 'text-red-400' :
                        trade.percentage_of_portfolio >= 25 ? 'text-orange-400' :
                        'text-gray-400'
                      }`}>
                        {formatPercentage(trade.percentage_of_portfolio)}
                      </span>
                      {trade.impact_on_rank !== undefined && trade.impact_on_rank !== 0 && (
                        <>
                          <span>•</span>
                          <span className={`${
                            trade.impact_on_rank > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.impact_on_rank > 0 ? '↑' : '↓'}{Math.abs(trade.impact_on_rank)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trade size indicator */}
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  trade.percentage_of_portfolio >= 50 ? 'bg-red-500/20 text-red-400' :
                  trade.percentage_of_portfolio >= 25 ? 'bg-orange-500/20 text-orange-400' :
                  trade.percentage_of_portfolio >= 10 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {trade.percentage_of_portfolio.toFixed(0)}%
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};