// src/pages/public/ContestDetailPage.tsx

/**
 * NEEDS:
 *   = Refactoring
 *   = To use the new design (see ./ContestDetailPage.tsx.new)
 *     (This file is the old design)
 *   = Connect via useWallet hook (the one in websocket/topic-hooks/useWallet.ts)
 * 
 * 
 
  useWallet.ts (in websocket/topic-hooks):
    - This is part of your WebSocket system and connects to your backend services
    - It handles real-time updates about wallet balances, transactions, and settings
  through your server
    - It doesn't directly connect to the user's browser wallet extension
    - Instead, it receives wallet data that's already been processed by your backend
    - Used for displaying wallet information, transaction history, and receiving
  updates

 */

// No longer using Aptos wallet
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContestDetailHeader } from "../../../components/contest-detail/ContestDetailHeader";
import { ContestRules } from "../../../components/contest-detail/ContestRules";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import AuthDebugPanel from "../../../components/debug/AuthDebugPanel";
import { Card, CardContent } from "../../../components/ui/Card";
import { CountdownTimer } from "../../../components/ui/CountdownTimer";
// PortfolioPreviewModal has been moved for future use in MyPortfoliosPage
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


// Using Solana Actions pattern, we don't need this anymore as 
// transaction results will be handled by the wallet

// Note: We're intentionally not defining showErrorMessage outside
// the component as it needs access to the setError state function

