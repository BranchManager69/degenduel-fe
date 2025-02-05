// src/pages/authenticated/LiveContest.tsx

import React from "react";
import { useParams } from "react-router-dom";
import { ContestTimer } from "../../components/contests/ContestTimer";
import { Leaderboard } from "../../components/contests/Leaderboard";
import { PortfolioPerformance } from "../../components/contests/PortfolioPerformance";
import { TestSkipButton } from "../../components/contests/TestSkipButton";
import { TokenPerformance } from "../../components/contests/TokenPerformance";
import { ContestDifficulty } from "../../components/landing/contests/ContestDifficulty";
import { formatCurrency } from "../../lib/utils";

/*
 * THIS PAGE IS ONE OF THE OLDEST PAGES IN THE APP.
 * IT IS OLD AND NEEDS A HUGE OVERHAUL FOR REAL DATA!
 */

// Live contest page
export const LiveContest: React.FC = () => {
  // Get the contest ID from the URL
  const { id } = useParams();
  // Should be getting contest data from the API using just the id

  /*
   * THE BELOW PLACEHOLDER DATA SHOULDN'T EVEN BE HERE!
   * ALWAYS USE REAL DATA.
   */
  // Placeholder contest data
  const contest = {
    id,
    title: "DEBUG CONTEST NAME",
    difficulty: "dolphin" as const,
    prizePool: 666666,
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
  };
  // Placeholder portfolio data
  const portfolioData = {
    tokens: [
      {
        token: {
          name: "Solana",
          symbol: "SOL",
          price: 105.25,
        },
        amount: 10,
        initialValue: 1000,
        currentValue: 1052.5,
      },
      {
        token: {
          name: "Bonk of America",
          symbol: "BONKFA",
          price: 0.0075,
        },
        amount: 420.69,
        initialValue: 500,
        currentValue: 5000,
      },
    ],
    totalValue: 1367.5,
    totalChange: 7.2,
  };
  // Placeholder leaderboard data
  const leaderboardEntries = [
    {
      rank: 1,
      username: "DebugManager69",
      portfolioValue: 69420,
      change24h: 420.7,
    },
    {
      rank: 2,
      username: "realDonaldTrump",
      portfolioValue: 15100,
      change24h: 12.3,
    },
    {
      rank: 3,
      username: "iEatAss_sn1p3z",
      portfolioValue: 12300,
      change24h: 8.7,
    },
    {
      rank: 4,
      username: "YoWhoFknJ33T3D",
      portfolioValue: 6900,
      change24h: -5.2,
    },
    {
      rank: 5,
      username: "sol_survivor",
      portfolioValue: 4200,
      change24h: -8.1,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header Section */}
      <div className="mb-8 relative group">
        <div className="flex items-center justify-between mb-4">
          <div>
            {/* Contest Title */}
            <h1 className="text-3xl font-bold text-gray-100 mb-2 relative group-hover:animate-glitch">
              {contest.title}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            </h1>
            <div className="flex items-center space-x-4">
              {/* Contest Difficulty */}
              <ContestDifficulty difficulty={contest.difficulty} />
              <span className="text-gray-400 group-hover:text-brand-400 transition-colors">
                {/* Prize Pool */}
                Prize Pool:{" "}
                <span className="text-brand-400 group-hover:animate-neon-flicker">
                  {formatCurrency(contest.prizePool)}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Contest Timer */}
            <div className="relative group">
              <ContestTimer endTime={contest.endTime} />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {/* Test Skip Button */}
            <TestSkipButton contestId={id!} />
          </div>
        </div>
      </div>

      {/* Enhanced Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Portfolio Performance with enhanced animations */}
          <div className="relative group overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <PortfolioPerformance {...portfolioData} />
          </div>

          {/* Leaderboard with enhanced animations */}
          <div className="relative group overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Leaderboard entries={leaderboardEntries} currentUserRank={2} />
          </div>
        </div>

        {/* Token Performance Cards with enhanced animations */}
        <div className="space-y-8">
          {portfolioData.tokens.map((tokenData) => (
            <div
              key={tokenData.token.symbol}
              className="relative group overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <TokenPerformance {...tokenData} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
