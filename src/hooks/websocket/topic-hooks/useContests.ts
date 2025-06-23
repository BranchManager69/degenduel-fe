/**
 * useContests Hook
 * 
 * V69 Standardized WebSocket Hook for Contest Data
 * This hook provides real-time updates for trading contests from the unified WebSocket system
 * 
 * ⚠️  IMPORTANT: Contains Technical Debt - Band-aid TypeScript Approach ⚠️
 * 
 * ISSUE RESOLVED: Contest #768 "Numero Uno" was missing from UI due to:
 * 1. Frontend using wrong action name: 'GET_ALL_CONTESTS' → Fixed to 'getContests'  
 * 2. Backend changed message format without frontend updates
 * 3. WebSocket requests missing pagination limit → Fixed to use limit=1000 like REST API
 * 
 * CURRENT APPROACH: Using `any` types for WebSocket messages to support dual formats
 * - OLD FORMAT: { type: 'DATA', topic: 'contest', subtype: 'update', data: {...} }
 * - NEW FORMAT: { topic: 'contest', action: 'getContests', data: [...] }
 * 
 * FUTURE REFACTOR NEEDED: Replace `any` types with proper discriminated unions and type guards
 * 
 * STATUS: ✅ Working - All contests including newly created ones now appear in UI
 * 
 * @author Branch Manager
 * @created 2025-04-10
 * @updated 2025-06-04 - Band-aid fix for WebSocket format compatibility
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { TopicType } from '../index';
import { DDExtendedMessageType } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

// Contest data interfaces based on backend API documentation
export interface ContestRanking {
  rank: number;
  user_id: string;
  nickname: string;
  profit_loss: number;
  profit_loss_percentage: number;
}

export interface Contest {
  contest_id: string;
  name: string;
  status: 'registration' | 'active' | 'ended';
  start_time: string;
  end_time: string;
  prize_pool: number;
  entry_count: number;
  entry_fee?: number;
  difficulty?: string;
  description?: string;
  rules?: string[];
  prize_structure?: Record<string, number>;
  joined?: boolean;
  leaderboard?: {
    rankings: ContestRanking[];
  };
}

// Default state
const DEFAULT_STATE = {
  contests: [] as Contest[],
  activeContests: [] as Contest[],
  upcomingContests: [] as Contest[],
  pastContests: [] as Contest[],
  userContests: [] as Contest[]
};

// NOTE: WebSocketContestMessage interface removed due to dual format support
// Using 'any' types temporarily until proper discriminated unions are implemented

/**
 * Hook for accessing and managing contest data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param userId Optional user ID to filter contests by participation
 */
