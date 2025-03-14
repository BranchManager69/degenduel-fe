import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useWebSocket } from './websocket/useWebSocket';

export interface ContestLeaderboardEntry {
  rank: number;
  wallet_address: string;
  username: string;
  portfolio_value: number;
  performance: number;
  last_trade_time?: string;
}

export interface ContestActivity {
  contestId: string;
  wallet_address: string;
  username: string;
  activity_type: 'join' | 'leave' | 'trade';
  details?: {
    symbol?: string;
    amount?: number;
    price?: number;
  };
  timestamp: string;
}

export interface ContestWebSocketState {
  contestId: string;
  status: 'active' | 'completed' | 'cancelled';
  current_round?: number;
  time_remaining?: number;
  total_participants: number;
  total_prize_pool: number;
  leaderboard: ContestLeaderboardEntry[];
  activities: ContestActivity[];
  lastUpdated: string;
}

export function useContestWebSocket(contestId: string) {
  const [contestState, setContestState] = useState<ContestWebSocketState>({
    contestId,
    status: 'active',
    total_participants: 0,
    total_prize_pool: 0,
    leaderboard: [],
    activities: [],
    lastUpdated: new Date().toISOString()
  });
  
  const { user } = useStore();
  const token = user?.jwt || user?.session_token;

  // Initialize WebSocket connection using the new hook
  const {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect
  } = useWebSocket('contest', {
    token,
    reconnect: true,
    maxReconnectAttempts: 10,
    onMessage: handleMessage,
    debug: true,
  });

  // Handle incoming messages
  function handleMessage(data: any) {
    switch(data.type) {
      case 'contest_update':
        setContestState(prev => ({
          ...prev,
          status: data.status,
          current_round: data.current_round,
          time_remaining: data.time_remaining,
          total_participants: data.total_participants,
          total_prize_pool: data.total_prize_pool,
          lastUpdated: data.timestamp
        }));
        break;
        
      case 'leaderboard_update':
        setContestState(prev => ({
          ...prev,
          leaderboard: data.leaderboard || [],
          lastUpdated: data.timestamp
        }));
        break;
        
      case 'contest_activity':
        setContestState(prev => ({
          ...prev,
          activities: [
            {
              contestId: data.contest_id,
              wallet_address: data.wallet_address,
              username: data.username,
              activity_type: data.activity_type,
              details: data.details,
              timestamp: data.timestamp
            },
            ...prev.activities.slice(0, 19) // Keep only last 20 activities
          ],
          lastUpdated: data.timestamp
        }));
        break;
    }
  }

  // Subscribe to contest updates when connected and contestId changes
  useEffect(() => {
    if (isConnected && contestId) {
      // Subscribe to contest channel
      subscribe(`contest.${contestId}`);
      
      // Request initial contest data
      sendMessage({
        type: 'get_contest_details',
        contestId
      });
      
      // Request initial leaderboard
      sendMessage({
        type: 'get_contest_leaderboard',
        contestId
      });
      
      // Cleanup - unsubscribe when component unmounts or contestId changes
      return () => {
        unsubscribe(`contest.${contestId}`);
      };
    }
  }, [isConnected, contestId, sendMessage, subscribe, unsubscribe]);

  // Function to manually refresh contest data
  const refreshContest = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'get_contest_details',
        contestId
      });
      
      sendMessage({
        type: 'get_contest_leaderboard',
        contestId
      });
      
      return true;
    }
    return false;
  }, [isConnected, contestId, sendMessage]);

  return {
    contestState,
    isConnected,
    refreshContest,
    close: disconnect
  };
}

export default useContestWebSocket;