import React from 'react';
import type { Contest } from '../../services/api';

interface Props {
  contests: Contest[];
  loading: boolean;
}

export const LiveContestTicker: React.FC<Props> = ({ contests, loading }) => {
  if (loading) {
    return (
      <div className="bg-dark-200 p-2">
        <div className="animate-pulse h-6 bg-dark-300 rounded"></div>
      </div>
    );
  }

  if (contests.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-200 p-2 overflow-hidden">
      <div className="animate-scroll-x flex space-x-8">
        {contests.map((contest) => (
          <div key={contest.id} className="flex items-center space-x-2 text-sm">
            <span className="text-brand-400">LIVE:</span>
            <span className="font-medium">{contest.name}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">{contest.participants}/{contest.maxParticipants} Players</span>
            <span className="text-gray-400">•</span>
            <span className="text-brand-300">{contest.prizePool} SOL Prize Pool</span>
          </div>
        ))}
      </div>
    </div>
  );
};