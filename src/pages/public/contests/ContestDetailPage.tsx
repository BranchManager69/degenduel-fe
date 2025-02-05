// src/pages/public/ContestDetailPage.tsx

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ContestRules } from "../../../components/contests/ContestRules";
import { ParticipantsList } from "../../../components/contests/ParticipantsList";
import { PrizeStructure } from "../../../components/contests/PrizeStructure";
import { ContestDifficulty } from "../../../components/landing/contests/ContestDifficulty";
import { Button } from "../../../components/ui/Button";
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

interface ContestParticipant {
  wallet_address?: string;
  address?: string;
  nickname?: string;
  username?: string;
  score?: number;
  users?: {
    wallet_address?: string;
    nickname?: string;
  };
}

interface Participant {
  address: string;
  nickname: string;
  score?: number;
}

type Contest = Omit<BaseContest, "participants"> & {
  participants?: Participant[];
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
            "Failed to reconnect wallet. Please try connecting manually."
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
          "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
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
                  p.wallet_address || p.users?.wallet_address || "";
                // Extract nickname from either the participant or nested user object
                const nickname =
                  p.nickname ||
                  p.users?.nickname ||
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
      console.error("Error fetching contest:", err);
      // Check if the error is a 503 (maintenance mode)
      if (err instanceof Error && err.message.includes("503")) {
        setIsMaintenanceMode(true);
        setError(
          "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
        );
      } else {
        setError("Failed to load contest details");
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
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
        }
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

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
    console.log("Join Contest Button Clicked - Initial State:", {
      isWalletConnected,
      isFullyConnected,
      walletAddress,
      isParticipating,
      contestId: contest?.id,
      timestamp: new Date().toISOString(),
    });

    if (!contest) {
      console.log("No contest data available");
      return;
    }

    if (isParticipating) {
      console.log("User is already participating");
      setError("You are already entered in this contest.");
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
      setError("Please connect your wallet to enter the contest.");
      return;
    }

    console.log("Proceeding to token selection:", {
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
              ⚙️ DegenDuel is currently undergoing scheduled maintenance. Please
              try again later.
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
      {/* Enhanced Header Section with Cyber Theme */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-dark-200/80 backdrop-blur-sm rounded-lg border border-dark-300 hover:border-brand-400/20 transition-colors">
          {/* Title and Description */}
          <div className="space-y-2 flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text group-hover:animate-gradient-x">
              {contest.name}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              {contest.description}
            </p>
          </div>
          {/* Difficulty Badge */}
          <div className="flex-shrink-0">
            <ContestDifficulty
              difficulty={contest.settings.difficulty || "guppy"}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Cyber Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Entry Fee Card */}
        <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Entry Fee
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text group-hover:animate-gradient-x">
                {formatCurrency(Number(contest.entry_fee))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Prize Pool Card */}
        <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Prize Pool
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text group-hover:animate-gradient-x">
                {formatCurrency(Number(contest.prize_pool))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
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
          </CardContent>
        </Card>

        {/* Players Card */}
        <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 overflow-hidden">
          <CardContent className="p-6 relative">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-between">
              <span className="text-gray-400 group-hover:text-brand-300 transition-colors">
                Players
              </span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-300 ease-out group-hover:animate-pulse"
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
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Rules and Tokens */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rules Section */}
          {contest?.settings?.rules && contest.settings.rules.length > 0 ? (
            <div className="group">
              <ContestRules rules={contest.settings.rules} />
              {/* Animated border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ) : (
            <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300">
              <CardContent className="p-6 relative">
                <h3 className="text-xl font-bold text-gray-100 mb-4">
                  Contest Rules
                </h3>
                <p className="text-gray-400">
                  No rules specified for this contest.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Tokens Section */}
          <Card className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 overflow-hidden">
            <CardContent className="p-6 relative">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="text-xl font-bold text-gray-100 mb-4 relative">
                Available Tokens
              </h3>
              {contest?.settings?.token_types &&
              contest.settings.token_types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contest.settings.token_types.map((token: string) => (
                    <span
                      key={token}
                      className="px-3 py-1.5 bg-dark-300/50 rounded-full text-sm text-gray-300 border border-dark-300 hover:border-brand-400/20 hover:text-brand-400 transition-all duration-300"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">
                  No tokens specified for this contest.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Prize Structure and Participants */}
        <div className="space-y-8">
          {/* Prize Structure */}
          <div className="group relative">
            <PrizeStructure prizePool={Number(contest?.prize_pool || 0)} />
            {/* Animated border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Participants List */}
          <div className="group relative">
            {Number(contest.participant_count) > 0 &&
            Array.isArray(contest.participants) ? (
              contest.participants.length > 0 ? (
                <ParticipantsList
                  participants={contest.participants}
                  contestStatus={mapContestStatus(contest.status)}
                />
              ) : (
                <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">
                      Participants ({contest.participant_count}/
                      {contest.max_participants})
                    </h3>
                    <p className="text-gray-400">Participant list is empty</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">
                    Participants ({contest.participant_count}/
                    {contest.max_participants})
                  </h3>
                  <p className="text-gray-400">No participants yet.</p>
                </CardContent>
              </Card>
            )}
            {/* Animated border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Action Button Section */}
      <div className="flex flex-col items-center gap-4">
        {!isWalletConnected && (
          <div className="flex items-center gap-2 text-brand-400 mb-4">
            <span className="font-medium">Wallet disconnected</span>
            <Button
              size="sm"
              onClick={() => wallet && connect(wallet.name)}
              className="group relative overflow-hidden"
            >
              Reconnect Wallet
            </Button>
          </div>
        )}
        {isParticipating && (
          <div className="flex items-center gap-2 text-brand-400">
            <FaCheckCircle className="w-5 h-5 animate-pulse" />
            <span className="font-medium">
              You're entered in this contest
              {contest.status === "pending" &&
                " - You can update your tokens before the contest begins"}
            </span>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 animate-pulse">{error}</div>
        )}
        <Button
          size="lg"
          onClick={handleJoinContest}
          className={`group relative overflow-hidden ${
            isParticipating && contest.status !== "pending"
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          disabled={
            (isParticipating && contest.status !== "pending") ||
            Number(contest.participant_count) >= contest.max_participants
          }
        >
          {/* Button gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Button content */}
          <span className="relative flex items-center justify-center gap-2 font-medium">
            {isParticipating
              ? contest.status === "pending"
                ? "Update Tokens"
                : "Already Joined"
              : Number(contest.participant_count) >= contest.max_participants
              ? "Contest Full"
              : `Enter Contest (${formatCurrency(
                  parseInt(contest.entry_fee)
                )})`}

            {/* Animated arrow */}
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>

          {/* Glowing border */}
          <div className="absolute inset-0 border border-brand-400/20 rounded-lg group-hover:border-brand-400/40 transition-colors duration-300" />
        </Button>
      </div>
    </div>
  );
};
