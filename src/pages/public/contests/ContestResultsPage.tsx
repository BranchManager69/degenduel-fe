// src/pages/public/contests/ContestResultsPage.tsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CelebrationOverlay } from "../../../components/results/CelebrationOverlay";
import { FinalLeaderboard } from "../../../components/results/FinalLeaderboard";
import { PerformanceChart } from "../../../components/results/PerformanceChart";
import { TokenPerformance } from "../../../components/results/TokenPerformance";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

/*
 * THIS PAGE IS ONE OF THE OLDEST PAGES IN THE APP.
 * IT IS OLD AND NEEDS A HUGE OVERHAUL FOR REAL DATA!
 */

// Contests Results page
export const ContestResults: React.FC = () => {
  // Use the navigate function to go back to the contests page
  const navigate = useNavigate();

  // Get the contest ID from the URL
  const { id } = useParams();
  // Should be getting contest data from the API using just the id

  /*
   * THE BELOW PLACEHOLDER DATA SHOULDN'T EVEN BE HERE!
   * ALWAYS USE REAL DATA.
   */
  // Placeholder simulated random result when using test skip button
  const randomResult = Math.random() > 0.5 ? 1.5 : 0.5; // 50% chance of win/loss
  // Placeholder contest data
  const contest = {
    id,
    title: "Daily SOL Tournament",
    initialPortfolioValue: 1000,
    finalPortfolioValue: Math.round(1000 * randomResult), // Random win/loss
  };
  // Placeholder leaderboard entries
  const leaderboardEntries = [
    {
      rank: 1,
      username: "crypto_king",
      finalValue: 12750,
      totalReturn: 27.5,
      prize: 500,
    },
    {
      rank: 2,
      username: "moon_walker",
      finalValue: 11800,
      totalReturn: 18.0,
      prize: 300,
    },
    {
      rank: 3,
      username: "hodl_master",
      finalValue: 11200,
      totalReturn: 12.0,
      prize: 200,
    },
    {
      rank: 4,
      username: "degen_trader",
      finalValue: 9800,
      totalReturn: -2.0,
      prize: 0,
    },
  ];
  // Placeholder performance data
  const performanceData = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value:
      contest.initialPortfolioValue +
      (contest.finalPortfolioValue - contest.initialPortfolioValue) * (i / 23),
  }));
  // Placeholder token results
  const tokenResults = [
    {
      symbol: "SOL",
      name: "Solana",
      initialValue: 1000,
      finalValue: contest.finalPortfolioValue * 0.6,
      change: ((contest.finalPortfolioValue * 0.6) / 600 - 1) * 100,
      contribution: 60,
    },
    {
      symbol: "RAY",
      name: "Raydium",
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

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 group-hover:animate-glitch">
                Contest Results
              </h1>
              <p className="text-gray-400 mt-2 group-hover:animate-cyber-pulse">
                Contest completed on {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={() => navigate("/contests")}
              className="relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <span className="relative flex items-center font-medium group-hover:animate-glitch">
                Join New Contest
                <svg
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Leaderboard and Chart */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard Card */}
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
              <div className="p-6 relative">
                <FinalLeaderboard
                  entries={leaderboardEntries}
                  currentUserRank={2}
                />
              </div>
            </Card>

            {/* Performance Chart Card */}
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
              <div className="p-6 relative">
                <h2 className="text-xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
                  Performance Chart
                </h2>
                <PerformanceChart data={performanceData} />
              </div>
            </Card>
          </div>

          {/* Right Column - Token Performance */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
              Token Performance
            </h2>
            {tokenResults.map((token) => (
              <Card
                key={token.symbol}
                className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
                <div className="p-6 relative">
                  <TokenPerformance {...token} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
