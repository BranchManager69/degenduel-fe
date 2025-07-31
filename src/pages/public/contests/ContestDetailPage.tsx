// src/pages/public/contests/ContestDetailPage.tsx

/**
 * Contest Detail Page
 * 
 * @description This file contains the ContestDetailPage component, which displays detailed information about a contest.
 * It includes a countdown timer, prize structure, participants list, and other details.
 * 
 * @author BranchManager69
 * @version 2.2.0
 * @created 2025-01-01
 * @updated 2025-01-29
 */

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { AllowedTokensGrid } from "../../../components/contest-detail/AllowedTokensGrid";
import { ChallengeBadge } from "../../../components/contest-detail/ChallengeBadge";
import { ContestDetailHeaderNew } from "../../../components/contest-detail/ContestDetailHeaderNew";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { ReferralProgressCard } from "../../../components/contest-lobby/ReferralProgressCard";
import { Card } from "../../../components/ui/Card";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestLifecycle } from "../../../hooks/websocket/topic-hooks/useContestLifecycle";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import {
    isContestCurrentlyUnderway,
    mapContestStatus,
} from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import type { Contest as BaseContest, ContestViewData } from "../../../types/index";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Helper to parse the custom decimal format from the API
const getNumericValue = (value: any): number => {
  if (typeof value === 'object' && value !== null && Array.isArray(value.d) && value.d.length > 0) {
    // As per user instruction, directly taking the value from the 'd' array.
    return value.d[0];
  }
  // Fallback for primitive numbers or strings.
  return Number(value) || 0;
};

// TODO: move elsewhere
interface ContestParticipant {
  id: number;
  contest_id: number;
  wallet_address: string;
  joined_at: string;
  initial_dxd_points: string;
  current_dxd_points: string;
  rank: number | null;
  prize_amount: string | null;
  prize_paid_at: string | null;
  refund_amount: string | null;
  refunded_at: string | null;
  entry_transaction_id: number | null;
  entry_time: string;
  final_rank: number | null;
  prize_transaction_id: number | null;
  status: string;
  portfolio_value: string;
  initial_balance: string;
  users: {
    nickname: string | null;
    wallet_address: string;
  };
}

// Legacy Participant interface - will be replaced by unified API
interface LegacyParticipant {
  address: string;
  nickname: string;
  score?: number;
}

// Transform legacy participant to new format
const transformLegacyParticipant = (participant: any): any => {
  // Handle both old LegacyParticipant format and new ContestParticipant format
  const walletAddress = participant.address || participant.wallet_address;
  const nickname = participant.nickname || participant.users?.nickname;
  
  return {
    wallet_address: walletAddress,
    nickname: nickname,
    profile_image_url: null, // Legacy participants don't have profile images
    performance_percentage: participant.score?.toString(),
    is_current_user: false,
    is_ai_agent: false,
    is_banned: false
  };
};

