import { useCallback, useEffect, useState } from 'react';
import { ContestDetails, ContestViewData, CurrentUserPerformance, LeaderboardEntry } from '../../../types'; // Ensure all necessary sub-types are imported
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { DDWebSocketActions } from '../../../websocket-types-implementation'; // Correct path for DDWebSocketActions
import { DDExtendedMessageType, DDWebSocketTopic } from '../index'; // Assuming DDWebSocketTopic is an enum exported normally from here
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

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
  topic: DDWebSocketTopic;
  subtype?: 'leaderboard' | 'status' | 'contest_participation';
  action?: string; // e.g., LEADERBOARD_UPDATE, STATUS_UPDATE, PARTICIPANT_UPDATE
  data: ContestUpdateMessageData;
  timestamp: string;
}

export function useContestViewUpdates(contestId: string | null, initialData: ContestViewData | null) {
  const [updatedData, setUpdatedData] = useState<ContestViewData | null>(initialData);
  // const initialDataRef = useRef(initialData); // Not strictly needed if useEffect handles initialData changes

  useEffect(() => {
    setUpdatedData(initialData); 
  }, [initialData]);

  const handleMessage = useCallback((message: Partial<ContestWebSocketMessage>) => {
    if (!contestId || !message.data || message.data.contestId !== contestId || message.type !== DDExtendedMessageType.DATA) {
      return;
    }

    const { topic, subtype, action, data } = message;

    setUpdatedData(prevData => {
      if (!prevData) return initialData; // Fallback to initialData if prevData is somehow null
      
      // Create deep copies to ensure true immutability if nested objects are modified directly
      let newContestData = prevData.contest ? { ...prevData.contest } : null;
      let newLeaderboard = prevData.leaderboard ? prevData.leaderboard.map(e => ({...e})) : [];
      let newCurrentUserPerformance = prevData.currentUserPerformance ? { ...prevData.currentUserPerformance } : null;

      if (topic === DDWebSocketTopic.CONTEST) {
        if (subtype === 'leaderboard' && action === DDWebSocketActions.LEADERBOARD_UPDATE && data.leaderboard) {
          newLeaderboard = data.leaderboard.map(e => ({...e})); // Ensure new array and new objects
          const currentUserEntry = newLeaderboard.find(e => e.isCurrentUser);
          if (currentUserEntry && newCurrentUserPerformance) {
            newCurrentUserPerformance.rank = currentUserEntry.rank;
            newCurrentUserPerformance.portfolioValue = currentUserEntry.portfolioValue;
            newCurrentUserPerformance.performancePercentage = currentUserEntry.performancePercentage;
          }
          dispatchWebSocketEvent('contest_view_leaderboard_update', { contestId });
        } else if (subtype === 'status' && action === DDWebSocketActions.STATUS_UPDATE && data.status && newContestData) {
          newContestData.status = data.status;
          dispatchWebSocketEvent('contest_view_status_update', { contestId, status: data.status });
        }
      } else if (topic === DDWebSocketTopic.USER && subtype === 'contest_participation' && action === DDWebSocketActions.PARTICIPANT_UPDATE && data.participantData) {
        if (newCurrentUserPerformance) {
          newCurrentUserPerformance = { ...newCurrentUserPerformance, ...data.participantData };
          const userIndex = newLeaderboard.findIndex(e => e.isCurrentUser);
          if (userIndex !== -1) {
            newLeaderboard[userIndex] = { ...newLeaderboard[userIndex], ...(data.participantData as Partial<LeaderboardEntry>) };
          }
          dispatchWebSocketEvent('contest_view_participant_update', { contestId });
        }
      }
      
      if (!newContestData) return prevData; // Should not happen if prevData was valid

      return {
        contest: newContestData,
        leaderboard: newLeaderboard,
        currentUserPerformance: newCurrentUserPerformance,
      };
    });

  }, [contestId, initialData]); // Added initialData to dependency array for safety with the fallback

  const ws = useUnifiedWebSocket(
    `contest-view-${contestId}`,
    [DDExtendedMessageType.DATA],
    handleMessage,
    [DDWebSocketTopic.CONTEST, DDWebSocketTopic.USER]
  );

  useEffect(() => {
    if (ws.isConnected && contestId) {
      ws.subscribe([DDWebSocketTopic.CONTEST]);
      dispatchWebSocketEvent('contest_view_subscribe', { contestId });
    }
  }, [ws.isConnected, contestId, ws.subscribe]);

  // Return the updated data, and connection status/error from the WebSocket hook
  return { contestViewData: updatedData, isConnected: ws.isConnected, error: ws.error };
} 