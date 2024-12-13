import React from 'react';
import { ContestCard } from '../ContestCard';
//import { Contest } from '../../../types';  // Remove if unused

interface ContestListProps {
  contests: Array<{
    id: string;
    name: string;
    entryFee: number;
    prizePool: number;
    startTime: Date;
    endTime: Date;
    participants: number;
    maxParticipants: number;
    status: 'open' | 'in_progress' | 'completed';
    difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
  }>;
  type: 'live' | 'upcoming';
}

export const ContestList: React.FC<ContestListProps> = ({ contests, type }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {contests.map((contest) => (
        <ContestCard
          key={contest.id}
          {...contest}
          type={type}
        />
      ))}
    </div>
  );
};