/**
 * Contest WebSocket Hook - V69 Standardized Version
 * 
 * This hook connects to the contest WebSocket service and provides real-time
 * contest updates, leaderboard changes, and participant activity.
 */

import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { dispatchWebSocketEvent } from '../../utils/wsMonitor';
import { SOCKET_TYPES, WEBSOCKET_ENDPOINT } from './types';
import useWebSocket from './useWebSocket';

interface ContestUpdate {
  type: "CONTEST_UPDATED";
  data: {
    contest_id: string;
    status: "active" | "completed" | "cancelled";
    current_round?: number;
    time_remaining?: number;
    total_participants: number;
    total_prize_pool: number;
  };
}

interface LeaderboardUpdate {
  type: "LEADERBOARD_UPDATED";
  data: {
    contest_id: string;
    leaderboard: Array<{
      rank: number;
      wallet_address: string;
      username: string;
      portfolio_value: number;
      performance: number;
      last_trade_time?: string;
    }>;
    timestamp: string;
  };
}

interface ParticipantActivity {
  type: "PARTICIPANT_ACTIVITY";
  data: {
    contest_id: string;
    wallet_address: string;
    username: string;
    activity_type: "join" | "leave" | "trade";
    details?: {
      symbol?: string;
      amount?: number;
      price?: number;
    };
    timestamp: string;
  };
}

type ContestMessage = ContestUpdate | LeaderboardUpdate | ParticipantActivity;

export function useContestWebSocket(contestId: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { updateContest, updateLeaderboard, addContestActivity } = useStore();

  // Connect to the WebSocket using the standardized hook
  const { 
    status, 
    data, 
    error,
    send,
    connect,
    close
  } = useWebSocket<ContestMessage>({
    endpoint: `${WEBSOCKET_ENDPOINT}`,
    socketType: SOCKET_TYPES.CONTEST,
    requiresAuth: false, // Allow more flexible connection handling
    heartbeatInterval: 30000,
    autoConnect: true // Ensure we try to connect automatically
  });

  // Track loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // When the connection status changes, log it
  useEffect(() => {
    dispatchWebSocketEvent('contest_status', {
      socketType: SOCKET_TYPES.CONTEST,
      status,
      message: `Contest WebSocket is ${status}`,
      contestId
    });
    
    // Join the specific contest room when connected
    if (status === 'online') {
      joinContestRoom();
      setIsLoading(false);
    }
    
    // If we're not connected but should be loading, trigger connection with timeout
    if (status !== 'online' && isLoading) {
      // Attempt connection
      connect();
      
      // Set a timeout to prevent endless loading state
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          console.warn('Contest connection timed out, resetting loading state');
          setIsLoading(false);
        }
      }, 10000);
      
      // Clean up the timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [status, contestId, isLoading, connect]);

  // Join the contest room
  const joinContestRoom = () => {
    if (status !== 'online') {
      console.warn('Cannot join contest room: WebSocket not connected');
      return;
    }
    
    send({
      type: "JOIN_ROOM",
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_join_room', {
      socketType: SOCKET_TYPES.CONTEST,
      message: `Joining contest room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  };

  // Leave the contest room
  const leaveContestRoom = () => {
    if (status !== 'online') {
      return;
    }
    
    send({
      type: "LEAVE_ROOM",
      contestId: contestId.toString()
    });
    
    dispatchWebSocketEvent('contest_leave_room', {
      socketType: SOCKET_TYPES.CONTEST,
      message: `Leaving contest room: ${contestId}`,
      contestId,
      timestamp: new Date().toISOString()
    });
  };

  // Process messages from the WebSocket
  useEffect(() => {
    if (!data) return;
    
    try {
      // Process the message based on its type
      switch (data.type) {
        case "CONTEST_UPDATED":
          updateContest(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('contest_update', {
            socketType: SOCKET_TYPES.CONTEST,
            message: `Contest updated: ${data.data.contest_id}`,
            contestId: data.data.contest_id,
            status: data.data.status,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "LEADERBOARD_UPDATED":
          updateLeaderboard(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('leaderboard_update', {
            socketType: SOCKET_TYPES.CONTEST,
            message: `Leaderboard updated: ${data.data.contest_id}`,
            contestId: data.data.contest_id,
            entries: data.data.leaderboard.length,
            timestamp: new Date().toISOString()
          });
          break;
          
        case "PARTICIPANT_ACTIVITY":
          addContestActivity(data.data);
          setLastUpdate(new Date());
          
          dispatchWebSocketEvent('participant_activity', {
            socketType: SOCKET_TYPES.CONTEST,
            message: `Participant activity: ${data.data.activity_type}`,
            contestId: data.data.contest_id,
            activityType: data.data.activity_type,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (err) {
      console.error('Error processing contest message:', err);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CONTEST,
        message: 'Error processing contest data',
        error: err instanceof Error ? err.message : String(err),
        contestId
      });
    }
  }, [data, updateContest, updateLeaderboard, addContestActivity, contestId]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Contest WebSocket error:', error);
      dispatchWebSocketEvent('error', {
        socketType: SOCKET_TYPES.CONTEST,
        message: error.message,
        error,
        contestId
      });
    }
  }, [error, contestId]);
  
  // Leave room on component unmount
  useEffect(() => {
    return () => {
      leaveContestRoom();
    };
  }, []);
  
  return {
    isConnected: status === 'online',
    error: error ? error.message : null,
    lastUpdate,
    joinRoom: joinContestRoom,
    leaveRoom: leaveContestRoom,
    connect,
    close
  };
}