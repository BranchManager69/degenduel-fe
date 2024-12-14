import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MovingBackground } from '../components/ui/MovingBackground';
import { LiveContestTicker } from '../components/ui/LiveContestTicker';
import { Features } from '../components/landing/Features';
import { ContestSection } from '../components/landing/ContestSection';
import { api } from '../services/api';
import { Contest } from '../types/contests';

export const LandingPage: React.FC = () => {
  const [liveContests, setLiveContests] = useState<Contest[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const contests = await api.contests.getActive();
        
        // Split contests into live and upcoming based on start time
        const now = new Date();
        const live = contests.filter((contest: Contest) => 
          new Date(contest.startTime) <= now && new Date(contest.endTime) > now
        );
        const upcoming = contests.filter((contest: Contest) => 
          new Date(contest.startTime) > now
        );

        setLiveContests(live);
        setUpcomingContests(upcoming);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-100 text-gray-100">
      <MovingBackground />
      
      {/* Live Contest Ticker at the top */}
      <div className="sticky top-16 z-10">
        <LiveContestTicker 
          contests={liveContests} 
          loading={loading} 
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
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

        {/* Features Section */}
        <Features />

        {/* Contest Sections */}
        {error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <>
            <ContestSection 
              title="Live Contests" 
              type="live" 
              contests={liveContests}
              loading={loading}
            />
            <ContestSection 
              title="Upcoming Contests" 
              type="upcoming" 
              contests={upcomingContests}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};