// Note: We're intentionally not defining showPortfolioPreview outside
// the component as it needs access to state functions

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    isFullyConnected, 
    walletAddress, 
    isWalletConnected,
    isAuthenticated,
    activeAuthMethod,
    authMethods
  } = useAuth();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  
  // We've removed the portfolio modal in favor of using the standard Solana Actions pattern

  useEffect(() => {
    console.log("Wallet State Changed:", {
      connected: isWalletConnected,
      authenticated: isAuthenticated(),
      activeMethod: activeAuthMethod,
      methods: authMethods,
      walletAddress,
      timestamp: new Date().toISOString(),
    });
  }, [isWalletConnected, walletAddress, isAuthenticated, activeAuthMethod, authMethods]);
  
  // We're using the AuthDebugPanel component now, which has its own visibility logic

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
              },
            )
          : [],
      };

      console.log(
        "Sanitized contest participants:",
        sanitizedContest.participants,
      );

      // Use the is_participating flag from the API response
      // This is set by the dedicated /check-participation endpoint in the backend
      setIsParticipating(data.is_participating || false);

      setContest(sanitizedContest);
    } catch (err) {
      console.error("Error fetching duel:", err);
      // Check if the error is a 503 (maintenance mode)
      if (err instanceof Error && err.message.includes("503")) {
        setIsMaintenanceMode(true);
        setError(
          "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
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
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
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
        prev ? { ...prev, status: "completed" } : null,
      );
    } else if (contest.status === "pending") {
      // Contest just started
      setContest((prev: Contest | null) =>
        prev ? { ...prev, status: "active" } : null,
      );
    }
  };

  const handleJoinContest = () => {
    console.log("Duel Action Button Clicked - Initial State:", {
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

    // Determine contest state for proper routing
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);

    const hasStarted = now >= startTime;
    const hasEnded = now >= endTime;

    // Get contest status for logic branching
    const contestStatus = hasEnded ? "ended" : hasStarted ? "live" : "upcoming";

    // If it's a completed contest, anyone can view results regardless of wallet connection
    if (contestStatus === "ended") {
      console.log("Navigating to contest results page");
      navigate(`/contests/${contest.id}/results`);
      return;
    }
    
    // If it's a live contest and user is not participating, they can view as spectator
    if (contestStatus === "live" && !isParticipating) {
      console.log("Navigating to contest lobby page as spectator");
      navigate(`/contests/${contest.id}/lobby`);
      return;
    }
    
    // Check if wallet is connected only when trying to participate
    if (!isWalletConnected) {
      // Just show error message - don't try to force wallet connection
      setError("Please connect your wallet to participate in this contest");
      // We should use our authentication system to prompt for login
      // (handled by global auth state, no need to call connect directly)
      return;
    }

    // User is already participating - determine where to navigate based on contest status
    if (isParticipating) {
      if (contestStatus === "live") {
        // Navigate to lobby/live view for active contests
        console.log("Navigating to contest lobby page as participant");
        navigate(`/contests/${contest.id}/lobby`);
        return;
      } else if (contestStatus === "upcoming") {
        // For upcoming contests, allow portfolio modification
        console.log(
          "Navigating to portfolio token selection page for modification",
        );
        navigate(`/contests/${contest.id}/select-tokens`);
        return;
      }
      // Note: "ended" case is already handled above
    }

    // User is not participating and wants to join an upcoming contest
    if (contestStatus === "live") {
      // Contest is in progress, can't join - already handled by spectator view above
      setError(
        "This contest is already in progress and not accepting new entries.",
      );
      return;
    } else if (contestStatus === "upcoming") {
      // Check for Solana Actions support for AI portfolio selection
      // @ts-ignore - window.solana is injected by the Solana Wallet adapter
      const hasSolanaActions = window.solana && typeof window.solana.action === 'function';
      
      if (hasSolanaActions) {
        // The button has data-solana-action attributes, so we should allow
        // the native Solana Actions flow to proceed without interruption
        // This is the key part of implementing the standard pattern - we don't
        // prevent default or interfere with the normal action handling
        return;
      } else {
        // For browsers/wallets without Solana Actions support, provide a fallback
        // by redirecting to the manual selection page
        console.log("Solana Actions not supported, navigating to manual selection:", {
          contestId: contest.id,
          userAddress: walletAddress,
          timestamp: new Date().toISOString(),
        });
        navigate(`/contests/${contest.id}/select-tokens`);
      }
      return;
    }
    
    // Fallback error message if we somehow reach here
    setError("Something went wrong. Please try again later.");
  };

  if (isLoading)
    return (
      <div className="flex flex-col min-h-screen">
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

  // We've removed portfolio confirmation in favor of using the standard Solana Actions pattern

  return (
    <div className="flex flex-col min-h-screen">
      {/* Reusable Auth Debug Panel */}
      <AuthDebugPanel position="floating" />

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

                {/* Rules Section - Expandable/Collapsible */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-100">
                      Rules of the Duel
                    </h3>
                    <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                      Info Only
                    </span>
                  </div>

                  <div className="relative overflow-hidden transition-all duration-300">
                    {contest?.settings?.rules &&
                    contest.settings.rules.length > 0 ? (
                      <ContestRules rules={contest.settings.rules} />
                    ) : (
                      <p className="text-gray-400">
                        No rules in this duel; anything goes. It's every degen
                        for himself.
                      </p>
                    )}
                  </div>
                </div>

                {/* Token Whitelist Section - Expandable/Collapsible */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-100">
                      Token Whitelist
                    </h3>
                    <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                      {contest?.settings?.token_types &&
                      contest.settings.token_types.length > 0
                        ? "Restricted"
                        : "Unrestricted"}
                    </span>
                  </div>

                  <div className="relative overflow-hidden transition-all duration-300">
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
                          <span className="text-brand-400">
                            Selection Restrictions:
                          </span>{" "}
                          None (all tokens available)
                        </p>
                        <p className="text-gray-400">
                          <span className="text-brand-400">
                            Allocation Limits:
                          </span>{" "}
                          Standard portfolio rules apply
                        </p>
                        <p className="text-gray-400">
                          <span className="text-brand-400">
                            Token Categories:
                          </span>{" "}
                          All categories permitted
                        </p>
                        <div className="mt-2 text-xs text-gray-500 bg-dark-300/50 p-2 rounded">
                          This contest allows you to select from all available
                          tokens in the market.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Sharing Section */}
                <div className="mt-8 pt-8 border-t border-dark-300/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-gray-100">
                      Share this Duel
                    </h3>

                    <div className="flex items-center gap-3">
                      {/* Twitter/X Share Button */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=Join%20me%20in%20${encodeURIComponent(contest.name)}%20on%20DegenDuel!&url=${encodeURIComponent(window.location.href)}${walletAddress ? `&hashtags=DegenDuel,Crypto,Trading,Referral_${walletAddress.slice(0, 8)}` : "&hashtags=DegenDuel,Crypto,Trading"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-dark-300/80 hover:bg-dark-300 text-brand-400 hover:text-brand-300 rounded-md transition-colors duration-300"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="font-medium">Share</span>
                      </a>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          // You could add a toast notification here
                          alert("Link copied to clipboard!");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-300/80 hover:bg-dark-300 text-gray-300 hover:text-white rounded-md transition-colors duration-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">Copy Link</span>
                      </button>
                    </div>
                  </div>

                  {walletAddress && (
                    <div className="mt-3 text-sm text-gray-400">
                      <span className="text-brand-400">💰 Tip:</span> Sharing
                      with your referral code can earn you rewards if new users
                      join!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Prize Structure and Participants */}
            <div className="space-y-8">
              {/* Prize Structure - Enhanced with accurate calculations */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-brand-500/5 to-brand-600/5 transform skew-y-[-1deg] pointer-events-none" />
                <PrizeStructure
                  prizePool={Number(contest?.prize_pool || 0)}
                  entryFee={Number(contest?.entry_fee || 0)}
                  maxParticipants={Number(contest?.max_participants || 0)}
                  currentParticipants={Number(contest?.participant_count || 0)}
                  platformFeePercentage={5} // Default platform fee
                />
              </div>

              {/* Participants List - Enhanced with dynamic updates */}
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
                        {!isParticipating && contest.status === "pending" && (
                          <div className="mt-4">
                            <button
                              onClick={handleJoinContest}
                              disabled={!isWalletConnected}
                              data-solana-action="true"
                              data-action-title="Join Contest with AI Portfolio"
                              data-action-url={`https://degenduel.me/api/blinks/join-contest?contest_id=${contest.id}`}
                              className={`px-4 py-2 ${!isWalletConnected ? 'bg-dark-300/50 text-gray-500 cursor-not-allowed' : 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:text-brand-300'} rounded-md transition-colors duration-300 flex items-center gap-2`}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              <span>Join with AI Portfolio</span>
                            </button>
                          </div>
                        )}
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
                      {!isParticipating && contest.status === "pending" && (
                        <div className="mt-4">
                          <button
                            onClick={handleJoinContest}
                            disabled={!isWalletConnected}
                            data-solana-action="true"
                            data-action-title="Join Contest with AI Portfolio"
                            data-action-url={`https://degenduel.me/api/blinks/join-contest?contest_id=${contest.id}`}
                            data-action-message="Join this contest with an AI-selected portfolio of trending tokens"
                            className={`px-4 py-2 ${!isWalletConnected ? 'bg-dark-300/50 text-gray-500 cursor-not-allowed' : 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:text-brand-300'} rounded-md transition-colors duration-300 flex items-center gap-2`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span>Join with AI Portfolio</span>
                          </button>
                        </div>
                      )}
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
            {/* Determine the contest's current state */}
            {(() => {
              const now = new Date();
              const startTime = new Date(contest.start_time);
              const endTime = new Date(contest.end_time);

              const hasStarted = now >= startTime;
              const hasEnded = now >= endTime;

              // Contest status for UI display
              const contestStatus = hasEnded
                ? "ended"
                : hasStarted
                  ? "live"
                  : "upcoming";

              // Not connected to wallet - still allow viewing but show connection CTA for entering
              if (!isWalletConnected) {
                if (contestStatus === "ended") {
                  // For ended contests, anyone can view results
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-gray-500/20 bg-gray-500/20 text-gray-300 font-bold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">View Results</span>
                      </span>
                    </button>
                  );
                } else if (contestStatus === "live") {
                  // For live contests, anyone can view as spectator
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-green-500/20 bg-green-500/20 text-green-400 font-bold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">View Live Contest</span>
                      </span>
                    </button>
                  );
                } else {
                  // For upcoming contests, show connect wallet CTA
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold animate-pulse-slow"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">Connect Wallet</span>
                        <span>to Enter</span>
                      </span>
                    </button>
                  );
                }
              }

              // Connected and participating
              if (isParticipating) {
                if (contestStatus === "ended") {
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-gray-500/20 bg-gray-500/20 text-gray-300 font-bold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">View Results</span>
                      </span>
                    </button>
                  );
                } else if (contestStatus === "live") {
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-green-500/20 bg-green-500/20 text-green-400 font-bold"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">View Live Contest</span>
                        <span>
                          Ends in{" "}
                          <CountdownTimer
                            targetDate={contest.end_time}
                            onComplete={handleCountdownComplete}
                            showSeconds={true}
                          />
                        </span>
                      </span>
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={handleJoinContest}
                      className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-dark-300/90 backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="font-medium">Modify Portfolio</span>
                        <span className="text-brand-400">
                          Starts in{" "}
                          <CountdownTimer
                            targetDate={contest.start_time}
                            onComplete={handleCountdownComplete}
                            showSeconds={true}
                          />
                        </span>
                      </span>
                    </button>
                  );
                }
              }

              // Connected but not participating
              if (contestStatus === "ended") {
                return (
                  <button
                    disabled={true}
                    className="w-full relative group overflow-hidden text-sm py-4 bg-dark-300/50 text-gray-400 font-bold cursor-not-allowed opacity-80"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="font-medium">Contest Ended</span>
                    </span>
                  </button>
                );
              } else if (contestStatus === "live") {
                return (
                  <button
                    disabled={true}
                    className="w-full relative group overflow-hidden text-sm py-4 bg-dark-300/50 text-gray-400 font-bold cursor-not-allowed opacity-80"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="font-medium">Contest in Progress</span>
                    </span>
                  </button>
                );
              } else {
                return (
                  <button
                    onClick={handleJoinContest}
                    className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="font-medium">Select Your Portfolio</span>
                      <span>
                        Starts in{" "}
                        <CountdownTimer
                          targetDate={contest.start_time}
                          onComplete={handleCountdownComplete}
                          showSeconds={true}
                        />
                      </span>
                    </span>
                  </button>
                );
              }
            })()}

            {error && (
              <div className="mt-2 text-xs text-red-400 text-center animate-glitch bg-dark-100/95 rounded-lg py-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) on desktop */}
        <div className="hidden md:block fixed top-24 md:top-32 right-6 md:right-10 z-40">
          {/* Determine the contest's current state */}
          {(() => {
            const now = new Date();
            const startTime = new Date(contest.start_time);
            const endTime = new Date(contest.end_time);

            const hasStarted = now >= startTime;
            const hasEnded = now >= endTime;

            // Contest status for UI display
            const contestStatus = hasEnded
              ? "ended"
              : hasStarted
                ? "live"
                : "upcoming";

            // Not connected to wallet - But we'll still show appropriate buttons based on state
            if (!isWalletConnected) {
              if (contestStatus === "ended") {
                // For ended contests, anyone can view results
                return (
                  <button
                    onClick={handleJoinContest}
                    className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-gray-500/20 bg-gray-500/20 text-gray-300 font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-gray-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span>View Results</span>
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
                );
              } else if (contestStatus === "live") {
                // For live contests, anyone can view as spectator
                return (
                  <button
                    onClick={handleJoinContest}
                    className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-green-500/30 bg-green-500/20 text-green-400 font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-green-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Spectate Live</span>
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
                );
              } else {
                // For upcoming contests, indicate wallet connection is needed to join
                return (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-cyan-400 rounded-lg blur opacity-75 group-hover:opacity-100 animate-pulse-slow"></div>
                    <button
                      onClick={handleJoinContest}
                      className="relative flex items-center gap-2 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/10 shadow-2xl"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>Connect to Enter</span>
                    </button>
                  </div>
                );
              }
            }

            // Connected and participating
            if (isParticipating) {
              if (contestStatus === "ended") {
                return (
                  <button
                    onClick={handleJoinContest}
                    className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-gray-500/20 bg-gray-500/20 text-gray-300 font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-gray-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span>View Results</span>
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
                );
              } else if (contestStatus === "live") {
                return (
                  <button
                    onClick={handleJoinContest}
                    className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-green-500/30 bg-green-500/20 text-green-400 font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-green-500/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>View Live Contest</span>
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
                );
              } else {
                return (
                  <button
                    onClick={handleJoinContest}
                    className="relative group overflow-hidden px-6 md:px-8 py-4 md:py-5 shadow-xl shadow-brand-500/30 bg-gradient-to-r from-brand-400 to-brand-500 text-white font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
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
                );
              }
            }

            // Connected but not participating
            if (contestStatus === "ended" || contestStatus === "live") {
              // No button for ended or live contests if not participating
              return null;
            } else {
              return (
                <div className="relative group">
                  {/* Animated glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-cyan-400 rounded-lg blur opacity-75 group-hover:opacity-100 animate-pulse-slow"></div>
                  <button
                    onClick={handleJoinContest}
                    className="relative flex items-center gap-2 px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/10 shadow-2xl"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 animate-bounce-slow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Join with AI Portfolio</span>
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
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};
