// src/hooks/websocket/topic-hooks/useContestViewUpdates.ts

// TODO: IMPLEMENT THIS ASAP
// FOR THE PAGES CONTEST LOBBY, CONTEST RESULTS, CONTEST BROWSER, and CONTEST DETAIL

import { useCallback, useEffect, useState } from 'react';
import { ContestDetails, ContestViewData, CurrentUserPerformance, LeaderboardEntry } from '../../../types'; // Ensure all necessary sub-types are imported
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDExtendedMessageType } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// WebSocket Topic enums - using string literals for compatibility
const WEBSOCKET_TOPICS = {
  CONTEST: 'contest',
  USER: 'user',
  LEADERBOARD: 'leaderboard'
} as const;

// WebSocket Actions - using string literals for compatibility  
const WEBSOCKET_ACTIONS = {
  LEADERBOARD_UPDATE: 'LEADERBOARD_UPDATE',
  STATUS_UPDATE: 'STATUS_UPDATE',
  PARTICIPANT_UPDATE: 'PARTICIPANT_UPDATE',
  CONTEST_UPDATE: 'CONTEST_UPDATE'
} as const;

// Define expected WebSocket message structures based on backend documentation
interface ContestUpdateMessageData {
  contestId: string;
  leaderboard?: LeaderboardEntry[];
  status?: ContestDetails['status'];
  // For user-specific updates
  participantData?: Partial<LeaderboardEntry & CurrentUserPerformance>; // A mix of fields
}

interface ContestWebSocketMessage {
  type: DDExtendedMessageType.DATA;
  topic: string;
  subtype?: 'leaderboard' | 'status' | 'contest_participation' | 'update';
  action?: string;
  data: ContestUpdateMessageData;
  timestamp: string;
}

/**
 * Hook for real-time contest view updates via WebSocket
 * Used by ContestLobbyPage, ContestResultsPage, and ContestDetailPage
 */
export function useContestViewUpdates(contestId: string | null, initialData: ContestViewData | null) {
  const [updatedData, setUpdatedData] = useState<ContestViewData | null>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when initial data changes
  useEffect(() => {
    if (initialData !== updatedData) {
      setUpdatedData(initialData);
    }
  }, [initialData, updatedData]);

  const handleMessage = useCallback((message: Partial<ContestWebSocketMessage>) => {
    if (!contestId || !message.data || message.data.contestId !== contestId || message.type !== DDExtendedMessageType.DATA) {
      return;
    }

    const { topic, subtype, action, data } = message;

    setUpdatedData(prevData => {
      if (!prevData) return initialData;

      // Create copies only when necessary
      let hasChanges = false;
      let newContestData = prevData.contest;
      let newLeaderboard = prevData.leaderboard;
      let newCurrentUserPerformance = prevData.currentUserPerformance;

      // Handle contest topic updates
      if (topic === WEBSOCKET_TOPICS.CONTEST) {
        if (subtype === 'leaderboard' && action === WEBSOCKET_ACTIONS.LEADERBOARD_UPDATE && data.leaderboard) {
          // Only update if leaderboard data is actually different
          const isDifferent = !newLeaderboard ||
            newLeaderboard.length !== data.leaderboard.length ||
            JSON.stringify(newLeaderboard) !== JSON.stringify(data.leaderboard);

          if (isDifferent) {
            newLeaderboard = data.leaderboard.map(e => ({ ...e }));
            hasChanges = true;

            // Update current user performance from leaderboard
            const currentUserEntry = newLeaderboard.find(e => e.isCurrentUser);
            if (currentUserEntry && newCurrentUserPerformance) {
              newCurrentUserPerformance = {
                ...newCurrentUserPerformance,
                rank: currentUserEntry.rank,
                portfolioValue: currentUserEntry.portfolioValue,
                performancePercentage: currentUserEntry.performancePercentage
              };
            }
          }

          dispatchWebSocketEvent('contest_view_leaderboard_update', { contestId });
        }

        else if (subtype === 'status' && action === WEBSOCKET_ACTIONS.STATUS_UPDATE && data.status && newContestData) {
          if (newContestData.status !== data.status) {
            newContestData = { ...newContestData, status: data.status };
            hasChanges = true;
          }
          dispatchWebSocketEvent('contest_view_status_update', { contestId, status: data.status });
        }

        else if (subtype === 'update' && action === WEBSOCKET_ACTIONS.CONTEST_UPDATE) {
          // General contest updates (participant count, etc.)
          if (newContestData) {
            const updatedContestData = { ...newContestData, ...data };
            // Check if anything actually changed
            if (JSON.stringify(newContestData) !== JSON.stringify(updatedContestData)) {
              newContestData = updatedContestData;
              hasChanges = true;
            }
          }
          dispatchWebSocketEvent('contest_view_contest_update', { contestId });
        }
      }

      // Handle user-specific updates
      else if (topic === WEBSOCKET_TOPICS.USER && subtype === 'contest_participation' && action === WEBSOCKET_ACTIONS.PARTICIPANT_UPDATE && data.participantData) {
        if (newCurrentUserPerformance) {
          const updatedPerformance = { ...newCurrentUserPerformance, ...data.participantData };
          if (JSON.stringify(newCurrentUserPerformance) !== JSON.stringify(updatedPerformance)) {
            newCurrentUserPerformance = updatedPerformance;
            hasChanges = true;

            // Update user's entry in leaderboard
            if (newLeaderboard) {
              const userIndex = newLeaderboard.findIndex(e => e.isCurrentUser);
              if (userIndex !== -1) {
                newLeaderboard = [...newLeaderboard];
                newLeaderboard[userIndex] = { ...newLeaderboard[userIndex], ...(data.participantData as Partial<LeaderboardEntry>) };
              }
            }
          }

          dispatchWebSocketEvent('contest_view_participant_update', { contestId });
        }
      }

      // Only return new object if something actually changed
      if (!hasChanges || !newContestData) {
        return prevData;
      }

      return {
        contest: newContestData,
        leaderboard: newLeaderboard || [],
        currentUserPerformance: newCurrentUserPerformance,
      };
    });

  }, [contestId, initialData]);

  // WebSocket connection
  const ws = useUnifiedWebSocket(
    `contest-view-${contestId}`,
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [WEBSOCKET_TOPICS.CONTEST, WEBSOCKET_TOPICS.USER, WEBSOCKET_TOPICS.LEADERBOARD]
  );

  // Update connection state
  useEffect(() => {
    setIsConnected(ws.isConnected);
    setError(ws.error);
  }, [ws.isConnected, ws.error]);

  // Subscribe to contest updates when connected
  useEffect(() => {
    if (ws.isConnected && contestId) {
      // Subscribe to all relevant topics
      ws.subscribe([WEBSOCKET_TOPICS.CONTEST, WEBSOCKET_TOPICS.USER, WEBSOCKET_TOPICS.LEADERBOARD]);

      dispatchWebSocketEvent('contest_view_subscribe', {
        contestId,
        topics: [WEBSOCKET_TOPICS.CONTEST, WEBSOCKET_TOPICS.USER, WEBSOCKET_TOPICS.LEADERBOARD]
      });
    }
  }, [ws.isConnected, contestId, ws.subscribe]);

  // Return updated data and connection status
  return {
    contestViewData: updatedData,
    isConnected,
    error
  };
} 