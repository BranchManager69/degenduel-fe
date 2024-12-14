import React from 'react';
import { Contest } from '../../types/contests';

interface ContestSectionProps {
  title: string;
  type: 'live' | 'upcoming';
  contests: Contest[];
  loading: boolean;
}

export const ContestSection: React.FC<ContestSectionProps> = ({ 
  title, 
  type, 
  contests, 
  loading 
}) => {
  if (loading) {
    return <div>Loading contests...</div>;
  }

  return (
    <div className="py-8">
      <h2 className={`text-2xl font-bold mb-4 ${
        type === 'live' ? 'text-green-500' : 'text-blue-500'
      }`}>
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contests.map(contest => (
          <div 
            key={contest.id} 
            className={`bg-dark-200 p-4 rounded-lg border-2 ${
              type === 'live' 
                ? 'border-green-500/20' 
                : 'border-blue-500/20'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{contest.name}</h3>
              <span className={`text-sm px-2 py-1 rounded ${
                type === 'live' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {type === 'live' ? 'Live' : 'Upcoming'}
              </span>
            </div>
            <p>Prize Pool: {contest.prizePool}</p>
            <p>Entry Fee: {contest.entryFee}</p>
            <p>Participants: {contest.participants}/{contest.maxParticipants}</p>
          </div>
        ))}
      </div>
    </div>
  );
};