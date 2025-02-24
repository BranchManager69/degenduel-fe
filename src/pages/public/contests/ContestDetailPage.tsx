// src/pages/public/ContestDetailPage.tsx

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { ContestDetailHeader } from "../../../components/contest-detail/ContestDetailHeader";
import { ContestRules } from "../../../components/contest-detail/ContestRules";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { Card, CardContent } from "../../../components/ui/Card";
import { CountdownTimer } from "../../../components/ui/CountdownTimer";
import { useAuth } from "../../../hooks/useAuth";
import {
  formatCurrency,
  isContestLive,
  mapContestStatus,
} from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import type { Contest as BaseContest } from "../../../types/index";

// TODO: move elsewhere
interface ContestParticipant {
  wallet_address?: string;
  address?: string;
  nickname?: string;
  username?: string;
  score?: number;
  profile?: {
    wallet_address?: string;
    nickname?: string;
  };
}

// TODO: move elsewhere
interface Participant {
  address: string;
  nickname: string;
  score?: number;
}

// TODO: move elsewhere
type Contest = Omit<BaseContest, "participants"> & {
  participants?: Participant[];
  max_prize_pool: number;
};

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { account, connected, connect, wallet } = useWallet();
  const { isFullyConnected, walletAddress } = useAuth();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Add a computed state for wallet connection that uses both sources
  const isWalletConnected = React.useMemo(() => {
    return connected && !!walletAddress;
  }, [connected, walletAddress]);

  useEffect(() => {
    console.log("Wallet State Changed:", {
      connected,
      wallet: wallet?.name,
      accountExists: !!account,
      accountAddress: account?.address,
      timestamp: new Date().toISOString(),
    });
  }, [connected, account, wallet]);

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
          "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
        );
        return;
      }

      const data = await ddApi.contests.getById(id);
      console.log("Contest data (detailed):", {
        participant_count: data.participant_count,
        contest_participants: data.contest_participants,
        raw_data: data,
      });

      // Ensure settings are properly initialized
      const sanitizedContest = {
        ...data,
        entry_fee:
          typeof data.entry_fee === "string"
            ? data.entry_fee
            : String(data.entry_fee),
        prize_pool:
          typeof data.prize_pool === "string"
            ? data.prize_pool
            : String(data.prize_pool),
        participant_count: Number(data.participant_count) || 0,
        start_time: data.start_time,
        end_time: data.end_time,
        settings: {
          ...data.settings,
          max_participants: Number(data.settings?.max_participants) || 0,
          token_types: Array.isArray(data.settings?.token_types)
            ? data.settings.token_types
            : [],
          rules: Array.isArray(data.settings?.rules) ? data.settings.rules : [],
          difficulty: data.settings?.difficulty || "guppy",
        },
        participants: Array.isArray(data.contest_participants)
          ? data.contest_participants.map(
              (p: ContestParticipant): Participant => {
                // Extract address from either the participant or nested user object
                const address =
                  p.wallet_address || p.profile?.wallet_address || "";
                // Extract nickname from either the participant or nested user object
                const nickname =
                  p.nickname ||
                  p.profile?.nickname ||
                  `${address.slice(0, 6)}...${address.slice(-4)}`;
                // Handle score if present
                const score = typeof p.score === "number" ? p.score : undefined;

                return {
                  address,
                  nickname,
                  score,
                };
              }
            )
          : [],
      };

      console.log(
        "Sanitized contest participants:",
        sanitizedContest.participants
      );

      // Check if current user is already participating
      if (walletAddress && Array.isArray(data.contest_participants)) {
        const userIsParticipating = data.contest_participants.some(
          (p: ContestParticipant) =>
            (p.wallet_address || p.address)?.toLowerCase() ===
            walletAddress.toLowerCase()
        );
        setIsParticipating(userIsParticipating);
      }

      setContest(sanitizedContest);
    } catch (err) {
      console.error("Error fetching duel:", err);
      // Check if the error is a 503 (maintenance mode)
      if (err instanceof Error && err.message.includes("503")) {
        setIsMaintenanceMode(true);
        setError(
          "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
        );
      } else {
        setError("Failed to load duel details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check for maintenance mode every 30 secs

    return () => clearInterval(maintenanceCheckInterval);
  }, [id, walletAddress]);

  const handleCountdownComplete = () => {
    if (!contest) return;

    if (isContestLive(contest)) {
      // Contest just ended
      setContest((prev: Contest | null) =>
        prev ? { ...prev, status: "completed" } : null
      );
    } else if (contest.status === "pending") {
      // Contest just started
      setContest((prev: Contest | null) =>
        prev ? { ...prev, status: "active" } : null
      );
    }
  };

  const handleJoinContest = () => {
    console.log("Join Duel Button Clicked - Initial State:", {
      isWalletConnected,
      isFullyConnected,
      walletAddress,
      isParticipating,
      contestId: contest?.id,
      timestamp: new Date().toISOString(),
    });

    if (!contest) {
      console.log("No data available on this duel. Please try again later.");
      return;
    }

    if (isParticipating) {
      console.log("User is already participating");
      setError("You are already entered in this duel.");
      return;
    }

    // Enhanced wallet connection check with logging
    if (!isFullyConnected) {
      console.log("Wallet Connection Check Failed:", {
        isWalletConnected,
        isFullyConnected,
        walletAddress,
        timestamp: new Date().toISOString(),
      });
      setError("Please connect your wallet to set your portfolio.");
      return;
    }

    console.log("Navigating to portfolio token selection page:", {
      contestId: contest.id,
      userAddress: walletAddress,
      timestamp: new Date().toISOString(),
    });

    navigate(`/contests/${contest.id}/select-tokens`);
  };

  if (isLoading)
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="bg-dark-200/50 backdrop-blur-sm border-dark-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream" />
                <CardContent className="p-6 relative">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                    <div className="h-6 bg-dark-300 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );

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

  if (error || !contest) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <span className="relative z-10">
              {error || "Contest not found"}
            </span>
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
          {/* Header */}
          <ContestDetailHeader
            contest={contest}
            isParticipating={isParticipating}
            isWalletConnected={isWalletConnected}
            onJoinContest={handleJoinContest}
            onCountdownComplete={handleCountdownComplete}
            isContestLive={isContestLive}
          />

          {/* Enhanced Stats Grid with Cyberpunk Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Entry Fee Card */}
            <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 relative">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-400 group-hover:text-brand-300 transition-colors mb-2">
                    Entry Fee
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x">
                      {formatCurrency(Number(contest.entry_fee))}
                    </span>
                    <span className="text-sm text-gray-400">per entry</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Max {contest.max_participants} entries per contest
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Pool Card */}
            <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 relative">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-400 group-hover:text-brand-300 transition-colors mb-2">
                    Estimated Prize Pool
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x">
                      {formatCurrency(Number(contest?.max_prize_pool || 0))}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-1 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
                          style={{
                            width: `${
                              (contest.participant_count /
                                contest.max_participants) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">
                        {contest.participant_count}/{contest.max_participants}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Prize pool grows as more players join
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Rules and Tokens in Parent Container */}
            <div className="lg:col-span-2">
              <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Rules Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">
                    Rules of the Duel
                  </h3>
                  {contest?.settings?.rules &&
                  contest.settings.rules.length > 0 ? (
                    <ContestRules rules={contest.settings.rules} />
                  ) : (
                    <p className="text-gray-400">
                      No rules in this duel; anything goes. It's every degen for
                      himself.
                    </p>
                  )}
                </div>

                {/* Token Whitelist Section */}
                <div>
                  <h3 className="text-xl font-bold text-gray-100 mb-4">
                    Token Whitelist
                  </h3>
                  {contest?.settings?.token_types &&
                  contest.settings.token_types.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {contest.settings.token_types.map((token: string) => (
                        <span
                          key={token}
                          className="px-3 py-1.5 bg-dark-300/50 text-sm text-gray-300 border-l border-brand-400/30 hover:border-brand-400/50 hover:text-brand-400 transition-all duration-300 transform hover:translate-x-1"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-gray-400">
                        Selection Restrictions: N/A
                      </p>
                      <p className="text-gray-400">
                        Allocation Constraints: N/A
                      </p>
                      <p className="text-gray-400">
                        Whitelisted Token List: All
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Prize Structure and Participants */}
            <div className="space-y-8">
              {/* Prize Structure */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
                <PrizeStructure prizePool={Number(contest?.prize_pool || 0)} />
              </div>

              {/* Participants List */}
              <div className="group relative">
                {Number(contest.participant_count) > 0 &&
                Array.isArray(contest.participants) ? (
                  contest.participants.length > 0 ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
                      <ParticipantsList
                        participants={contest.participants}
                        contestStatus={mapContestStatus(contest.status)}
                      />
                    </div>
                  ) : (
                    <div className="relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30">
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">
                          Duelers
                        </h3>
                        <p className="text-gray-400">
                          No duelers have entered yet.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-100 mb-4">
                        Duelers
                      </h3>
                      <p className="text-gray-400">No duelers yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 to-transparent z-20">
          <div className="max-w-md mx-auto">
            {wallet && !connected ? (
              <button
                onClick={() => connect(wallet.name)}
                className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold animate-pulse-slow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center justify-center gap-2">
                  <span className="font-medium">Connect Wallet</span>
                  <span>to Enter</span>
                </span>
              </button>
            ) : isParticipating ? (
              <button
                onClick={handleJoinContest}
                className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-dark-300/90 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center justify-center gap-2">
                  <span className="font-medium">Modify Portfolio</span>
                  <span className="text-brand-400">
                    {isContestLive(contest) ? "Ends" : "Starts"} in{" "}
                    <CountdownTimer
                      targetDate={
                        isContestLive(contest)
                          ? contest.end_time
                          : contest.start_time
                      }
                      onComplete={handleCountdownComplete}
                      showSeconds={true}
                    />
                  </span>
                </span>
              </button>
            ) : isWalletConnected ? (
              <button
                onClick={handleJoinContest}
                className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center justify-center gap-2">
                  <span className="font-medium">
                    Draft Tokens for Portfolio
                  </span>
                  <span>
                    {isContestLive(contest) ? "Ends" : "Starts"} in{" "}
                    <CountdownTimer
                      targetDate={
                        isContestLive(contest)
                          ? contest.end_time
                          : contest.start_time
                      }
                      onComplete={handleCountdownComplete}
                      showSeconds={true}
                    />
                  </span>
                </span>
              </button>
            ) : (
              <button
                onClick={handleJoinContest}
                className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/30 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold animate-pulse-slow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                <span className="relative flex items-center justify-center gap-2">
                  <span className="font-medium">Connect Wallet to Enter</span>
                </span>
              </button>
            )}
            {error && (
              <div className="mt-2 text-xs text-red-400 text-center animate-glitch bg-dark-100/95 rounded-lg py-2">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Action Button (FAB) */}
        <div className="fixed top-24 md:top-32 right-6 md:right-10 z-40">
          {wallet && !connected ? (
            <button
              onClick={() => connect(wallet.name)}
              className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-2xl shadow-brand-500/40 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-lg md:text-xl rounded-lg animate-pulse-slow transform hover:scale-105 transition-all duration-300 border-2 border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
              <span className="relative flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Connect Wallet to Enter</span>
                <svg
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </button>
          ) : isParticipating ? (
            <button
              onClick={handleJoinContest}
              className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-brand-500/30 bg-gradient-to-r from-brand-400 to-brand-500 text-white font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
              <span className="relative flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Modify Portfolio</span>
                <svg
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </button>
          ) : isWalletConnected ? (
            <div className="relative group">
              {/* Animated glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-cyber-400 rounded-lg blur opacity-75 group-hover:opacity-100 animate-pulse-slow"></div>
              <button
                onClick={handleJoinContest}
                className="relative flex items-center gap-2 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/10 shadow-2xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Draft Your Portfolio</span>
                <svg
                  className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
