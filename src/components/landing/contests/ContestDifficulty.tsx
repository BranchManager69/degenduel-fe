import React from 'react';

export type DifficultyLevel = 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';

export const DIFFICULTY_CONFIG = {
  guppy: { label: 'Guppy', color: 'bg-green-500/20 text-green-300' },
  tadpole: { label: 'Tadpole', color: 'bg-emerald-500/20 text-emerald-300' },
  squid: { label: 'Squid', color: 'bg-yellow-500/20 text-yellow-300' },
  dolphin: { label: 'Dolphin', color: 'bg-orange-500/20 text-orange-300' },
  shark: { label: 'Shark', color: 'bg-red-500/20 text-red-300' },
  whale: { label: 'Whale', color: 'bg-purple-500/20 text-purple-300' },
} as const;

interface ContestDifficultyProps {
  difficulty: DifficultyLevel;
}

export const ContestDifficulty: React.FC<ContestDifficultyProps> = ({ difficulty }) => {
  const config = DIFFICULTY_CONFIG[difficulty];
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
      {config.label}
    </span>
  );
};