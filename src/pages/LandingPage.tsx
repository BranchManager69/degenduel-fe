import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MovingBackground } from '../components/ui/MovingBackground';
import { LiveContestTicker } from '../components/ui/LiveContestTicker';
import { Features } from '../components/landing/Features';
import { ContestSection } from '../components/landing/ContestSection';
import { api } from '../services/api';
import type { Contest } from '../types';
import { isContestLive } from '../lib/utils';

// Define contest filter functions
const isPendingContest = (contest: Contest): boolean => contest.status === 'pending';

export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const contests = await api.contests.getActive();
        
        // Use the predefined filter functions
        const active = contests.filter(isContestLive);
        const open = contests.filter(isPendingContest);
        
        setActiveContests(active);
        setOpenContests(open);
      } catch (error) {
        console.error('Error fetching contests:', error);
        setError('Failed to load contests');
      } finally {
        setLoading(false);
      }
    };
  
    fetchContests();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-100 text-gray-100">
      <MovingBackground />
      
      <div className="sticky top-16 z-10">
        <LiveContestTicker 
          contests={activeContests} 
          loading={loading} 
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative pt-20 pb-16 text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl mb-6">
            <span className="block mb-2">This is</span>
            <span className="block bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text pb-2">
              DegenDuel.
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Compete in trading competitions against schizo degens and based chads. Build your stack, challenge other degens, and win some SOL.
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

        <Features />

        {error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <>
            <ContestSection 
              title="Live Contests" 
              type="active"
              contests={activeContests}
              loading={loading}
            />
            <ContestSection 
              title="Upcoming Contests" 
              type="pending"
              contests={openContests}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};