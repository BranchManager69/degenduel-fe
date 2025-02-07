// src/pages/public/ContestDetailPage.tsx

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ContestRules } from "../../../components/contests/detail/ContestRules";
import { ParticipantsList } from "../../../components/contests/detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contests/detail/PrizeStructure";
import { ContestDifficulty } from "../../../components/landing/contests/ContestDifficulty";
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
  const { isWalletConnected, isFullyConnected, walletAddress } = useAuth();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Force wallet connection check on mount and when wallet state changes
  useEffect(() => {
    const checkWallet = async () => {
      console.log("Checking wallet connection:", {
        connected: isWalletConnected,
        walletAddress,
        isFullyConnected,
        timestamp: new Date().toISOString(),
      });

      // Only attempt reconnection if we have a wallet but aren't connected
      if (!isWalletConnected && wallet) {
        try {
          console.log("Attempting to reconnect wallet:", wallet.name);
          await connect(wallet.name);
        } catch (err) {
          console.error("Failed to reconnect wallet:", err);
          setError(
            "Failed to reconnect wallet. Please try connecting, umm, manually, I guess?"
          );
        }
      }
    };

    checkWallet();
  }, [isWalletConnected, wallet, connect, walletAddress]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    );

  if (isMaintenanceMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span className="animate-pulse">⚠</span>
            <span>
              DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.
            </span>
            <span className="animate-pulse">⚠</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <span className="relative z-10">{error || "Contest not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header w/ Cyberpunk Theme */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/50">
          <div className="space-y-2 flex-1">
            {/* Contest title */}
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x">
              {contest.name}
            </h1>
            {/* Contest description */}
            <p className="text-lg text-gray-400 max-w-2xl">
              {contest.description}
            </p>
          </div>
          {/* Contest Style Badge (was previously difficulty) */}
          <div className="flex-shrink-0">
            <ContestDifficulty
              difficulty={contest.settings.difficulty || "guppy"}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Cyberpunk Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Entry Fee Card */}
        <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Entry Fee
              </span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x">
                {formatCurrency(Number(contest.entry_fee))}
              </span>
            </div>
          </div>
        </div>

        {/* Prize Pool Card */}
        <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Estimated Prize Pool
              </span>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x">
                {formatCurrency(Number(contest?.max_prize_pool || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Timer Card */}
        <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                {isContestLive(contest) ? "Ends In" : "Starts In"}
              </span>
              <span className="text-xl font-bold text-brand-400 group-hover:animate-pulse">
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
            </div>
          </div>
        </div>

        {/* Players Card */}
        <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 hover:border-brand-400/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Duelers
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-dark-300 overflow-hidden transform skew-x-[-15deg]">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300 ease-out group-hover:animate-pulse"
                    style={{
                      width: `${
                        (Number(contest.participant_count) /
                          contest.max_participants) *
                        100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>
                <span className="text-lg font-medium text-gray-300">
                  {contest.participant_count}/{contest.max_participants}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Rules and Tokens */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rules Section */}
          {contest?.settings?.rules && contest.settings.rules.length > 0 ? (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
              <ContestRules rules={contest.settings.rules} />
            </div>
          ) : (
            <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-100 mb-4">
                  Rules of the Duel
                </h3>
                <p className="text-gray-400">
                  No rules in this duel. Anything goes - it's every degen for
                  himself.
                </p>
              </div>
            </div>
          )}

          {/* Available Tokens Section */}
          <div className="group relative bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-6 relative">
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
                  <p className="text-gray-400">Selection restrictions: N/A</p>
                  <p className="text-gray-400">Allocation constraints: N/A</p>
                  <p className="text-gray-400">Whitelisted tokens list: All</p>
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

          {/* Duelers (entrants) List */}
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
                      Duelers ({contest.participant_count}/
                      {contest.max_participants})
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
                    Duelers ({contest.participant_count}/
                    {contest.max_participants})
                  </h3>
                  <p className="text-gray-400">No duelers yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Action Button Section */}
      <div className="flex flex-col items-center gap-4">
        {!isWalletConnected && (
          <div className="flex items-center gap-2 text-brand-400 mb-4">
            <span className="font-medium">Wallet Disconnected!</span>
            <button
              onClick={() => wallet && connect(wallet.name)}
              className="px-4 py-2 bg-dark-300/50 border-l-2 border-brand-400/30 hover:border-brand-400/50 text-brand-400 hover:text-brand-300 transition-all duration-300 transform hover:translate-x-1"
            >
              Reconnect!
            </button>
          </div>
        )}
        {isParticipating && (
          <div className="flex items-center gap-2 text-brand-400">
            <FaCheckCircle className="w-5 h-5 animate-pulse" />
            <span className="font-medium">
              You're already entered in this duel. Good luck!
              {contest?.status === "pending" &&
                " - You can update your portfolio at any time prior to the Duel's start."}
            </span>
          </div>
        )}
        {/* if user has a wallet connected and IS entered into this contest, then show this nav button (push to proceed to portfolio token selection page) */}
        {isParticipating && isWalletConnected && (
          <button
            onClick={handleJoinContest}
            className="px-6 py-3 bg-dark-300/50 border-l-2 border-brand-400/30 hover:border-brand-400/50 text-brand-400 hover:text-brand-300 transition-all duration-300 transform hover:translate-x-1 font-medium text-lg flex items-center gap-2"
          >
            <span>Modify Portfolio</span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
        )}
        {/* if user has a wallet connected but is NOT yet entered into this contest, then show this nav button (push to proceed to portfolio token selection page) */}
        {!isParticipating && isWalletConnected && (
          <button
            onClick={handleJoinContest}
            className="px-6 py-3 bg-dark-300/50 border-l-2 border-brand-400/30 hover:border-brand-400/50 text-brand-400 hover:text-brand-300 transition-all duration-300 transform hover:translate-x-1 font-medium text-lg flex items-center gap-2"
          >
            <span>Draft Tokens for Portfolio</span>
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
        )}
        {error && (
          <div className="text-center text-red-500 animate-pulse">{error}</div>
        )}
      </div>
    </div>
  );
};
