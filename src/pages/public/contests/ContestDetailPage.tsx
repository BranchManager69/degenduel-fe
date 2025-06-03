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
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ChallengeBadge } from "../../../components/contest-detail/ChallengeBadge";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { ReferralProgressCard } from "../../../components/contest-lobby/ReferralProgressCard";
import { ShareContestButton } from "../../../components/contest-lobby/ShareContestButton";
import { Card } from "../../../components/ui/Card";
import { CountdownTimer } from "../../../components/ui/CountdownTimer";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestLifecycle } from "../../../hooks/websocket/topic-hooks/useContestLifecycle";
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
  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useMigratedAuth();
  const [isParticipating, setIsParticipating] = useState<boolean>(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  
  // Image loading states
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Mouse position tracking for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Ref to the header element for tracking relative mouse position
  const headerRef = useRef<HTMLDivElement>(null);

  // Add a computed state for wallet connection
  const isWalletConnected = React.useMemo(() => {
    return isAuthenticated && !!user?.wallet_address;
  }, [isAuthenticated, user]);

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
          tokenTypesAllowed: Array.isArray(data.settings?.tokenTypesAllowed)
            ? data.settings.tokenTypesAllowed
            : [],
          difficulty: data.settings?.difficulty || "guppy",
        },
        participants: Array.isArray(data.contest_participants)
          ? data.contest_participants.map(
              (p: ContestParticipant): Participant => {
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
    console.log("Duel Action Button Clicked - Initial State:", {
      isWalletConnected,
      isConnected: isAuthenticated,
      walletAddress: user?.wallet_address,
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

    // Not connected to wallet - need to connect first
    if (!isAuthenticated) {
      console.log("Wallet Connection Check Failed:", {
        isWalletConnected,
        isConnected: isAuthenticated,
        walletAddress: user?.wallet_address,
        timestamp: new Date().toISOString(),
      });

      // Removed Aptos wallet connection logic
      {
        setError("Please connect your wallet to participate.");
      }
      return;
    }

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
        navigate(`/contests/${contest.id}/lobby`);
        return;
      } else {
        // For upcoming contests, allow portfolio modification
        console.log(
          "Navigating to portfolio token selection page for modification",
        );
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
      setError(
        "This contest is already in progress and not accepting new entries.",
      );
      return;
    } else {
      // Contest is upcoming, allow joining
      console.log("Navigating to portfolio token selection page:", {
        contestId: contest.id,
        userAddress: user?.wallet_address,
        timestamp: new Date().toISOString(),
      });
      navigate(`/contests/${contest.id}/select-tokens`);
      return;
    }
  };

  // Button label based on wallet connection and contest status
  const getButtonLabel = () => {
    const displayStatus = getDisplayStatus;
    
    // Not connected - always show connect wallet
    if (!isWalletConnected) {
      return "Connect Wallet to Enter";
    }

    // Connected and participating
    if (isParticipating) {
      if (displayStatus === "completed") {
        return "View Results";
      } else if (displayStatus === "active") {
        return "View Live Contest";
      } else if (displayStatus === "cancelled") {
        return "View Details";
      } else {
        return "Modify Portfolio";
      }
    }

    // Connected but not participating
    if (displayStatus === "completed" || displayStatus === "active") {
      return displayStatus === "completed" ? "Contest Ended" : "Contest in Progress";
    } else if (displayStatus === "cancelled") {
      return "View Details";
    } else {
      return "Select Your Portfolio";
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
                <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream" />
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
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <span className="relative z-10">
              {error || "Contest not found"}
            </span>
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
            className="relative overflow-hidden rounded-lg mb-8"
          >
            {/* Contest Image with Parallax Effect */}
            {getContestImageUrl(contest.image_url) && (
              <div className="absolute inset-0 overflow-hidden">
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
                        `scale(1.05) translateX(${mousePosition.x * 5}px) translateY(${mousePosition.y * 5}px)` : 
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
            <div className="relative z-10 p-4 sm:p-6 md:p-8 min-h-[280px] flex flex-col justify-end">
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
              
              {/* Contest Title and Description - Enhanced */}
              <div className="space-y-4 max-w-4xl">
                <div className="relative">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x leading-tight">
                    {contest.name}
                  </h1>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-400/20 blur-sm -z-10">
                    {contest.name}
                  </div>
                </div>
                <p className="text-base sm:text-lg text-gray-200 leading-relaxed backdrop-blur-sm bg-dark-200/20 rounded-lg p-4 border-l-4 border-brand-400/30">
                  {contest.description}
                </p>
                
                {/* Enhanced Countdown Timer with status indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      displayStatus === "active" ? "bg-green-400 animate-pulse" :
                      displayStatus === "pending" ? "bg-blue-400 animate-pulse" :
                      displayStatus === "cancelled" ? "bg-red-400" : "bg-gray-400"
                    }`} />
                    <span className="text-sm font-medium text-gray-300">
                      {displayStatus === "active" ? "Ends in:" : 
                      displayStatus === "pending" ? "Starts in:" : 
                      displayStatus === "cancelled" ? "Cancelled:" : "Ended:"}
                    </span>
                  </div>
                  
                  <div className="bg-dark-200/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-brand-400/20">
                    {displayStatus === "cancelled" ? (
                      <span className="line-through text-red-400 text-lg font-medium italic">
                        {new Date(contest.end_time).toLocaleDateString()}
                      </span>
                    ) : displayStatus !== "completed" ? (
                      <div className="text-2xl sm:text-xl font-bold text-brand-400">
                        <CountdownTimer
                          targetDate={displayStatus === "active" ? contest.end_time : contest.start_time}
                          onComplete={handleCountdownComplete}
                          showSeconds={true}
                        />
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-gray-500">
                        {new Date(contest.end_time).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Contest Action Button - Moved here for better UX */}
                <div className="mt-6">
                  <div className="max-w-md">
                    <button
                      onClick={handleJoinContest}
                      disabled={!isWalletConnected || (displayStatus !== "pending" && !isParticipating)}
                      className={`w-full relative group overflow-hidden text-lg py-4 px-6 shadow-xl transition-all duration-300 rounded-xl ${
                        !isWalletConnected || (displayStatus !== "pending" && !isParticipating)
                          ? "bg-gradient-to-r from-gray-600/40 to-gray-700/40 border-2 border-gray-500/30 text-gray-400 cursor-not-allowed"
                          : displayStatus === "pending" && !isParticipating
                          ? "bg-gradient-to-r from-brand-500 to-brand-600 border-2 border-brand-400/50 text-white hover:from-brand-400 hover:to-brand-500 hover:border-brand-300 hover:shadow-brand-500/30"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 border-2 border-emerald-400/50 text-white hover:from-emerald-400 hover:to-emerald-500 hover:border-emerald-300"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-white/4 to-white/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center justify-center gap-3">
                        <span className="font-semibold">{getButtonLabel()}</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </button>
                    
                    {error && (
                      <div className="mt-3 text-sm text-red-400 text-center animate-glitch bg-dark-100/90 rounded-lg py-2 px-3 border border-red-500/30 backdrop-blur-sm">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Share Contest Button - Desktop Only - Hide for cancelled/completed/challenge contests */}
                {displayStatus !== "cancelled" && displayStatus !== "completed" && (contest as any)?.contest_type !== "CHALLENGE" && (
                  <div className="hidden md:flex mt-4">
                    <SilentErrorBoundary>
                      <ShareContestButton
                        contestId={contest.id.toString()}
                        contestName={contest.name}
                        prizePool={(Number(contest.entry_fee) * contest.participant_count * 0.95).toString()}
                      />
                    </SilentErrorBoundary>
                  </div>
                )}
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

          {/* Contest Stats - Consolidated */}
          <div className="mb-8">
            <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30 hover:border-brand-400/50"} transition-all duration-300 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 relative">
                <h3 className="text-xl font-bold text-gray-100 mb-6">Contest Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Entry Fee */}
                  <div className="text-center md:text-left">
                    <span className={`block text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-400"} mb-2`}>
                      Entry Fee
                    </span>
                    <div className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600"}`}>
                      {formatCurrency(Number(contest.entry_fee))}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      per participant
                    </div>
                  </div>
                  
                  {/* Prize Pool */}
                  <div className="text-center md:text-left">
                    <span className={`block text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-400"} mb-2`}>
                      Current Prize Pool
                    </span>
                    <div className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600"}`}>
                      {formatCurrency(Number(contest.entry_fee) * contest.participant_count * 0.95)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      grows with participation
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="text-center md:text-left">
                    <span className={`block text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-400"} mb-2`}>
                      Participants
                    </span>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600"}`}>
                        {contest.participant_count}
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="w-16 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${displayStatus === "cancelled" ? "bg-gray-500/50" : "bg-gradient-to-r from-brand-400 to-brand-600"} transition-all duration-300`}
                            style={{
                              width: `${Math.min((contest.participant_count / contest.max_participants) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5">
                          of {contest.max_participants}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules & Tokens Section - Mobile Only */}
          <div className="mb-8 lg:hidden">
            <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h3 className="text-xl font-bold text-gray-100 mb-4">Contest Rules & Tokens</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-brand-400 block mb-2">Rules:</span>
                  <p className="text-gray-400">Standard DegenDuel trading rules apply</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-brand-400 block mb-2">Allowed Tokens:</span>
                  {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {contest.settings.tokenTypesAllowed.map((token: string) => (
                        <span
                          key={token}
                          className="px-3 py-1.5 bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 rounded-md"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">All tokens available for selection</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile share button - Hide for cancelled/completed/challenge contests */}
            {displayStatus !== "cancelled" && displayStatus !== "completed" && (contest as any)?.contest_type !== "CHALLENGE" && (
              <div className="mb-8 md:hidden">
                <SilentErrorBoundary>
                  <ShareContestButton
                    contestId={contest.id.toString()}
                    contestName={contest.name}
                    prizePool={(Number(contest.entry_fee) * contest.participant_count * 0.95).toString()}
                    className="w-full"
                  />
                </SilentErrorBoundary>
              </div>
            )}
          </div>

          {/* Content Grid - Simplified */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Rules and Tokens */}
            <div className="space-y-8">
              {/* Rules Section */}
              <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6`}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-100">
                    Rules & Token Whitelist
                  </h3>
                  <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                    Contest Parameters
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-brand-400 block mb-2">Rules:</span>
                    <p className="text-gray-400">Standard DegenDuel trading rules apply</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-brand-400 block mb-2">Allowed Tokens:</span>
                    {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {contest.settings.tokenTypesAllowed.map((token: string) => (
                          <span
                            key={token}
                            className="px-3 py-1.5 bg-dark-300/50 text-sm text-gray-300 border border-brand-400/30 rounded-md"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">All tokens available for selection</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Prize Distribution & Participants */}
            <div className="space-y-8">
              {/* Referral Progress Card - Only show for pending public contests */}
              {displayStatus === "pending" && (contest as any)?.contest_type !== "CHALLENGE" && (
                <SilentErrorBoundary>
                  <ReferralProgressCard />
                </SilentErrorBoundary>
              )}
              
              {/* Prize Distribution */}
              <div className="group relative">
                <SilentErrorBoundary>
                  <PrizeStructure
                    prizePool={Number(contest.entry_fee) * contest.participant_count * 0.95}
                    entryFee={Number(contest?.entry_fee || 0)}
                    maxParticipants={Number(contest?.max_participants || 0)}
                    currentParticipants={Number(contest?.participant_count || 0)}
                    platformFeePercentage={5}
                  />
                </SilentErrorBoundary>
              </div>

              {/* Participants List */}
              {Array.isArray(contest.participants) && contest.participants.length > 0 ? (
                <div className="group relative">
                  <SilentErrorBoundary>
                    <ParticipantsList
                      participants={contest.participants}
                      contestStatus={mapContestStatus(contest.status)}
                    />
                  </SilentErrorBoundary>
                </div>
              ) : Number(contest.participant_count) > 0 ? (
                <div className={`relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6`}>
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
              ) : (
                <div className={`relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6`}>
                  <h3 className="text-xl font-bold text-gray-100 mb-4">Participants</h3>
                  <p className="text-gray-400">No participants yet. Be the first to join!</p>
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