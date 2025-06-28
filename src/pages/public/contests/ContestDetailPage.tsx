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

import { motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { AllowedTokensGrid } from "../../../components/contest-detail/AllowedTokensGrid";
import { ChallengeBadge } from "../../../components/contest-detail/ChallengeBadge";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { ReferralProgressCard } from "../../../components/contest-lobby/ReferralProgressCard";
import { ShareContestButton } from "../../../components/contest-lobby/ShareContestButton";
import { Card } from "../../../components/ui/Card";
import { CountdownTimer } from "../../../components/ui/CountdownTimer";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestLifecycle } from "../../../hooks/websocket/topic-hooks/useContestLifecycle";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import { getContestImageUrl } from "../../../lib/imageUtils";
import {
    formatCurrency,
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
  
  // Image loading states
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Mouse position tracking for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Ref to the header element for tracking relative mouse position
  const headerRef = useRef<HTMLDivElement>(null);


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

  // Check if this is a Crown Contest (Numero Uno) - same logic as ContestBrowserPage
  const isCrownContest = useMemo(() => {
    if (!contest || !contest.name) return false;
    const upperName = contest.name.toUpperCase();
    return upperName.includes('NUMERO UNO') || 
           upperName.includes('NUMERO  UNO') || // double space
           upperName.includes('NUMERO\tUNO') || // tab
           upperName.includes('NUMEROUNO'); // no space
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
              is_superadmin: p.is_superadmin || false
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

  // Mouse move handler for parallax effect (desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!headerRef.current) return;
    
    // Get card dimensions and position
    const rect = headerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center (values from -0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Update mouse position state
    setMousePosition({ x, y });
  };
  
  // Mouse enter/leave handlers
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset to center position when not hovering
    setMousePosition({ x: 0, y: 0 });
  };

  const handleCountdownComplete = () => {
    if (!contest) return;

    if (isContestCurrentlyUnderway(contest)) {
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
        // Navigate to results page for completed contests
        console.log("Navigating to contest results page");
        navigate(`/contests/${contest.id}/results`);
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
      // Contest is over, can't join
      setError("This contest has ended and is no longer accepting entries.");
      return;
    } else if (contestStatus === "live") {
      // Contest is in progress, can't join
      setError("This contest is already in progress and not accepting new entries.");
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

    // User is participating
    if (isParticipating) {
      if (displayStatus === "completed") {
        return "View Results";
      } else if (displayStatus === "active") {
        return "View Live Contest";
      } else if (displayStatus === "cancelled") {
        return "View Details";
      } else {
        return "Update Portfolio";
      }
    }

    // User is not participating
    if (displayStatus === "completed" || displayStatus === "active") {
      return displayStatus === "completed" ? "Contest Ended" : "Contest in Progress";
    } else if (displayStatus === "cancelled") {
      return "View Details";
    } else {
      return "Enter Contest";
    }
  };


  // Loading skeleton UI
  if (isLoading)
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton loading for header with image placeholder */}
          <div className="relative h-64 sm:h-80 rounded-lg overflow-hidden bg-dark-300 animate-pulse mb-8">
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

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Contest Banner with Image */}
          <div 
            ref={headerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative rounded-lg mb-8"
          >
            {/* Contest Image with Parallax Effect */}
            {getContestImageUrl(contest.image_url) && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {/* Loading state */}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300/70 z-10">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
                
                {/* Background image with parallax */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    style={{
                      width: "100%",
                      height: "100%",
                      transform: isHovering ? 
                        `scale(1.08) translateX(${mousePosition.x * 15}px) translateY(${mousePosition.y * 10}px)` : 
                        "scale(1.02)",
                      transition: "transform 0.3s ease-out"
                    }}
                  >
                    <img
                      src={getContestImageUrl(contest.image_url)}
                      alt={contest.name}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/90 to-dark-200/60" />
                </motion.div>
              </div>
            )}
            
            {/* If no image or image error, show gradient background */}
            {(!getContestImageUrl(contest.image_url) || imageError) && (
              <div className="absolute inset-0 bg-gradient-to-br from-dark-200/80 to-dark-300/80" />
            )}
            
            {/* Banner Content */}
            <div className="relative z-20 p-4 sm:p-6 md:p-8 min-h-[280px] flex flex-col justify-end">
              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4">
                {/* Different badge styles based on contest status */}
                {displayStatus === "active" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-green-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-brand-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-green-500/30 via-brand-500/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                        <span className="relative rounded-full w-2 h-2 bg-green-400"></span>
                      </span>
                      <span className="text-xs font-bold text-green-400 uppercase tracking-wide font-cyber">LIVE</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "pending" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-blue-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-brand-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-blue-500/30 via-brand-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wide font-cyber">SOON</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "completed" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-gray-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 via-brand-500/20 to-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-gray-500/30 via-brand-500/30 to-gray-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-cyber">ENDED</span>
                    </div>
                  </div>
                )}
                
                {displayStatus === "cancelled" && (
                  <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-red-500/30 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-brand-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-red-500/30 via-brand-500/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wide font-cyber">CANCELLED</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contest Header Content - Better Layout */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 max-w-full">
                {/* Left Section - Title, Description, Timer */}
                <div className="flex-1 space-y-4">
                  {/* Title and Description */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-100 mb-2">
                      {contest.name}
                    </h1>
                    <p className="text-gray-400 max-w-2xl">
                      {contest.description}
                    </p>
                  </div>
                  
                  {/* Timer Section - More prominent */}
                  <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg p-4 inline-block border border-dark-200">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          {displayStatus === "active" ? "Ends in" : 
                          displayStatus === "pending" ? "Starts in" : 
                          displayStatus === "cancelled" ? "Cancelled" : "Ended"}
                        </div>
                        {displayStatus === "cancelled" ? (
                          <span className="line-through text-red-400 text-xl font-semibold">
                            {new Date(contest.end_time).toLocaleDateString()}
                          </span>
                        ) : displayStatus !== "completed" ? (
                          <div className="text-2xl font-bold text-gray-100">
                            <CountdownTimer
                              targetDate={displayStatus === "active" ? contest.end_time : contest.start_time}
                              onComplete={handleCountdownComplete}
                              showSeconds={false}
                            />
                          </div>
                        ) : (
                          <span className="text-xl font-semibold text-gray-400">
                            {new Date(contest.end_time).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Section - Actions */}
                <div className="flex flex-col items-start lg:items-end gap-3">
                  {/* Action buttons grouped together */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleJoinContest}
                      disabled={displayStatus === "completed" || displayStatus === "cancelled"}
                      className={`px-8 py-3 font-medium rounded-lg transition-all text-center ${
                        displayStatus === "completed" || displayStatus === "cancelled"
                          ? "bg-dark-400 text-gray-500 cursor-not-allowed"
                          : isParticipating
                          ? "bg-dark-300 hover:bg-dark-200 text-brand-400"
                          : "bg-brand-500 hover:bg-brand-600 text-white"
                      }`}
                    >
                      {getButtonLabel()}
                    </button>
                    
                    {/* Share Contest Button - Inline with Enter button */}
                    {displayStatus !== "cancelled" && displayStatus !== "completed" && (contest as any)?.contest_type !== "CHALLENGE" && contest && (
                      <SilentErrorBoundary>
                        <ShareContestButton
                          contestId={contest.id.toString()}
                          contestName={contest.name}
                          prizePool={contest.total_prize_pool || contest.prize_pool || "0"}
                        />
                      </SilentErrorBoundary>
                    )}
                  </div>
                  
                  {/* Error message if any */}
                  {error && (
                    <div className="text-sm text-red-400 text-center animate-glitch bg-dark-100/90 rounded-lg py-2 px-3 border border-red-500/30 backdrop-blur-sm max-w-xs">
                      {error}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Cancellation Overlay */}
              {displayStatus === "cancelled" && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center z-10"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative bg-red-900/30 border-2 border-red-500/40 rounded py-2 px-4 backdrop-blur-sm shadow-lg max-w-[95%]">
                    <div className="flex flex-col items-center gap-1 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <motion.svg 
                          className="w-4 h-4 text-red-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </motion.svg>
                        <span className="text-sm font-bold text-red-400 uppercase">Contest Cancelled</span>
                      </div>
                      <motion.div 
                        className="text-xs text-red-300 italic"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <span className="font-semibold mr-1 uppercase">REASON:</span>
                        {contest.cancellation_reason || "Unexpected issues with the contest"}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

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

          {/* Contest Stats - Enhanced Design */}
          <div className="mb-8">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Entry Fee Card */}
              <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-200/90 to-dark-300/90 backdrop-blur-sm border border-dark-100/20">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Entry</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Entry Fee</p>
                    {Number(contest.entry_fee) === 0 ? (
                      <div className="space-y-1">
                        <p className={`text-2xl font-bold uppercase tracking-wide ${displayStatus === "cancelled" ? "text-gray-500" : "text-green-400"}`}>
                          FREE
                        </p>
                        <p className="text-xs text-green-300/60">No cost to enter</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-white"}`}>
                          {formatCurrency(Number(contest.entry_fee))}
                        </p>
                        <p className="text-xs text-gray-500">Per participant</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prize Pool Card */}
              <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-200/90 to-dark-300/90 backdrop-blur-sm border border-dark-100/20">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-brand-500/20 rounded-lg">
                      <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <span className="text-xs text-brand-400 bg-brand-400/10 px-2 py-1 rounded-full">Prize</span>
                  </div>
                  <div className="space-y-1">
                    {isCrownContest ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Prize Pool</p>
                          {Number(contest.entry_fee) > 0 && (
                            <div className="relative group/tooltip">
                              <svg className="w-3 h-3 text-brand-400/60 hover:text-brand-300 transition-colors cursor-help" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              
                              {/* Enhanced Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                <div className="bg-dark-200/95 backdrop-blur-md border border-brand-500/30 rounded-lg px-4 py-3 text-sm text-gray-200 whitespace-nowrap shadow-2xl">
                                  <div className="relative">
                                    <span className="block font-bold text-brand-300 mb-1">Maximum Prize Pool</span>
                                    <span className="block text-gray-300">with a full roster of competitors.</span>
                                    <span className="block text-brand-200">The more players, the bigger the rewards!</span>
                                  </div>
                                  {/* Enhanced Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-dark-200/95"></div>
                                    <div className="absolute -top-[9px] -left-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-brand-500/30"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent"}`}>
                            {formatCurrency(
                              Number(contest.entry_fee) > 0
                                ? Number(contest.entry_fee) * contest.max_participants
                                : Number(contest.prize_pool || "0")
                            )}
                          </p>
                          {displayStatus !== "cancelled" && Number(contest.entry_fee) > 0 && (
                            <span className="text-sm font-mono text-brand-400/80 bg-brand-500/10 px-2 py-1 rounded">
                              {contest.max_participants}x
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {Number(contest.entry_fee) > 0 ? "Maximum potential" : "Fixed prize pool"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Prize Pool</p>
                        <p className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent"}`}>
                          {formatCurrency(
                            Number(contest.entry_fee) > 0
                              ? Number(contest.entry_fee) * contest.max_participants
                              : Number(contest.total_prize_pool || contest.prize_pool || "0")
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{Number(contest.entry_fee) > 0 ? "if contest is filled" : "fixed prize pool"}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Participants Card */}
              <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-dark-200/90 to-dark-300/90 backdrop-blur-sm border border-dark-100/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">Live</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Participants</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-white"}`}>
                        {contest.participant_count}
                      </p>
                      <p className="text-sm text-gray-500">/ {contest.max_participants}</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${displayStatus === "cancelled" ? "bg-gray-500/50" : "bg-gradient-to-r from-purple-400 to-purple-600"} transition-all duration-500`}
                        style={{
                          width: `${Math.min((contest.participant_count / contest.max_participants) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Contest Info Bar */}
            <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg border border-dark-200/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-gray-300 font-medium">
                      {Math.round((new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime()) / (1000 * 60 * 60))} hours
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Format:</span>
                    <span className="text-gray-300 font-medium">
                      {(contest as any)?.contest_type === "CHALLENGE" ? "1v1 Challenge" : "Public Contest"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Winners:</span>
                    <span className="text-gray-300 font-medium">Top 3 Players</span>
                  </div>
                </div>
              </div>
            </div>
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

            {/* Right Column - Rules, Prize & Referral */}
            <div className="space-y-8">
              {/* Rules Section - At Top */}
              <div className="group relative">
                <SilentErrorBoundary>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-100 mb-4">Rules & Token Whitelist</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-blue-400 block mb-2">Rules:</span>
                        <p className="text-gray-400">Standard DegenDuel trading rules apply</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-blue-400 block mb-3">Example Tokens:</span>
                        <AllowedTokensGrid
                          maxInitialDisplay={8}
                          className="mb-2"
                        />
                      </div>
                    </div>
                  </div>
                </SilentErrorBoundary>
              </div>
              
              {/* Prize Distribution */}
              <div className="group relative">
                <SilentErrorBoundary>
                  <PrizeStructure
                    prizePool={Number(contest.entry_fee) > 0 
                      ? Number(contest.entry_fee) * contest.max_participants
                      : Number(contest.total_prize_pool || contest.prize_pool || "0")}
                    entryFee={Number(contest?.entry_fee || 0)}
                    maxParticipants={Number(contest?.max_participants || 0)}
                    currentParticipants={Number(contest?.participant_count || 0)}
                    contestType={(contest as any)?.contest_type}
                  />
                </SilentErrorBoundary>
              </div>
              
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