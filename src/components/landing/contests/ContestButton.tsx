import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

interface ContestButtonProps {
  id: number;
  type: 'live' | 'upcoming';
}

export const ContestButton: React.FC<ContestButtonProps> = ({ id, type }) => {
  const isLive = type === 'live';

  return (
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
  );
};