// TODO: move elsewhere
type Contest = Omit<BaseContest, "participants"> & {
  participants?: LegacyParticipant[];
  max_prize_pool: number;
};

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useMigratedAuth();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [enhancedParticipants, setEnhancedParticipants] = useState<any[]>([]);
  
  // Add state for analytics participants with SOL values
  const [analyticsParticipants, setAnalyticsParticipants] = useState<any[]>([]);
  
  // Add state for portfolio transactions and participation
  const [portfolioTransactions, setPortfolioTransactions] = useState<any>(null);
  const [hasPortfolio, setHasPortfolio] = useState<boolean>(false);
  
  // Copy feedback state
  const [showCopied, setShowCopied] = useState(false);


  // Determine contestDisplayStatus - Similar to what ContestCard does
  const getDisplayStatus = React.useMemo(() => {
    if (!contest) return "pending"; // Default to pending if no contest loaded
    
    // Contest is cancelled - highest priority status
    if (contest.status === "cancelled") return "cancelled";
    
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    const hasStarted = now >= startTime;
    const hasEnded = now >= endTime;
    
    if (hasEnded) return "completed";
    if (hasStarted) return "active";
    return "pending";
  }, [contest]);


  // WebSocket integration for real-time updates
  const { 
    contestViewData: wsUpdatedData, 
    error: wsError 
  } = useContestViewUpdates(id || null, contestViewData);

  // Contest lifecycle events for real-time notifications
  useContestLifecycle({
    onContestStarted: (contestId) => {
      if (contestId.toString() === id) {
        console.log(`[ContestDetailPage] Contest ${contestId} started`);
        // Update contest status locally
        setContest(prev => prev ? { ...prev, status: "active" as const } : null);
      }
    },
    onContestEnded: (contestId) => {
      if (contestId.toString() === id) {
        console.log(`[ContestDetailPage] Contest ${contestId} ended`);
        // Update contest status locally
        setContest(prev => prev ? { ...prev, status: "completed" as const } : null);
      }
    },
    onContestCancelled: (contestId, reason) => {
      if (contestId.toString() === id) {
        console.log(`[ContestDetailPage] Contest ${contestId} cancelled: ${reason}`);
        // Update contest status locally
        setContest(prev => prev ? { ...prev, status: "cancelled" as const } : null);
      }
    },
    onContestActivity: (contestId, activity, count) => {
      if (contestId.toString() === id) {
        console.log(`[ContestDetailPage] Contest ${contestId} activity: ${activity}, participants: ${count}`);
        // Update participant count locally
        setContest(prev => prev ? { ...prev, participant_count: count } : null);
      }
    }
  });

  // Effect to update page state when WebSocket pushes new data
  useEffect(() => {
    if (wsUpdatedData) {
      setContestViewData(wsUpdatedData);
      
      // Update contest data from view data if available (with proper type handling)
      if (wsUpdatedData.contest) {
        setContest(prev => {
          if (!prev) return null;
          // Ensure ID compatibility between ContestViewData and Contest types
          const updatedContest = { ...prev };
          // Only update compatible fields, preserve the existing id as number
          if (wsUpdatedData.contest.status) {
            updatedContest.status = wsUpdatedData.contest.status;
          }
          return updatedContest;
        });
      }
    }
  }, [wsUpdatedData]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      console.warn("[ContestDetailPage] WebSocket update error:", wsError);
    }
  }, [wsError]);

  // Real-time participants updates using new unified API
  const {
    participants: realtimeParticipants
  } = useContestParticipants(
    id ? parseInt(id) : null
  );
  
  // Debug WebSocket participants vs REST API participants
  useEffect(() => {
    console.log("[ContestDetailPage] Participant data comparison:", {
      contestId: id,
      websocketParticipants: realtimeParticipants.length,
      restApiParticipants: contest?.participants?.length || 0,
      participantCount: contest?.participant_count || 0,
      websocketData: realtimeParticipants.slice(0, 2), // Show first 2 for debugging
      restApiData: contest?.participants?.slice(0, 2) || [] // Show first 2 for debugging
    });
  }, [id, realtimeParticipants, contest?.participants, contest?.participant_count]);

  useEffect(() => {
    console.log("Wallet State:", {
      isConnected: isAuthenticated,
      walletAddress: user?.wallet_address,
      timestamp: new Date().toISOString(),
    });
  }, [isAuthenticated, user?.wallet_address]);

  const fetchContest = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid contest ID');
      return;
    }
    
    // Validate that ID is a valid number
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      setError('Invalid contest ID format');
      return;
    }

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
        participants: data.participants,
        raw_data: data,
      });

      // Try to fetch enhanced participant data from the new unified endpoint
      try {
        const participantsResponse = await fetch(`/api/contests/${id}/participants`);
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          const fetchedParticipants = participantsData.contest_participants || participantsData.participants || [];
          setEnhancedParticipants(fetchedParticipants);
          console.log("Enhanced participants from unified API:", fetchedParticipants);
          
          // Debug: Check profile image URLs
          console.log("[ContestDetailPage] Profile image URLs from API:", 
            fetchedParticipants.map((p: any) => ({
              nickname: p.nickname,
              profile_image_url: p.profile_image_url,
              has_image: !!p.profile_image_url
            }))
          );
        }
      } catch (participantsError) {
        console.log("Enhanced participants API not available, using legacy data:", participantsError);
      }

      // Fetch portfolio analytics data for SOL values (for active/completed contests)
      const displayStatus = (() => {
        if (data.status === "cancelled") return "cancelled";
        const now = new Date();
        const startTime = new Date(data.start_time);
        const endTime = new Date(data.end_time);
        const hasStarted = now >= startTime;
        const hasEnded = now >= endTime;
        if (hasEnded) return "completed";
        if (hasStarted) return "active";
        return "pending";
      })();

      if (displayStatus === "active" || displayStatus === "completed") {
        try {
          const analyticsResponse = await fetch(`/api/portfolio-analytics/contests/${id}/performance/detailed`, {
            credentials: 'same-origin'
          });
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            console.log("Portfolio analytics data fetched:", analyticsData);
            
            // Transform analytics participants to match ParticipantsList expected format
            const transformedAnalyticsParticipants = (analyticsData.participants || []).map((p: any) => ({
              wallet_address: p.wallet_address,
              nickname: p.username || p.nickname || `Player ${p.rank || 0}`,
              portfolio_value: p.total_value_sol?.toString() || '0', // SOL value instead of USD
              performance_percentage: p.pnl_percent?.toString() || '0',
              rank: p.rank,
              is_current_user: p.wallet_address === user?.wallet_address,
              is_ai_agent: false,
              profile_image_url: null,
              role: p.role || "user", // Add role field
              is_admin: p.is_admin || false,
              is_superadmin: p.is_superadmin || false,
              // Add price source metadata
              sol_price_source: analyticsData.sol_price_source,
              sol_price_timestamp: analyticsData.sol_price_timestamp,
              contest_status: analyticsData.contest_status,
            }));
            
            setAnalyticsParticipants(transformedAnalyticsParticipants);
            console.log("Analytics participants with SOL values:", transformedAnalyticsParticipants);
          }
        } catch (analyticsError) {
          console.log("Portfolio analytics not available, using basic data:", analyticsError);
        }
      }

      // Ensure settings are properly initialized
      const sanitizedContest = {
        ...data,
        entry_fee: getNumericValue(data.entry_fee),
        prize_pool: getNumericValue(data.prize_pool),
        participant_count: Number(data.participant_count) || 0,
        start_time: data.start_time,
        end_time: data.end_time,
        settings: {
          ...data.settings,
          max_participants: Number(data.settings?.max_participants) || 0,
          tokenTypesAllowed: Array.isArray(data.settings?.tokenTypesAllowed)
            ? data.settings.tokenTypesAllowed
            : [],
          difficulty: data.settings?.difficulty || "guppy",
        },
        participants: Array.isArray(data.contest_participants || data.participants)
          ? (data.contest_participants || data.participants).map(
              (p: ContestParticipant): LegacyParticipant => {
                // Extract address from participant and users object  
                const address = p.wallet_address || "";
                // Extract nickname from nested users object (API structure: contest_participants[].users)
                const nickname =
                  p.users?.nickname ||
                  `${address.slice(0, 6)}...${address.slice(-4)}`;
                // Use rank for score (API doesn't provide score directly)
                const score = p.rank || undefined;

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

      // Check participation using the correct endpoint
      if (user?.wallet_address) {
        try {
          console.log("🔍 Checking participation for contest detail page:", id, user.wallet_address);
          const participationData = await ddApi.contests.checkParticipation(id!, user.wallet_address);
          console.log("📊 Contest detail participation data:", participationData);
          setIsParticipating(participationData.participating || false);
        } catch (participationError) {
          console.error("Failed to check participation:", participationError);
          setIsParticipating(false);
        }

        // Fetch portfolio transactions for this specific contest
        try {
          const portfolioResponse = await fetch(`/api/contests/${id}/portfolio/${user.wallet_address}`);
          if (portfolioResponse.ok) {
            const portfolioData = await portfolioResponse.json();
            console.log("Contest portfolio data:", portfolioData);
            
            // Check if user has a portfolio (participated)
            if (portfolioData.portfolio && portfolioData.portfolio.length > 0) {
              setHasPortfolio(true);
            }
            
            if (portfolioData.transactions) {
              setPortfolioTransactions(portfolioData.transactions);
              console.log("Found contest portfolio transactions:", portfolioData.transactions);
            }
          }
        } catch (portfolioError) {
          console.log("Failed to fetch contest portfolio transactions:", portfolioError);
        }
      } else {
        setIsParticipating(false);
      }

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

    return () => {
      clearInterval(maintenanceCheckInterval);
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, [id, user]);


  // Setup OG meta tags when contest data is loaded
  useEffect(() => {
    if (contest && id) {
      setupContestOGMeta(id, contest.name, contest.description);
    }
  }, [contest, id]);


  const handleCountdownComplete = () => {
    if (!contest) return;

    if (isContestCurrentlyUnderway(contest)) {
      // Contest just ended
      setContest((prev: Contest | null) =>
        prev ? { ...prev, status: "completed" } : null,
      );
    } else if (contest.status === "pending") {
      // Contest just started - navigate to live page
      console.log("Contest countdown complete - navigating to live page");
      navigate(`/contests/${contest.id}/live`);
    }
  };

  const handleJoinContest = () => {
    console.log("Contest Action Button Clicked - Initial State:", {
      isAuthenticated,
      walletAddress: user?.wallet_address,
      isParticipating,
      contestId: contest?.id,
      timestamp: new Date().toISOString(),
    });

    if (!contest) {
      console.log("No contest data available. Please try again later.");
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

    // User is already participating - determine where to navigate based on contest status
    if (isParticipating) {
      if (contestStatus === "ended") {
        // Navigate to live page for completed contests
        console.log("Navigating to contest live page");
        navigate(`/contests/${contest.id}/live`);
        return;
      } else if (contestStatus === "live") {
        // Navigate to lobby/live view for active contests
        console.log("Navigating to contest lobby page");
        navigate(`/contests/${contest.id}/live`);
        return;
      } else {
        // For upcoming contests, allow portfolio modification
        console.log("Navigating to portfolio token selection page for modification");
        navigate(`/contests/${contest.id}/select-tokens`);
        return;
      }
    }

    // User is not participating
    if (contestStatus === "ended") {
      // Contest is over, navigate to live page to view results
      console.log("Navigating to contest live page for non-participant");
      navigate(`/contests/${contest.id}/live`);
      return;
    } else if (contestStatus === "live") {
      // Contest is in progress - both participants and non-participants can view
      console.log("Navigating to contest live page");
      navigate(`/contests/${contest.id}/live`);
      return;
    } else {
      // Contest is upcoming - DIRECT NAVIGATION to portfolio selection (no auth required!)
      console.log("Navigating directly to portfolio selection page:", {
        contestId: contest.id,
        timestamp: new Date().toISOString(),
      });
      navigate(`/contests/${contest.id}/select-tokens`);
      return;
    }
  };

  // Button label based on contest status and participation
  const getButtonLabel = () => {
    const displayStatus = getDisplayStatus;

    if (displayStatus === "completed") {
      return "View Results";
    } else if (displayStatus === "active") {
      return "View Live Contest";
    } else if (displayStatus === "cancelled") {
      return "View Details";
    } else {
      // Pending contests - only differentiate based on participation
      return isParticipating ? "Update Portfolio" : "Enter Contest";
    }
  };


  // Loading skeleton UI
  if (isLoading)
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton loading for header with image placeholder */}
          <div className="relative h-80 w-full rounded-lg overflow-hidden bg-dark-300 animate-pulse mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-300/80 to-dark-400/80" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <div className="h-4 bg-dark-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-dark-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-dark-200 rounded w-2/3"></div>
            </div>
          </div>
          
          {/* Skeleton stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(2)].map((_, i) => (
              <Card
                key={i}
                className="bg-dark-200/50 backdrop-blur-sm border-dark-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream-responsive" />
                <div className="p-6 relative">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                    <div className="h-6 bg-dark-300 rounded w-3/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Skeleton main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-dark-200/50 backdrop-blur-sm border-dark-300 rounded-lg animate-pulse h-64"></div>
            </div>
            <div className="space-y-8">
              <div className="bg-dark-200/50 backdrop-blur-sm border-dark-300 rounded-lg animate-pulse h-48"></div>
              <div className="bg-dark-200/50 backdrop-blur-sm border-dark-300 rounded-lg animate-pulse h-48"></div>
            </div>
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
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <span className="relative z-10">
              {error || "Contest not found"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Double-check contest exists before rendering
  if (!contest) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <span className="relative z-10">Contest not found</span>
          </div>
        </div>
      </div>
    );
  }

  // Variable for the display status (pending, active, completed, cancelled)
  const displayStatus = getDisplayStatus;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb navigation */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="flex items-center text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-400 transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link to="/contests" className="hover:text-brand-400 transition-colors">
            Contests
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-300">{contest.name}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Contest Header Component */}
          <ContestDetailHeaderNew
            contest={contest}
            displayStatus={displayStatus}
            isAuthenticated={isAuthenticated}
            hasPortfolio={hasPortfolio}
            isParticipating={isParticipating}
            portfolioTransactions={portfolioTransactions}
            onActionButtonClick={handleJoinContest}
            getActionButtonLabel={getButtonLabel}
            handleCountdownComplete={handleCountdownComplete}
            error={error}
          />

          {/* Challenge Badge - Show for challenge contests */}
          {(contest as any).contest_type === "CHALLENGE" && (
            <div className="mb-8">
              <ChallengeBadge
                challengeStatus={(contest as any).challenge_status || "PENDING_ACCEPTANCE"}
                challengerWallet={(contest as any).challenger_wallet || ""}
                challengedWallet={(contest as any).challenged_wallet || ""}
                contestId={contest.id.toString()}
                challengeExpiresAt={(contest as any).challenge_expires_at}
                onAccept={() => {
                  // Refresh contest data after accepting
                  fetchContest();
                }}
                onReject={() => {
                  // Refresh contest data after rejecting
                  fetchContest();
                }}
                onCancel={() => {
                  // Refresh contest data after cancelling
                  fetchContest();
                }}
              />
            </div>
          )}

          {/* Contest Stats - Info Bar Only */}
          <div className="mb-8">
            {/* Additional Contest Info Bar */}
            <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg border border-dark-200/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Format:</span>
                    <span className="text-gray-300 font-medium">
                      {(contest as any)?.contest_type === "CHALLENGE" 
                        ? (contest as any)?.visibility === "private" ? "Private Duel" : "Public Duel"
                        : (contest as any)?.visibility === "private" ? "Private Contest" : "Public Contest"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Winners:</span>
                    <span className="text-gray-300 font-medium">
                      {(() => {
                        const payoutStructure = contest?.settings?.payout_structure;
                        if (payoutStructure && Object.keys(payoutStructure).length > 0) {
                          const maxWinners = Object.keys(payoutStructure).length;
                          const actualParticipants = contest?.participant_count || 0;
                          const effectiveWinners = Math.min(maxWinners, actualParticipants);
                          
                          // Show the smart/effective winners based on actual participants
                          if (actualParticipants === 0) {
                            return maxWinners === 1 ? "Winner Takes All" : `Top ${maxWinners} Players`;
                          }
                          return effectiveWinners === 1 ? "Winner Takes All" : `Top ${effectiveWinners} Players`;
                        }
                        return "TBD"; // More vague fallback when payout structure is unknown
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Payout Structure:</span>
                    <span className="text-gray-300 font-medium">
                      {(() => {
                        const payoutStructure = contest?.settings?.payout_structure;
                        if (!payoutStructure || Object.keys(payoutStructure).length === 0) {
                          return "TBD";
                        }
                        
                        const payouts = Object.values(payoutStructure).sort((a, b) => b - a);
                        const maxParticipants = contest?.max_participants || 0;
                        const winnerCount = payouts.length;
                        const winnerPercentage = maxParticipants > 0 ? (winnerCount / maxParticipants) : 0;
                        
                        // Heuristic to determine structure type:
                        // Double Up: ~50% of players win with relatively equal payouts
                        // Top Heavy: Fewer winners with exponential decay (first place much larger)
                        
                        if (winnerPercentage >= 0.45 && winnerPercentage <= 0.55) {
                          // Around 50% of players win - likely double up
                          // TODO: Consider removing coefficient of variation check since Double Up contests have equal payouts by design
                          // Check if payouts are relatively equal (variance test)
                          const avgPayout = payouts.reduce((sum, p) => sum + p, 0) / payouts.length;
                          const variance = payouts.reduce((sum, p) => sum + Math.pow(p - avgPayout, 2), 0) / payouts.length;
                          const standardDev = Math.sqrt(variance);
                          const coefficientOfVariation = standardDev / avgPayout;
                          
                          if (coefficientOfVariation < 0.3) { // Low variance = equal payouts
                            return "Double Up";
                          }
                        }
                        
                        // Check for top heavy characteristics
                        if (payouts.length >= 2) {
                          const firstPlace = payouts[0];
                          const secondPlace = payouts[1];
                          const ratio = firstPlace / secondPlace;
                          
                          // If first place is significantly larger than second (>1.5x), it's top heavy
                          if (ratio > 1.5) {
                            return "Top Heavy";
                          }
                        }
                        
                        // Default fallback based on winner percentage
                        return winnerPercentage > 0.3 ? "Double Up" : "Top Heavy";
                      })()}
                    </span>
                  </div>
                </div>
                {contest.wallet_address && (
                  <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-500 text-sm whitespace-nowrap">
                        Wallet:
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contest.wallet_address!);
                          setShowCopied(true);
                          setTimeout(() => setShowCopied(false), 2000);
                        }}
                        className="text-gray-300 font-mono text-xs hover:text-gray-100 cursor-pointer transition-colors relative truncate max-w-[120px] sm:max-w-[200px] md:max-w-none"
                        title="Click to copy wallet address"
                      >
                        {contest.wallet_address}
                        <AnimatePresence>
                          {showCopied && (
                            <motion.span 
                              initial={{ opacity: 0, y: -2 }}
                              animate={{ opacity: 1, y: -4 }}
                              exit={{ opacity: 0, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-400 text-xs font-sans pointer-events-none"
                            >
                              Copied!
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                      <a
                        href={`https://solscan.io/account/${contest.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="View on Solscan"
                      >
                        <svg className="w-3 h-3 text-gray-400 hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="relative hidden sm:block group">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-700/50 hover:bg-gray-700/70 rounded-full text-[10px] text-gray-400 hover:text-gray-300 cursor-help transition-colors whitespace-nowrap">
                          <span>What's this?</span>
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-[100] pointer-events-none group-hover:pointer-events-auto">
                          <div className="space-y-2">
                            <p className="font-medium">Contest Wallet</p>
                            <p className="break-words">This is the dedicated wallet where entry fees are collected and prize payouts are distributed for this contest.</p>
                            <div className="pt-2 border-t border-gray-700">
                              <p className="font-medium text-blue-300 mb-1">🧪 Beta Feature</p>
                              <p className="text-gray-300 break-words">
                                Want to test our new real-wallet entry method? Send your entry fee directly to this address and we'll attempt to match your existing token holdings for contest participation.
                              </p>
                              <p className="text-yellow-300 text-xs mt-2 break-words">
                                <strong>Early experimental stage:</strong> If your entry is not recognized, contact Branch Manager.
                              </p>
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Token Whitelist Section - Full Width */}
          <div className="group relative mb-8">
            <SilentErrorBoundary>
              <div>
                <span className="text-sm font-medium text-blue-400 block mb-3">Example Tokens:</span>
                <AllowedTokensGrid
                  className="mb-2"
                />
              </div>
            </SilentErrorBoundary>
          </div>

          {/* Rules Section - Full Width */}
          <div className="group relative mb-10">
            <SilentErrorBoundary>
              <div>
                <span className="text-sm font-medium text-blue-400 block mb-2">Rules:</span>
                <p className="text-gray-400">Standard DegenDuel trading rules apply</p>
              </div>
            </SilentErrorBoundary>
          </div>

          {/* Content Grid - Better Balanced Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Participants Only */}
            <div className="space-y-8">
              {/* Participants Section */}
              {(realtimeParticipants.length > 0 || (Array.isArray(contest.participants) && contest.participants.length > 0)) ? (
                <div className="group relative">
                  <SilentErrorBoundary>
                    <ParticipantsList
                      participants={
                        realtimeParticipants.length > 0 
                          ? realtimeParticipants 
                          : analyticsParticipants.length > 0
                            ? analyticsParticipants  // Use analytics data with SOL values when available
                            : enhancedParticipants.length > 0
                              ? enhancedParticipants
                              : (contest.participants || []).map(transformLegacyParticipant)
                      }
                      contestStatus={mapContestStatus(contest.status)}
                      contestId={id!}
                      prizePool={parseFloat(contest.prize_pool || '0')}  // Add missing prizePool prop
                      payoutStructure={contest?.settings?.payout_structure}
                      contestType={(contest as any)?.contest_type}
                      minParticipants={Number(contest?.min_participants || 0)}
                      maxParticipants={Number(contest?.max_participants || 0)}
                      entryFee={Number(contest?.entry_fee || 0)}
                    />
                  </SilentErrorBoundary>
                </div>
              ) : Number(contest.participant_count) > 0 ? (
                <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-200/90 to-dark-300/90 backdrop-blur-sm border border-dark-100/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">Participants ({contest.participant_count})</h3>
                    <p className="text-gray-400">
                      {isParticipating 
                        ? "You and other participants are competing in this contest." 
                        : `${contest.participant_count} ${contest.participant_count === 1 ? 'dueler has' : 'duelers have'} entered this contest.`}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Participant details will be visible once the contest starts.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-200/90 to-dark-300/90 backdrop-blur-sm border border-dark-100/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">Participants</h3>
                    {displayStatus === "cancelled" ? (
                      <p className="text-gray-400">Contest was canceled before anyone could join.</p>
                    ) : (
                      <p className="text-gray-400">No participants yet. Be the first to join!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Prize & Referral & Rules */}
            <div className="space-y-8">
              {/* Prize Distribution - Only show if prize pool > 0 */}
              {(() => {
                const prizePool = Number(contest.entry_fee) > 0 
                  ? Number(contest.entry_fee) * contest.max_participants
                  : Number(contest.total_prize_pool || contest.prize_pool || "0");
                
                if (prizePool > 0) {
                  return (
                    <div className="group relative">
                      <SilentErrorBoundary>
                        <PrizeStructure
                          prizePool={prizePool}
                          entryFee={Number(contest?.entry_fee || 0)}
                          maxParticipants={Number(contest?.max_participants || 0)}
                          currentParticipants={Number(contest?.participant_count || 0)}
                          contestType={(contest as any)?.contest_type}
                          payoutStructure={contest?.settings?.payout_structure}
                          contestStatus={displayStatus}
                          minParticipants={Number(contest?.min_participants || 0)}
                        />
                      </SilentErrorBoundary>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Referral Progress Card */}
              {displayStatus === "pending" && (contest as any)?.contest_type !== "CHALLENGE" && (
                <div className="group relative">
                  <SilentErrorBoundary>
                    <ReferralProgressCard />
                  </SilentErrorBoundary>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContestDetails;