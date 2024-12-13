import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ContestCardProps {
  id: string;
  title: string;
  timeInfo: string;
  prizePool: number;
  entryFee: number;
  players: number;
  maxPlayers: number;
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
  type: 'live' | 'upcoming';
}

const DIFFICULTY_CONFIG = {
  guppy: { label: 'Guppy', color: 'bg-green-500/20 text-green-300' },
  tadpole: { label: 'Tadpole', color: 'bg-emerald-500/20 text-emerald-300' },
  squid: { label: 'Squid', color: 'bg-yellow-500/20 text-yellow-300' },
  dolphin: { label: 'Dolphin', color: 'bg-orange-500/20 text-orange-300' },
  shark: { label: 'Shark', color: 'bg-red-500/20 text-red-300' },
  whale: { label: 'Whale', color: 'bg-purple-500/20 text-purple-300' },
};

export const ContestCard: React.FC<ContestCardProps> = ({
  id,
  title,
  timeInfo,
  prizePool,
  entryFee,
  players,
  maxPlayers,
  difficulty,
  type,
}) => {
  const isLive = type === 'live';
  const progress = (players / maxPlayers) * 100;
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 transform transition-all hover:scale-105">
      <CardHeader className="border-b border-dark-300">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-100 truncate pr-2">
              {title}
            </h3>
            <p className="text-sm text-gray-400">{timeInfo}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${difficultyConfig.color}`}>
            {difficultyConfig.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Prize Pool</span>
            <span className="text-lg font-bold text-brand-400">
              {formatCurrency(prizePool)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Entry Fee</span>
            <span className="font-medium text-gray-300">
              {formatCurrency(entryFee)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Players</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-sm font-medium text-gray-300">
                {players}/{maxPlayers}
              </span>
            </div>
          </div>
        </div>
        <Link to={`/contests/${id}`} className="block mt-4">
          <Button 
            className="w-full group relative overflow-hidden bg-brand-600 hover:bg-brand-700"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 bg-white/10 rotate-45 transform translate-x-32 group-hover:translate-x-48 transition-transform duration-500" />
            </div>
            <span className="relative flex items-center justify-center font-medium">
              {isLive ? 'Spectate' : 'Play'}
              <svg 
                className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};