import { useEffect, useState, useCallback } from 'react';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';
import { DDExtendedMessageType } from '../types';

interface Participant {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string | null;
  
  // Contest performance data
  rank?: number;
  portfolio_value?: string;
  initial_portfolio_value?: string;
  performance_percentage?: string;
  prize_awarded?: string | null;
  
  // Enhanced user profile data
  user_level?: {
    level_number: number;
    class_name: string;
    title: string;
    icon_url?: string;
  };
  experience_points?: number;
  total_contests_entered?: number;
  contests_won?: number;
  twitter_handle?: string | null;
  is_current_user?: boolean;
  is_ai_agent?: boolean;
  is_banned?: boolean;
  is_admin?: boolean;
  is_superadmin?: boolean;
  role?: string;
  
  // Portfolio breakdown
  portfolio?: Array<{
    token_symbol: string;
    token_name: string;
    token_image?: string;
    weight: number;
    current_value: string;
    performance_percentage: string;
  }>;
}

interface ContestParticipantsMessage {
  type: DDExtendedMessageType.DATA;
  topic: string;
  action?: string;
  data: {
    contest_id: number;
    participants: Participant[];
    update_type: 'full' | 'partial' | 'rank_change';
    timestamp: string;
  };
}

export function useContestParticipants(contestId: number | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: Partial<ContestParticipantsMessage>) => {
    if (!contestId || !message.data || message.data.contest_id !== contestId) {
      return;
    }

    try {
      const { participants: updateParticipants, update_type, timestamp } = message.data;
      
      switch (update_type) {
        case 'full':
          // Full replacement of participants
          setParticipants(updateParticipants);
          break;
          
        case 'partial':
          // Merge updates with existing participants
          setParticipants(current => {
            const updatedMap = new Map(
              updateParticipants.map(p => [p.wallet_address, p])
            );
            
            return current.map(p => 
              updatedMap.get(p.wallet_address) || p
            );
          });
          break;
          
        case 'rank_change':
          // Update only rank-related fields
          setParticipants(current => {
            const rankMap = new Map(
              updateParticipants.map(p => [
                p.wallet_address, 
                {
                  rank: p.rank,
                  portfolio_value: p.portfolio_value,
                  performance_percentage: p.performance_percentage
                }
              ])
            );
            
            return current.map(p => ({
              ...p,
              ...(rankMap.get(p.wallet_address) || {})
            }));
          });
          break;
      }
      
      setLastUpdate(timestamp);
      setIsLive(true);
      setError(null);
    } catch (err) {
      console.error('Error processing participant update:', err);
      setError(err instanceof Error ? err.message : 'Failed to process participant update');
    }
  }, [contestId]);

  // Subscribe to contest participants WebSocket topic
  const { isConnected, request } = useUnifiedWebSocket(
    `contest-participants-${contestId}`,
    [DDExtendedMessageType.DATA],
    handleMessage,
    ['contest-participants']
  );

  // Request initial participants data when connected
  useEffect(() => {
    if (!contestId || !isConnected) return;

    // Request initial participant data
    request('contest-participants', 'get_participants', { contest_id: contestId });
    
    // Subscribe to real-time updates for this contest
    request('contest-participants', 'subscribe_contest', { contest_id: contestId });

    // Cleanup: unsubscribe when component unmounts or contest changes
    return () => {
      if (isConnected) {
        request('contest-participants', 'unsubscribe_contest', { contest_id: contestId });
      }
    };
  }, [contestId, isConnected, request]);

  // Manual refresh function
  const requestParticipants = useCallback(() => {
    if (!contestId || !isConnected) return;
    request('contest-participants', 'get_participants', { contest_id: contestId });
  }, [contestId, isConnected, request]);

  return {
    participants,
    lastUpdate,
    isLive,
    error,
    isConnected,
    requestParticipants
  };
}