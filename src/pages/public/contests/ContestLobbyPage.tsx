// src/pages/public/contests/ContestLobbyPage.tsx

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { ContestTimer } from "../../../components/contest-lobby/ContestTimer";
import { Leaderboard } from "../../../components/contest-lobby/Leaderboard";
import { PortfolioPerformance } from "../../../components/contest-lobby/PortfolioPerformance";
import { TestSkipButton } from "../../../components/contest-lobby/TestSkipButton";
import { TokenPerformance } from "../../../components/contest-lobby/TokenPerformance";
import { ContestDifficulty } from "../../../components/landing/contests-preview/ContestDifficulty";
import { formatCurrency, isContestLive } from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import { Contest as BaseContest } from "../../../types";

// Contest Lobby page
export const ContestLobby: React.FC = () => {
  // Get the contest ID from the URL
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realContest, setRealContest] = useState<BaseContest | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Fetch contest data from API
  useEffect(() => {
    const fetchContest = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        // First check maintenance mode
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch contest
        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
          );
          return;
        }

        const data = await ddApi.contests.getById(id);
        console.log("Contest data (lobby):", data);
        setRealContest(data);
      } catch (err) {
        console.error("Failed to fetch contest:", err);
        // Check if the error is a 503 (maintenance mode)
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
          );
        } else {
          setError("Failed to load contest details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  // Derived contest data with proper types
  const contest = {
    id,
    title: realContest?.name || "Loading Contest...",
    difficulty: (realContest?.settings?.difficulty || "guppy") as
      | "guppy"
      | "tadpole"
      | "squid"
      | "dolphin"
      | "shark"
      | "whale",
    prizePool: Number(realContest?.prize_pool || 0),
    endTime: realContest
      ? new Date(realContest.end_time)
      : new Date(Date.now() + 3600000),
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-dark-200/50 rounded-lg w-3/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
                <div className="h-96 bg-dark-200/50 rounded-lg"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <span className="animate-pulse">⚠</span>
              <span>
                DegenDuel is undergoing scheduled maintenance ⚙️ Try again
                later.
              </span>
              <span className="animate-pulse">⚠</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb navigation */}
          <div className="mb-4 flex items-center text-sm text-gray-400">
            <Link to="/" className="hover:text-brand-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">›</span>
            <Link
              to="/contests"
              className="hover:text-brand-400 transition-colors"
            >
              Contests
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-300">{contest.title}</span>
          </div>

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
                  {/* Contest Status */}
                  {realContest && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        isContestLive(realContest)
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : new Date() < new Date(realContest.start_time)
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {isContestLive(realContest)
                        ? "Live Now"
                        : new Date() < new Date(realContest.start_time)
                          ? "Upcoming"
                          : "Ended"}
                    </span>
                  )}

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
              <div className="flex flex-col items-end space-y-2">
                {/* Timer Label */}
                {realContest && (
                  <div className="text-right">
                    <span className="text-sm text-gray-400">
                      {isContestLive(realContest)
                        ? "Contest Ends In:"
                        : new Date() < new Date(realContest.start_time)
                          ? "Contest Starts In:"
                          : "Contest Ended On:"}
                    </span>
                  </div>
                )}

                {/* Contest Timer */}
                <div className="relative group">
                  <ContestTimer
                    endTime={contest.endTime}
                    showDate={
                      !!(
                        realContest &&
                        new Date() > new Date(realContest.end_time)
                      )
                    }
                  />
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
      </div>
    </div>
  );
};
