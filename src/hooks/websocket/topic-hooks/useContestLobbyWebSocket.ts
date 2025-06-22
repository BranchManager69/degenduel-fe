import { useEffect } from 'react';
import { useWebSocket } from '../../../contexts/UnifiedWebSocketContext';

interface UseContestLobbyWebSocketProps {
  contestId: string | null;
  onTradeExecuted?: () => void;
  onPortfolioUpdate?: () => void;
  onContestActivity?: () => void;
  userWalletAddress?: string;
}

/**
 * Custom hook to manage WebSocket subscriptions for contest lobby
 * Handles trade execution, portfolio updates, and contest activity
 */
export const useContestLobbyWebSocket = ({
  contestId,
  onTradeExecuted,
  onPortfolioUpdate,
  onContestActivity,
  userWalletAddress
}: UseContestLobbyWebSocketProps) => {
  const ws = useWebSocket();

  useEffect(() => {
    console.log('[useContestLobbyWebSocket] Effect running:', {
      contestId,
      isConnected: ws.isConnected,
      ws: ws
    });
    
    if (!contestId || !ws.isConnected) {
      console.log('[useContestLobbyWebSocket] Skipping - no contestId or not connected');
      return;
    }

    // Subscribe to relevant topics (only public ones that work without auth)
    const subscribeToTopics = () => {
      console.log('[useContestLobbyWebSocket] Subscribing to contest topics');
      ws.subscribe(['contest', 'contest-participants']);
    };

    // Handle trade executed events
    const handleTradeExecuted = (message: any) => {
      if (message.contestId === parseInt(contestId)) {
        console.log('[ContestLobbyWebSocket] Trade executed:', message);
        onTradeExecuted?.();
      }
    };

    // Handle portfolio updates
    const handlePortfolioUpdate = (message: any) => {
      console.log('[ContestLobbyWebSocket] Portfolio updated:', message);
      onPortfolioUpdate?.();
    };

    // Handle contest activity
    const handleContestActivity = (message: any) => {
      if (message.contestId === parseInt(contestId)) {
        console.log('[ContestLobbyWebSocket] Contest activity:', message);
        onContestActivity?.();
      }
    };

    // Register listeners for specific message types
    const unregisterTrade = ws.registerListener(
      `contest-trade-${contestId}`,
      ['DATA'] as any[],
      (message) => {
        console.log('[🚨 CONTEST WEBSOCKET] Received message in trade listener:', JSON.stringify(message, null, 2));
        // Listen for LEADERBOARD_UPDATE which happens after trades
        if (message.type === 'DATA' && message.topic === 'contest' && message.action === 'LEADERBOARD_UPDATE') {
          handleTradeExecuted(message.data);
        }
      },
      ['contest']
    );

    const unregisterPortfolio = ws.registerListener(
      `contest-portfolio-${contestId}`,
      ['DATA'] as any[],
      (message) => {
        // Listen for PORTFOLIO_UPDATE from contest-participants topic
        if (message.type === 'DATA' && message.topic === 'contest-participants' && message.action === 'PORTFOLIO_UPDATE') {
          handlePortfolioUpdate(message.data);
        }
      },
      ['contest-participants']
    );

    const unregisterContest = ws.registerListener(
      `contest-activity-${contestId}`,
      ['DATA'] as any[],
      (message) => {
        // Listen for CONTEST_ACTIVITY from contest topic
        if (message.type === 'DATA' && message.topic === 'contest' && message.action === 'CONTEST_ACTIVITY') {
          handleContestActivity(message.data);
        }
      },
      ['contest']
    );

    // Subscribe to topics
    console.log('[useContestLobbyWebSocket] About to subscribe to topics');
    subscribeToTopics();

    // Cleanup
    return () => {
      console.log('[useContestLobbyWebSocket] Cleaning up listeners');
      unregisterTrade();
      unregisterPortfolio();
      unregisterContest();
    };
  }, [contestId, ws.isConnected, ws.subscribe, ws.registerListener, onTradeExecuted, onPortfolioUpdate, onContestActivity, userWalletAddress]);

  return {
    isConnected: ws.isConnected
  };
}; 