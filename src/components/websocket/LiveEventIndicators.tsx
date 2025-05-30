// src/components/websocket/LiveEventIndicators.tsx

import React from 'react';
import { useContestLifecycle, useUserEvents } from '../../hooks/websocket';

/**
 * Example component showing how to use the new WebSocket event hooks
 * This can be placed anywhere in the app to show live updates
 */
export const LiveEventIndicators: React.FC = () => {
  // Contest lifecycle events
  const contestLifecycle = useContestLifecycle({
    onNewContest: (contest) => {
      console.log('🎉 New contest created:', contest.name);
      // Could show toast notification here
    },
    onContestStarted: (contestId) => {
      console.log('🚀 Contest started:', contestId);
      // Could update contest status in UI
    },
    onContestEnded: (contestId, winnerId) => {
      console.log('🏁 Contest ended:', contestId, 'Winner:', winnerId);
      // Could show results modal
    }
  });

  // User achievement events  
  const userEvents = useUserEvents({
    onAchievementUnlocked: (achievement) => {
      console.log('🏆 Achievement unlocked:', achievement.title);
      // Could show achievement popup
    },
    onLevelUp: (levelUp) => {
      console.log('⬆️ Level up!', `${levelUp.oldLevel} → ${levelUp.newLevel}`);
      // Could show level up animation
    },
    onTradeConfirmed: (trade, type) => {
      console.log(`💰 ${type} confirmed:`, trade);
      // Could show trade confirmation toast
    }
  });

  if (!contestLifecycle.connected && !userEvents.connected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {/* New Contest Indicator */}
      {contestLifecycle.newContests.length > 0 && (
        <div className="bg-brand-500/90 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold">🎉 New Contest!</div>
          <div className="text-xs">{contestLifecycle.newContests[0].name}</div>
        </div>
      )}

      {/* Achievement Indicator */}
      {userEvents.unreadAchievements.length > 0 && (
        <div className="bg-yellow-500/90 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold">🏆 Achievement!</div>
          <div className="text-xs">{userEvents.unreadAchievements[0].data.title}</div>
        </div>
      )}

      {/* Recent Level Up */}
      {userEvents.recentLevelUps.length > 0 && (
        <div className="bg-purple-500/90 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold">⬆️ Level Up!</div>
          <div className="text-xs">Level {userEvents.recentLevelUps[0].data.newLevel}</div>
        </div>
      )}

      {/* Recent Trade */}
      {userEvents.recentTrades.length > 0 && (
        <div className="bg-green-500/90 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold">💰 Trade Confirmed</div>
          <div className="text-xs">
            {userEvents.recentTrades[0].data.tokenSymbol} • ${userEvents.recentTrades[0].data.totalValue}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveEventIndicators;