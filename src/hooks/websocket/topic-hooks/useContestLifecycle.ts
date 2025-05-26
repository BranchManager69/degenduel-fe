// src/hooks/websocket/topic-hooks/useContestLifecycle.ts

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';
import { Contest } from '../../../types';

interface ContestCreatedEvent {
  action: 'CONTEST_CREATED';
  data: Contest;
  timestamp: string;
}

interface ContestStartedEvent {
  action: 'CONTEST_STARTED';
  data: { contestId: number; startTime: string };
  timestamp: string;
}

interface ContestEndedEvent {
  action: 'CONTEST_ENDED';
  data: { contestId: number; endTime: string; winnerId?: string };
  timestamp: string;
}

interface ContestCancelledEvent {
  action: 'CONTEST_CANCELLED';
  data: { contestId: number; reason: string };
  timestamp: string;
}

interface ContestActivityEvent {
  action: 'CONTEST_ACTIVITY';
  data: { 
    contestId: number; 
    userId: string; 
    activity: 'joined' | 'left';
    participantCount: number;
  };
  timestamp: string;
}

type ContestLifecycleEvent = 
  | ContestCreatedEvent 
  | ContestStartedEvent 
  | ContestEndedEvent 
  | ContestCancelledEvent 
  | ContestActivityEvent;

interface ContestLifecycleStatus {
  connected: boolean;
  recentEvents: ContestLifecycleEvent[];
  newContests: Contest[];
  startedContests: number[];
  endedContests: number[];
  cancelledContests: number[];
  onNewContest?: (contest: Contest) => void;
  onContestStarted?: (contestId: number) => void;
  onContestEnded?: (contestId: number, winnerId?: string) => void;
  onContestCancelled?: (contestId: number, reason: string) => void;
  onContestActivity?: (contestId: number, activity: 'joined' | 'left', count: number) => void;
}

/**
 * Hook for subscribing to contest lifecycle events
 * Provides real-time updates when contests are created, started, ended, or cancelled
 */
export const useContestLifecycle = (callbacks?: {
  onNewContest?: (contest: Contest) => void;
  onContestStarted?: (contestId: number) => void;
  onContestEnded?: (contestId: number, winnerId?: string) => void;
  onContestCancelled?: (contestId: number, reason: string) => void;
  onContestActivity?: (contestId: number, activity: 'joined' | 'left', count: number) => void;
}): ContestLifecycleStatus => {
  const { registerListener, isConnected } = useWebSocket();
  
  const [recentEvents, setRecentEvents] = useState<ContestLifecycleEvent[]>([]);
  const [newContests, setNewContests] = useState<Contest[]>([]);
  const [startedContests, setStartedContests] = useState<number[]>([]);
  const [endedContests, setEndedContests] = useState<number[]>([]);
  const [cancelledContests, setCancelledContests] = useState<number[]>([]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: any) => {
    if (message.topic === 'contests') {
      const event: ContestLifecycleEvent = message;
      
      // Add to recent events (keep last 50)
      setRecentEvents(prev => [event, ...prev.slice(0, 49)]);
      
      console.log(`[ContestLifecycle] ${event.action}:`, event.data);
      
      switch (event.action) {
        case 'CONTEST_CREATED':
          setNewContests(prev => [event.data, ...prev.slice(0, 9)]); // Keep last 10
          callbacks?.onNewContest?.(event.data);
          break;
          
        case 'CONTEST_STARTED':
          setStartedContests(prev => [event.data.contestId, ...prev.slice(0, 19)]);
          callbacks?.onContestStarted?.(event.data.contestId);
          break;
          
        case 'CONTEST_ENDED':
          setEndedContests(prev => [event.data.contestId, ...prev.slice(0, 19)]);
          callbacks?.onContestEnded?.(event.data.contestId, event.data.winnerId);
          break;
          
        case 'CONTEST_CANCELLED':
          setCancelledContests(prev => [event.data.contestId, ...prev.slice(0, 19)]);
          callbacks?.onContestCancelled?.(event.data.contestId, event.data.reason);
          break;
          
        case 'CONTEST_ACTIVITY':
          callbacks?.onContestActivity?.(
            event.data.contestId, 
            event.data.activity, 
            event.data.participantCount
          );
          break;
      }
    }
  }, [callbacks]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!registerListener || !isConnected) return;

    const unregister = registerListener(
      'contest-lifecycle',
      ['DATA'] as any[], // Message types
      handleMessage,
      ['contests'] // Topic names
    );

    return unregister;
  }, [registerListener, isConnected, handleMessage]);

  return {
    connected: isConnected,
    recentEvents,
    newContests,
    startedContests,
    endedContests,
    cancelledContests,
    onNewContest: callbacks?.onNewContest,
    onContestStarted: callbacks?.onContestStarted,
    onContestEnded: callbacks?.onContestEnded,
    onContestCancelled: callbacks?.onContestCancelled,
    onContestActivity: callbacks?.onContestActivity
  };
};

export default useContestLifecycle;