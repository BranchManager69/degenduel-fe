/**
 * useContests Hook
 * 
 * V69 Standardized WebSocket Hook for Contest Data
 * This hook provides real-time updates for trading contests from the unified WebSocket system
 * Follows the exact message format defined by the backend team
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';
import { dispatchWebSocketEvent } from '../../../utils/wsMonitor';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { MessageType } from '../types';
import { TopicType } from '../index';

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

// Define the standard structure for contest data updates from the server
// Following the exact format from the backend team
interface WebSocketContestMessage {
  type: string; // 'DATA'
  topic: string; // 'contest'
  subtype: 'update' | 'leaderboard' | 'entry' | 'result';
  data: {
    contest_id: string;
    status?: 'registration' | 'active' | 'ended';
    name?: string;
    start_time?: string;
    end_time?: string;
    prize_pool?: number;
    entry_count?: number;
    leaderboard?: {
      rankings: ContestRanking[];
    };
    entry_status?: 'confirmed' | 'rejected';
  };
  timestamp: string;
}

/**
 * Hook for accessing and managing contest data with real-time updates
 * Uses the unified WebSocket system
 * 
 * @param userId Optional user ID to filter contests by participation
 */
export function useContests(userId?: string) {
  // State for contest data
  const [state, setState] = useState(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Message handler for WebSocket messages
  const handleMessage = useCallback((message: Partial<WebSocketContestMessage>) => {
    try {
      // Check if this is a valid contest message
      if (message.type === 'DATA' && message.topic === 'contest') {
        // Process message based on subtype
        if (message.subtype === 'update' && message.data) {
          // Update contest details
          const contestData = message.data;
          
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
        else if (message.subtype === 'leaderboard' && message.data) {
          // Update leaderboard data
          const { contest_id, leaderboard } = message.data;
          
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
        else if (message.subtype === 'entry' && message.data) {
          // Process entry confirmation/rejection
          const { contest_id, entry_status } = message.data;
          
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
        else if (message.subtype === 'result' && message.data) {
          // Update contest with final results
          const contestData = message.data;
          
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
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.CONTEST, TopicType.SYSTEM]
  );

  // Subscribe to contest data when connected
  useEffect(() => {
    if (ws.isConnected && isLoading) {
      // Subscribe to contest data topic
      ws.subscribe([TopicType.CONTEST]);
      
      // Request initial contest data
      ws.request(TopicType.CONTEST, 'GET_ALL_CONTESTS');
      
      // Request user contests if userId is provided
      if (userId) {
        ws.request(TopicType.CONTEST, 'GET_USER_CONTESTS', { userId });
      }
      
      dispatchWebSocketEvent('contest_subscribe', {
        socketType: TopicType.CONTEST,
        message: 'Subscribing to contest data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('[Contest WebSocket] Timed out waiting for data');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ws.isConnected, isLoading, ws.subscribe, ws.request, userId]);

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
      // Request fresh contest data
      ws.request(TopicType.CONTEST, 'GET_ALL_CONTESTS');
      
      // Request user contests if userId is provided
      if (userId) {
        ws.request(TopicType.CONTEST, 'GET_USER_CONTESTS', { userId });
      }
      
      dispatchWebSocketEvent('contest_refresh', {
        socketType: TopicType.CONTEST,
        message: 'Refreshing contest data',
        timestamp: new Date().toISOString()
      });
      
      // Set a timeout to reset loading state if we don't get data
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 10000);
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