export function useContests(userId?: string) {
  console.log('🚀 [useContests] Hook called! userId:', userId);

  // State for contest data
  const [state, setState] = useState(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Message handler for WebSocket messages
   * 
   * ⚠️  TECHNICAL DEBT WARNING - BAND-AID APPROACH ⚠️
   * 
   * This handler uses `message: any` instead of proper TypeScript interfaces because:
   * 
   * 1. BACKEND FORMAT CHANGE: The backend team changed the WebSocket message format:
   *    - OLD: { type: 'DATA', topic: 'contest', subtype: 'update', data: {...} }
   *    - NEW: { topic: 'contest', action: 'getContests', data: [...] }
   * 
   * 2. DUAL COMPATIBILITY: We need to support both formats during transition period
   * 
   * 3. TIME CONSTRAINT: Proper TypeScript refactoring would require:
   *    - Discriminated union types for different message formats
   *    - Type guards for each message type
   *    - Updating all WebSocket hooks to match new patterns
   * 
   * PROPER SOLUTION (Future Task):
   * - Define separate interfaces: ContestListResponse, ContestUpdateMessage, etc.
   * - Use discriminated unions: type WebSocketMessage = ContestListResponse | ContestUpdateMessage
   * - Implement type guards: isContestListResponse(msg): msg is ContestListResponse
   * - Remove all `as any` casts and use proper type narrowing
   * 
   * CURRENT STATUS: ✅ Working - Contest #768 now appears in UI after backend fix
   * 
   * @param message WebSocket message (temporarily typed as 'any' for dual format support)
   */
  const handleMessage = useCallback((message: any) => {
    try {
      // Check if this is a valid contest message (handle both old and new formats)
      if ((message.type === 'DATA' && message.topic === 'contest') ||
        (message.topic === 'contest' && message.action === 'getContests')) {

        // Handle initial contest list response (new format)
        if (message.action === 'getContests' && Array.isArray(message.data)) {
          const contests = (message as any).data.map((contest: any) => ({
            contest_id: contest.id.toString(),
            name: contest.name,
            status: contest.status === 'pending' ? 'registration' : contest.status,
            start_time: contest.start_time,
            end_time: contest.end_time,
            prize_pool: parseFloat(contest.prize_pool),
            total_prize_pool: contest.total_prize_pool, // New backend-calculated field
            entry_count: contest.participant_count,
            entry_fee: parseFloat(contest.entry_fee),
            difficulty: contest.settings?.difficulty || 'guppy',
            description: contest.description,
            joined: false // Default - will be updated by user-specific data
          }));

          setState(prevState => {
            // Filter contests based on status
            const activeContests = contests.filter((c: Contest) => c.status === 'active');
            const upcomingContests = contests.filter((c: Contest) => c.status === 'registration');
            const pastContests = contests.filter((c: Contest) => c.status === 'ended');

            return {
              contests,
              activeContests,
              upcomingContests,
              pastContests,
              userContests: prevState.userContests
            };
          });

          setIsLoading(false);
          setLastUpdate(new Date());

          dispatchWebSocketEvent('contest_list_received', {
            socketType: TopicType.CONTEST,
            message: `Received ${contests.length} contests`,
            timestamp: new Date().toISOString()
          });
        }
        // Process message based on subtype (old format)
        else if (message.subtype === 'update' && message.data && !Array.isArray(message.data)) {
          // Update contest details
          const contestData = message.data as any;

          setState(prevState => {
            const contests = [...prevState.contests];
            const existingIndex = contests.findIndex(c => c.contest_id === contestData.contest_id);

            if (existingIndex >= 0) {
              // Update existing contest
              contests[existingIndex] = {
                ...contests[existingIndex],
                ...contestData
              };
            } else if (contestData.status && contestData.name) {
              // Add new contest if it has required fields
              contests.push(contestData as Contest);
            }

            // Filter contests based on status
            const activeContests = contests.filter(c => c.status === 'active');
            const upcomingContests = contests.filter(c => c.status === 'registration');
            const pastContests = contests.filter(c => c.status === 'ended');

            // Filter user contests if userId is provided
            const userContests = userId
              ? contests.filter(c => c.joined)
              : [];

            return {
              contests,
              activeContests,
              upcomingContests,
              pastContests,
              userContests
            };
          });

          setIsLoading(false);
          setLastUpdate(new Date());

          dispatchWebSocketEvent('contest_update', {
            socketType: TopicType.CONTEST,
            message: `Updated contest ${contestData.contest_id}`,
            timestamp: new Date().toISOString()
          });
        }
        else if (message.subtype === 'leaderboard' && message.data && !Array.isArray(message.data)) {
          // Update leaderboard data
          const { contest_id, leaderboard } = message.data as any;

          setState(prevState => {
            const contests = [...prevState.contests];
            const existingIndex = contests.findIndex(c => c.contest_id === contest_id);

            if (existingIndex >= 0 && leaderboard) {
              // Update existing contest's leaderboard
              contests[existingIndex] = {
                ...contests[existingIndex],
                leaderboard
              };
            }

            return {
              ...prevState,
              contests
            };
          });

          setLastUpdate(new Date());

          dispatchWebSocketEvent('contest_leaderboard_update', {
            socketType: TopicType.CONTEST,
            message: `Updated leaderboard for contest ${contest_id}`,
            timestamp: new Date().toISOString()
          });
        }
        else if (message.subtype === 'entry' && message.data && !Array.isArray(message.data)) {
          // Process entry confirmation/rejection
          const { contest_id, entry_status } = message.data as any;

          if (entry_status === 'confirmed') {
            setState(prevState => {
              const contests = [...prevState.contests];
              const existingIndex = contests.findIndex(c => c.contest_id === contest_id);

              if (existingIndex >= 0) {
                // Mark contest as joined
                contests[existingIndex] = {
                  ...contests[existingIndex],
                  joined: true
                };

                // Update user contests
                const userContests = [...prevState.userContests];
                if (!userContests.find(c => c.contest_id === contest_id)) {
                  userContests.push(contests[existingIndex]);
                }

                return {
                  ...prevState,
                  contests,
                  userContests
                };
              }

              return prevState;
            });

            dispatchWebSocketEvent('contest_entry_confirmed', {
              socketType: TopicType.CONTEST,
              message: `Entry confirmed for contest ${contest_id}`,
              timestamp: new Date().toISOString()
            });
          }
        }
        else if (message.subtype === 'result' && message.data && !Array.isArray(message.data)) {
          // Update contest with final results
          const contestData = message.data as any;

          setState(prevState => {
            const contests = [...prevState.contests];
            const existingIndex = contests.findIndex(c => c.contest_id === contestData.contest_id);

            if (existingIndex >= 0) {
              // Update contest with results
              contests[existingIndex] = {
                ...contests[existingIndex],
                ...contestData,
                status: 'ended'
              };

              // Update past contests
              const pastContests = [
                ...prevState.pastContests.filter(c => c.contest_id !== contestData.contest_id),
                contests[existingIndex]
              ];

              // Remove from active contests
              const activeContests = prevState.activeContests.filter(
                c => c.contest_id !== contestData.contest_id
              );

              return {
                ...prevState,
                contests,
                activeContests,
                pastContests
              };
            }

            return prevState;
          });

          setLastUpdate(new Date());

          dispatchWebSocketEvent('contest_result', {
            socketType: TopicType.CONTEST,
            message: `Received results for contest ${contestData.contest_id}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Mark as not loading once we've processed any valid message
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Contest WebSocket] Error processing message:', err);
      dispatchWebSocketEvent('error', {
        socketType: TopicType.CONTEST,
        message: 'Error processing contest data',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [isLoading, userId]);

  // Connect to WebSocket
  const ws = useUnifiedWebSocket(
    'contest-data-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR],
    handleMessage,
    [TopicType.CONTEST, TopicType.SYSTEM]
  );

  // Subscribe to contest data when connected (prevent duplicate subscriptions)
  const hasSubscribedContestRef = useRef(false);

  useEffect(() => {
    if (ws.isConnected && !hasSubscribedContestRef.current) {
      // Subscribe to contest data topic
      ws.subscribe([TopicType.CONTEST]);
      hasSubscribedContestRef.current = true;

      // Request initial contest data with limit to match REST API behavior
      ws.request(TopicType.CONTEST, 'getContests', { limit: 1000 });

      // Request user contests if userId is provided
      if (userId) {
        ws.request(TopicType.CONTEST, 'GET_USER_CONTESTS', { userId });
      }

      dispatchWebSocketEvent('contest_subscribe', {
        socketType: TopicType.CONTEST,
        message: 'Subscribing to contest data',
        timestamp: new Date().toISOString()
      });

      // Timeout has been removed to prevent warnings when backend is slow.
      // The isLoading flag will remain true until data is received.
    } else if (!ws.isConnected) {
      hasSubscribedContestRef.current = false;
    }

    // Cleanup function
    return () => {
      if (hasSubscribedContestRef.current) {
        ws.unsubscribe([TopicType.CONTEST]);
        hasSubscribedContestRef.current = false;
      }
    };
  }, [ws.isConnected, userId]);

  // Helper to join a contest
  const joinContest = useCallback((contestId: string) => {
    if (!ws.isConnected) {
      console.warn('[Contest WebSocket] Cannot join contest - WebSocket not connected');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    return new Promise<void>((resolve, reject) => {
      // The request method returns a boolean indicating if the message was sent
      const requestSent = ws.request(TopicType.CONTEST, 'JOIN_CONTEST', { contestId });

      if (requestSent) {
        // Success path - request was sent
        dispatchWebSocketEvent('contest_join_request', {
          socketType: TopicType.CONTEST,
          message: `Requested to join contest ${contestId}`,
          timestamp: new Date().toISOString()
        });

        // Note: The actual confirmation will come via the 'entry' subtype message
        // For now, resolve immediately when request is sent successfully
        resolve();
      } else {
        // Error path - request failed to send
        const errorMessage = 'Failed to send join contest request';
        dispatchWebSocketEvent('error', {
          socketType: TopicType.CONTEST,
          message: `Error joining contest ${contestId}`,
          error: errorMessage
        });
        reject(new Error(errorMessage));
      }
    });
  }, [ws.isConnected, ws.request]);

  // Force refresh function
  const refreshContests = useCallback(() => {
    setIsLoading(true);

    if (ws.isConnected) {
      // Request fresh contest data with limit to match REST API behavior
      ws.request(TopicType.CONTEST, 'getContests', { limit: 1000 });

      // Request user contests if userId is provided
      if (userId) {
        ws.request(TopicType.CONTEST, 'GET_USER_CONTESTS', { userId });
      }

      dispatchWebSocketEvent('contest_refresh', {
        socketType: TopicType.CONTEST,
        message: 'Refreshing contest data',
        timestamp: new Date().toISOString()
      });

      // Timeout removed to prevent warnings.
      // setTimeout(() => {
      //   if (isLoading) {
      //     setIsLoading(false);
      //   }
      // }, 10000);
    } else {
      console.warn('[Contest WebSocket] Cannot refresh - WebSocket not connected');
      setIsLoading(false);
    }
  }, [ws.isConnected, ws.request, userId, isLoading]);

  // Return the contest data and helper functions
  return {
    ...state,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshContests,
    joinContest,
    getContest: useCallback((contestId: string) => {
      return state.contests.find(c => c.contest_id === contestId) || null;
    }, [state.contests])
  };
}