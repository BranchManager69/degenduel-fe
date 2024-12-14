import React from 'react';
import { Contest } from '../../types/contests';

interface LiveContestTickerProps {
  contests: Contest[];
  loading: boolean;
}

export const LiveContestTicker: React.FC<LiveContestTickerProps> = ({ contests, loading }) => {
  if (loading) {
    return <div className="bg-dark-200 p-4">Loading contests...</div>;
  }

  return (
    <div className="bg-dark-200 p-4">
      {/* Your existing ticker implementation */}
      {contests.map(contest => (
        <div key={contest.id}>
          {contest.name} - Prize Pool: {contest.prizePool}
        </div>
      ))}
    </div>
  );
};