import { useCallback, useEffect, useRef } from 'react';
import { useWebSocketTopic } from '../useWebSocketTopic';
import { MessageType } from '../index';

interface ContestPositionEvent {
  type: 'CONTEST_POSITION_CHANGED' | 'LEADERBOARD_UPDATED' | 'RANK_CHANGED';
  timestamp: string;
  contestId: string;
  userId?: string;
  data: {
    // Contest position data
    position?: {
      userId: string;
      username?: string;
      rank: number;
      portfolioValue: number;
      pnl: number;
      pnlPercentage: number;
      avatar?: string;
    };
    // Leaderboard data
    leaderboard?: Array<{
      userId: string;
      username?: string;
      rank: number;
      portfolioValue: number;
      pnl: number;
      pnlPercentage: number;
      avatar?: string;
    }>;
    // Rank change data
    rankChange?: {
      userId: string;
      previousRank: number;
      currentRank: number;
      rankChange: number; // positive = moved up, negative = moved down
    };
    totalParticipants?: number;
    contestStatus?: 'upcoming' | 'active' | 'ended';
  };
}

interface UseContestPositionsProps {
  contestId?: string;
  userId?: string;
  onPositionChanged?: (data: ContestPositionEvent['data']) => void;
  onLeaderboardUpdated?: (data: ContestPositionEvent['data']) => void;
  onRankChanged?: (data: ContestPositionEvent['data']) => void;
  enabled?: boolean;
}

export const useContestPositions = ({
  contestId,
  userId,
  onPositionChanged,
  onLeaderboardUpdated,
  onRankChanged,
  enabled = true
}: UseContestPositionsProps = {}) => {
  const callbacksRef = useRef({
    onPositionChanged,
    onLeaderboardUpdated,
    onRankChanged
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onPositionChanged,
      onLeaderboardUpdated,
      onRankChanged
    };
  }, [onPositionChanged, onLeaderboardUpdated, onRankChanged]);

  const handleMessage = useCallback((data: ContestPositionEvent) => {
    // Filter by contestId if specified
    if (contestId && data.contestId !== contestId) {
      return;
    }

    // Filter by userId for rank changes if specified
    if (userId && data.type === 'RANK_CHANGED' && data.userId !== userId) {
      return;
    }

    const callbacks = callbacksRef.current;

    switch (data.type) {
      case 'CONTEST_POSITION_CHANGED':
        callbacks.onPositionChanged?.(data.data);
        break;
      case 'LEADERBOARD_UPDATED':
        callbacks.onLeaderboardUpdated?.(data.data);
        break;
      case 'RANK_CHANGED':
        callbacks.onRankChanged?.(data.data);
        break;
    }
  }, [contestId, userId]);

  const {
    isConnected,
    subscribe,
    unsubscribe,
    request
  } = useWebSocketTopic(
    'contest',
    [MessageType.DATA],
    handleMessage,
    { autoSubscribe: enabled }
  );

  // Subscribe to contest position updates
  useEffect(() => {
    if (!enabled || !isConnected) return;

    const subscriptionData: any = {};
    
    if (contestId) {
      subscriptionData.contestId = contestId;
    }
    
    if (userId) {
      subscriptionData.userId = userId;
    }

    request('SUBSCRIBE_CONTEST_POSITIONS', subscriptionData);

    return () => {
      request('UNSUBSCRIBE_CONTEST_POSITIONS', subscriptionData);
    };
  }, [enabled, isConnected, contestId, userId, request]);

  return {
    isConnected,
    subscribe: () => subscribe(),
    unsubscribe: () => unsubscribe(),
    request: (action: string, data: any = {}) => request(action, data)
  };
};