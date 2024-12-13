import React from 'react';
import { useParams } from 'react-router-dom';
import { Leaderboard } from '../components/contests/Leaderboard';
import { PortfolioPerformance } from '../components/contests/PortfolioPerformance';
import { ContestTimer } from '../components/contests/ContestTimer';
import { TokenPerformance } from '../components/contests/TokenPerformance';
import { ContestDifficulty } from '../components/landing/contests/ContestDifficulty';
import { TestSkipButton } from '../components/contests/TestSkipButton';
import { formatCurrency } from '../lib/utils';

export const LiveContest: React.FC = () => {
  const { id } = useParams();

  // Placeholder contest data
  const contest = {
    id,
    title: 'Daily SOL Tournament',
    difficulty: 'dolphin' as const,
    prizePool: 5000,
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
  };

  // Placeholder portfolio data
  const portfolioData = {
    tokens: [
      {
        token: {
          name: 'Solana',
          symbol: 'SOL',
          price: 105.25,
        },
        amount: 10,
        initialValue: 1000,
        currentValue: 1052.50,
      },
      {
        token: {
          name: 'Bonk of America',
          symbol: 'BONKFA',
          price: 0.0075,
        },
        amount: 420.69,
        initialValue: 500,
        currentValue: 5000,
      },
    ],
    totalValue: 1367.50,
    totalChange: 7.2,
  };

  // Placeholder leaderboard data
  const leaderboardEntries = [
    { rank: 1, username: 'BranchManager69', portfolioValue: 69420, change24h: 420.7 },
    { rank: 2, username: 'realDonaldTrump', portfolioValue: 15100, change24h: 12.3 },
    { rank: 3, username: 'iEatAss_sn1p3z', portfolioValue: 12300, change24h: 8.7 },
    { rank: 4, username: 'YoWhoFknJ33T3D', portfolioValue: 6900, change24h: -5.2 },
    { rank: 5, username: 'sol_survivor', portfolioValue: 4200, change24h: -8.1 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{contest.title}</h1>
            <div className="flex items-center space-x-4">
              <ContestDifficulty difficulty={contest.difficulty} />
              <span className="text-gray-400">Prize Pool: {formatCurrency(contest.prizePool)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ContestTimer endTime={contest.endTime} />
            <TestSkipButton contestId={id!} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioPerformance {...portfolioData} />
          <Leaderboard
            entries={leaderboardEntries}
            currentUserRank={2}
          />
        </div>
        <div className="space-y-8">
          {portfolioData.tokens.map((tokenData) => (
            <TokenPerformance
              key={tokenData.token.symbol}
              {...tokenData}
            />
          ))}
        </div>
      </div>
    </div>
  );
};