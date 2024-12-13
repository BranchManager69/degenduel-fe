import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative pt-20 pb-16 text-center">
      <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl mb-6">
        <span className="block mb-2">Welcome to</span>
        <span className="block bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text pb-2">
          DegenDuel
        </span>
      </h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        Compete in trading contests with Solana tokens. Build your portfolio, challenge other players, and climb the leaderboard!
      </p>
      <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center">
        <div className="rounded-md shadow">
          <Link to="/contests">
            <Button size="lg" className="bg-brand-600 hover:bg-brand-700">
              Browse Contests
            </Button>
          </Link>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-3">
          <Link to="/how-it-works">
            <Button variant="outline" size="lg" className="text-gray-300 border-gray-700 hover:bg-dark-200">
              How It Works
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};