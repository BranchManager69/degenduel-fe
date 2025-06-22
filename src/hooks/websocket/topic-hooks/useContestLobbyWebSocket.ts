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
    if (!contestId || !ws.isConnected) return;

    // Subscribe to relevant topics
    const subscribeToTopics = () => {
      ws.subscribe(['contest', 'contest-participants', 'portfolio', 'market_data']);
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
        if (message.type === 'TRADE_EXECUTED' || (message.type === 'DATA' && message.subtype === 'TRADE_EXECUTED')) {
          handleTradeExecuted(message);
        }
      },
      ['contest', 'portfolio']
    );

    const unregisterPortfolio = ws.registerListener(
      `contest-portfolio-${contestId}`,
      ['DATA'] as any[],
      (message) => {
        if (message.type === 'PORTFOLIO_UPDATED' || (message.type === 'DATA' && message.subtype === 'PORTFOLIO_UPDATED')) {
          handlePortfolioUpdate(message);
        }
      },
      ['portfolio']
    );

    const unregisterContest = ws.registerListener(
      `contest-activity-${contestId}`,
      ['DATA'] as any[],
      (message) => {
        if (message.type === 'CONTEST_ACTIVITY' || (message.type === 'DATA' && message.data?.type === 'CONTEST_ACTIVITY')) {
          handleContestActivity(message.data || message);
        }
      },
      ['contest']
    );

    // Subscribe to topics
    subscribeToTopics();

    // Cleanup
    return () => {
      unregisterTrade();
      unregisterPortfolio();
      unregisterContest();
    };
  }, [contestId, ws.isConnected, ws.subscribe, ws.registerListener, onTradeExecuted, onPortfolioUpdate, onContestActivity, userWalletAddress]);

  return {
    isConnected: ws.isConnected
  };
}; 