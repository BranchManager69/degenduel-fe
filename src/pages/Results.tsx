import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FinalLeaderboard } from '../components/results/FinalLeaderboard';
import { PerformanceChart } from '../components/results/PerformanceChart';
import { TokenPerformance } from '../components/results/TokenPerformance';
import { CelebrationOverlay } from '../components/results/CelebrationOverlay';

export const Results: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Simulated random result when using test skip button
  const randomResult = Math.random() > 0.5 ? 1.5 : 0.5; // 50% chance of win/loss

  // Placeholder contest data
  const contest = {
    id,
    title: 'Daily SOL Tournament',
    initialPortfolioValue: 1000,
    finalPortfolioValue: Math.round(1000 * randomResult), // Random win/loss
  };

  const leaderboardEntries = [
    {
      rank: 1,
      username: 'crypto_king',
      finalValue: 12750,
      totalReturn: 27.5,
      prize: 500,
    },
    {
      rank: 2,
      username: 'moon_walker',
      finalValue: 11800,
      totalReturn: 18.0,
      prize: 300,
    },
    {
      rank: 3,
      username: 'hodl_master',
      finalValue: 11200,
      totalReturn: 12.0,
      prize: 200,
    },
    {
      rank: 4,
      username: 'degen_trader',
      finalValue: 9800,
      totalReturn: -2.0,
      prize: 0,
    },
  ];

  const performanceData = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value: contest.initialPortfolioValue + (contest.finalPortfolioValue - contest.initialPortfolioValue) * (i / 23),
  }));

  const tokenResults = [
    {
      symbol: 'SOL',
      name: 'Solana',
      initialValue: 1000,
      finalValue: contest.finalPortfolioValue * 0.6,
      change: ((contest.finalPortfolioValue * 0.6) / 600 - 1) * 100,
      contribution: 60,
    },
    {
      symbol: 'RAY',
      name: 'Raydium',
      initialValue: 500,
      finalValue: contest.finalPortfolioValue * 0.4,
      change: ((contest.finalPortfolioValue * 0.4) / 400 - 1) * 100,
      contribution: 40,
    },
  ];

  return (
    <>
      <CelebrationOverlay 
        initialValue={contest.initialPortfolioValue} 
        finalValue={contest.finalPortfolioValue}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Contest Results</h1>
              <p className="text-gray-400 mt-2">
                Contest completed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button 
              variant="gradient" 
              onClick={() => navigate('/contests')}
            >
              Join New Contest
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <FinalLeaderboard
              entries={leaderboardEntries}
              currentUserRank={2}
            />
            <PerformanceChart data={performanceData} />
          </div>
          <div className="space-y-8">
            {tokenResults.map((token) => (
              <TokenPerformance key={token.symbol} {...token} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};