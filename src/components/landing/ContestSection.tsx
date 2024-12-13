import React from 'react';
import { ContestCard } from './ContestCard';

interface ContestSectionProps {
  title: string;
  type: 'live' | 'upcoming';
}

export const ContestSection: React.FC<ContestSectionProps> = ({ title, type }) => {
  const contests = type === 'live' 
    ? [
        {
          id: '1',
          name: 'SOL Masters Tournament',
          entryFee: 50,
          prizePool: 5000,
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() + 3600000),
          participants: 45,
          maxParticipants: 100,
          status: 'in_progress' as const,
          difficulty: 'dolphin' as const,
          type: 'live' as const,
        },
        {
          id: '2',
          name: 'Weekly Crypto Challenge',
          entryFee: 100,
          prizePool: 10000,
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() + 7200000),
          participants: 75,
          maxParticipants: 150,
          status: 'in_progress' as const,
          difficulty: 'shark' as const,
          type: 'live' as const,
        },
        {
          id: '3',
          name: 'Meme Token Madness',
          entryFee: 25,
          prizePool: 2500,
          startTime: new Date(Date.now() - 1800000),
          endTime: new Date(Date.now() + 1800000),
          participants: 30,
          maxParticipants: 50,
          status: 'in_progress' as const,
          difficulty: 'guppy' as const,
          type: 'live' as const,
        },
      ]
    : [
        {
          id: '4',
          name: 'Weekend Warriors Cup',
          entryFee: 75,
          prizePool: 7500,
          startTime: new Date(Date.now() + 14400000),
          endTime: new Date(Date.now() + 28800000),
          participants: 25,
          maxParticipants: 100,
          status: 'open' as const,
          difficulty: 'squid' as const,
          type: 'upcoming' as const,
        },
        {
          id: '5',
          name: 'DeFi Champions League',
          entryFee: 150,
          prizePool: 15000,
          startTime: new Date(Date.now() + 28800000),
          endTime: new Date(Date.now() + 43200000),
          participants: 40,
          maxParticipants: 200,
          status: 'open' as const,
          difficulty: 'whale' as const,
          type: 'upcoming' as const,
        },
        {
          id: '6',
          name: 'Altcoin Adventure',
          entryFee: 30,
          prizePool: 3000,
          startTime: new Date(Date.now() + 43200000),
          endTime: new Date(Date.now() + 57600000),
          participants: 15,
          maxParticipants: 75,
          status: 'open' as const,
          difficulty: 'tadpole' as const,
          type: 'upcoming' as const,
        },
      ];

  return (
    <div className="py-16">
      <h2 className="text-3xl font-bold mb-8 text-gray-100">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <ContestCard
            key={contest.id}
            {...contest}
          />
        ))}
      </div>
    </div>
  );
};