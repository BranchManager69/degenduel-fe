import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';

interface Contest {
  id: string;
  name: string;
  prizePool: number;
  timeLeft: string;
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
}

const DIFFICULTY_COLORS = {
  guppy: 'bg-green-500/20 text-green-300',
  tadpole: 'bg-emerald-500/20 text-emerald-300',
  squid: 'bg-yellow-500/20 text-yellow-300',
  dolphin: 'bg-orange-500/20 text-orange-300',
  shark: 'bg-red-500/20 text-red-300',
  whale: 'bg-purple-500/20 text-purple-300',
};

export const LiveContestTicker: React.FC = () => {
  // Placeholder data
  const contests: Contest[] = [
    { id: '1', name: 'SOL Masters Tournament', prizePool: 5000, timeLeft: '2h 15m', difficulty: 'dolphin' },
    { id: '2', name: 'Weekly Crypto Challenge', prizePool: 10000, timeLeft: '5h 30m', difficulty: 'shark' },
    { id: '3', name: 'Meme Token Madness', prizePool: 2500, timeLeft: '1h 45m', difficulty: 'guppy' },
    { id: '4', name: 'DeFi Champions League', prizePool: 7500, timeLeft: '3h 20m', difficulty: 'whale' },
    { id: '5', name: 'NFT Traders Cup', prizePool: 3000, timeLeft: '4h 10m', difficulty: 'squid' },
  ];

  return (
    <div className="w-full bg-dark-200/50 backdrop-blur-sm border-y border-dark-300">
      <div className="relative h-12 overflow-hidden">
        <div className="absolute flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[...contests, ...contests].map((contest, index) => (
            <Link
              key={`${contest.id}-${index}`}
              to={`/contests/${contest.id}`}
              className="flex items-center px-4"
            >
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${DIFFICULTY_COLORS[contest.difficulty]}`}>
                <span className="font-medium">{contest.name}</span>
              </div>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-brand-400 font-medium">{formatCurrency(contest.prizePool)}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-gray-300">Ends in {contest.timeLeft}</span>
              <span className="text-dark-300 mx-6">|</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};