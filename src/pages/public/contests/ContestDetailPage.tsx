// src/pages/public/contests/ContestDetailPage.tsx

/**
 * Contest Detail Page
 * 
 * @description This file contains the ContestDetailPage component, which displays detailed information about a contest.
 * It includes a countdown timer, prize structure, participants list, and other details.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-01-01
 * @updated 2025-05-08
 */

import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { Card } from "../../../components/ui/Card";
import { CountdownTimer } from "../../../components/ui/CountdownTimer";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { getContestImageUrl } from "../../../lib/imageUtils";
import {
    formatCurrency,
    isContestCurrentlyUnderway,
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

  useEffect(() => {
    console.log("Wallet State:", {
      isConnected: isAuthenticated,
      walletAddress: user?.wallet_address,
      timestamp: new Date().toISOString(),
    });
  }, [isAuthenticated, user?.wallet_address]);

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
  }, [id, user]);

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

  // Button is disabled in these cases
  const isButtonDisabled = () => {
    const displayStatus = getDisplayStatus;
    return (
      !isWalletConnected ||
      (!isParticipating && 
        (displayStatus === "completed" || 
         displayStatus === "active"))
    );
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
              
              {/* Contest Title and Description */}
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x">
                  {contest.name}
                </h1>
                <p className="text-base sm:text-lg text-gray-300">
                  {contest.description}
                </p>
                
                {/* Countdown Timer with status indicator */}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm text-gray-400">
                    {displayStatus === "active" ? "Ends in:" : 
                    displayStatus === "pending" ? "Starts in:" : 
                    displayStatus === "cancelled" ? "Cancelled:" : "Ended:"}
                  </span>
                  
                  {displayStatus === "cancelled" ? (
                    <span className="line-through text-red-400 text-lg font-medium italic">
                      {new Date(contest.end_time).toLocaleDateString()}
                    </span>
                  ) : displayStatus !== "completed" ? (
                    <div className="text-xl font-bold text-brand-400 animate-pulse">
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
                
                {/* Share Button - Desktop Only */}
                <div className="hidden md:flex mt-4 items-center gap-3">
                  <span className="text-sm text-gray-400">Share:</span>
                  <div className="flex gap-2">
                    {/* Twitter/X Share Button */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=Join%20me%20in%20${encodeURIComponent(contest.name)}%20on%20DegenDuel!&url=${encodeURIComponent(window.location.href)}${user?.wallet_address ? `&hashtags=DegenDuel,Crypto,Trading,Referral_${user.wallet_address.slice(0, 8)}` : "&hashtags=DegenDuel,Crypto,Trading"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-dark-300/80 hover:bg-dark-300 text-brand-400 hover:text-brand-300 rounded-md transition-colors duration-300 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
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
                      className="flex items-center gap-2 px-3 py-1.5 bg-dark-300/80 hover:bg-dark-300 text-gray-300 hover:text-white rounded-md transition-colors duration-300 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
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

          {/* Entry Fee and Prize Pool Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Entry Fee Card */}
            <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30 hover:border-brand-400/50"} transition-all duration-300 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 relative">
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-400 group-hover:text-brand-300"} transition-colors mb-2`}>
                    Entry Fee
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x"}`}>
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
            <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30 hover:border-brand-400/50"} transition-all duration-300 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="p-6 relative">
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-400 group-hover:text-brand-300"} transition-colors mb-2`}>
                    Estimated Prize Pool
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 group-hover:animate-gradient-x"}`}>
                      {formatCurrency(Number(contest?.max_prize_pool || 0))}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-1 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${displayStatus === "cancelled" ? "bg-gray-500/50" : "bg-gradient-to-r from-brand-400 to-brand-600"} transition-all duration-300`}
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

          {/* Rules & Tokens Section - Mobile Accordions */}
          <div className="mb-8 md:hidden">
            <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6 mb-4`}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Rules Section - Expandable/Collapsible */}
              <details className="mb-4">
                <summary className="flex items-center justify-between mb-4 cursor-pointer">
                  <h3 className="text-xl font-bold text-gray-100">
                    Rules of the Duel
                  </h3>
                  <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                    Info Only
                  </span>
                </summary>

                <div className="relative overflow-hidden transition-all duration-300">
                  {/* Placeholder for where rules were displayed:
                  {contest?.settings?.rules &&
                  contest.settings.rules.length > 0 ? (
                    <ContestRules rules={contest.settings.rules} />
                  ) : (
                    <p className="text-gray-400">
                      No rules in this duel; anything goes. It's every degen
                      for himself.
                    </p>
                  )}
                  */}
                </div>
              </details>

              {/* Token Whitelist Section - Expandable/Collapsible */}
              <details>
                <summary className="flex items-center justify-between mb-4 cursor-pointer">
                  <h3 className="text-xl font-bold text-gray-100">
                    Token Whitelist
                  </h3>
                  <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                    {/* Placeholder for where token types were displayed, assuming it's adjusted:
                    {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                      <div className="mt-2 space-x-2">
                        {contest.settings.tokenTypesAllowed.map((tokenType: string) => (
                          <Badge key={tokenType} variant="secondary">{tokenType.toUpperCase()}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Any token type allowed.</p>
                    )}
                    */}
                  </span>
                </summary>

                <div className="relative overflow-hidden transition-all duration-300">
                  {/* Placeholder for where token types were displayed, assuming it's adjusted:
                  {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {contest.settings.tokenTypesAllowed.map((token: string) => (
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
                  */}
                </div>
              </details>
            </div>
            
            {/* Mobile share buttons */}
            <div className="flex gap-2 mb-8 md:hidden">
              {/* Twitter/X Share Button */}
              <a
                href={`https://twitter.com/intent/tweet?text=Join%20me%20in%20${encodeURIComponent(contest.name)}%20on%20DegenDuel!&url=${encodeURIComponent(window.location.href)}${user?.wallet_address ? `&hashtags=DegenDuel,Crypto,Trading,Referral_${user.wallet_address.slice(0, 8)}` : "&hashtags=DegenDuel,Crypto,Trading"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dark-300/80 hover:bg-dark-300 text-brand-400 hover:text-brand-300 rounded-md transition-colors duration-300"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="font-medium">Share on X</span>
              </a>

              {/* Copy Link Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // You could add a toast notification here
                  alert("Link copied to clipboard!");
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-dark-300/80 hover:bg-dark-300 text-gray-300 hover:text-white rounded-md transition-colors duration-300"
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

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Rules and Tokens in Parent Container (Desktop Only) */}
            <div className="lg:col-span-2 hidden md:block">
              <div className={`group relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"} p-6`}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Rules Section */}
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
                    {/* Placeholder for where rules were displayed:
                    {contest?.settings?.rules &&
                    contest.settings.rules.length > 0 ? (
                      <ContestRules rules={contest.settings.rules} />
                    ) : (
                      <p className="text-gray-400">
                        No rules in this duel; anything goes. It's every degen
                        for himself.
                      </p>
                    )}
                    */}
                  </div>
                </div>

                {/* Token Whitelist Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-100">
                      Token Whitelist
                    </h3>
                    <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
                      {/* Placeholder for where token types were displayed, assuming it's adjusted:
                      {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                        <div className="mt-2 space-x-2">
                          {contest.settings.tokenTypesAllowed.map((tokenType: string) => (
                            <Badge key={tokenType} variant="secondary">{tokenType.toUpperCase()}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span>Any</span>
                      )}
                      */}
                    </span>
                  </div>

                  <div className="relative overflow-hidden transition-all duration-300">
                    {/* Placeholder for where token types were displayed, assuming it's adjusted:
                    {contest?.settings?.tokenTypesAllowed && contest.settings.tokenTypesAllowed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {contest.settings.tokenTypesAllowed.map((token: string) => (
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
                    */}
                  </div>
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
                    <div className={`relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"}`}>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">
                          Duelers
                        </h3>
                        <p className="text-gray-400">
                          No duelers have entered yet.
                        </p>
                        {!isParticipating && displayStatus === "pending" && (
                          <div className="mt-4">
                            <button
                              onClick={handleJoinContest}
                              disabled={!isWalletConnected}
                              className="px-4 py-2 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:text-brand-300 rounded-md transition-colors duration-300 flex items-center gap-2"
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
                              <span>Be the First to Join</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className={`relative bg-dark-200/80 backdrop-blur-sm border-l-2 ${displayStatus === "cancelled" ? "border-red-500/30" : "border-brand-400/30"}`}>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-100 mb-4">
                        Duelers
                      </h3>
                      <p className="text-gray-400">No duelers yet.</p>
                      {!isParticipating && displayStatus === "pending" && (
                        <div className="mt-4">
                          <button
                            onClick={handleJoinContest}
                            disabled={!isWalletConnected}
                            className="px-4 py-2 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 hover:text-brand-300 rounded-md transition-colors duration-300 flex items-center gap-2"
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
                            <span>Be the First to Join</span>
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

        {/* Mobile Floating Action Button - With Safe Distance from Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 to-transparent z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}>
          <div className="max-w-md mx-auto">
            {/* Mobile Action Button */}
            <button
              onClick={handleJoinContest}
              disabled={isButtonDisabled()}
              className={`
                w-full relative group overflow-hidden text-sm py-4 shadow-lg 
                ${displayStatus === "cancelled" 
                  ? "bg-red-900/10 shadow-red-500/20 border-red-500/30 text-red-400" 
                  : displayStatus === "active" 
                    ? (isParticipating ? "bg-green-500/20 shadow-green-500/20 border-green-500/30 text-green-400" : "bg-dark-300/50 text-gray-400 cursor-not-allowed")
                    : displayStatus === "completed"
                      ? (isParticipating ? "bg-gray-500/20 shadow-gray-500/20 border-gray-500/30 text-gray-300" : "bg-dark-300/50 text-gray-400 cursor-not-allowed")
                      : (isParticipating ? "bg-dark-300/90 shadow-brand-500/20 border-brand-400/50 text-brand-400" : "bg-gradient-to-r from-brand-500 to-brand-600 shadow-brand-500/20 text-white")
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
              <span className="relative flex items-center justify-center gap-2">
                <span className="font-medium">{getButtonLabel()}</span>
                {!isButtonDisabled() && (
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </span>
            </button>
            
            {error && (
              <div className="mt-2 text-xs text-red-400 text-center animate-glitch bg-dark-100/95 rounded-lg py-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) on desktop */}
        <div className="hidden md:block fixed top-24 md:top-32 right-6 md:right-10 z-40">
          <div className="relative group">
            {/* Animated glow effect for certain states */}
            {!isButtonDisabled() && displayStatus !== "cancelled" && (
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-cyan-400 rounded-lg blur opacity-75 group-hover:opacity-100 animate-pulse-slow"></div>
            )}
            
            <button
              onClick={handleJoinContest}
              disabled={isButtonDisabled()}
              className={`
                relative flex items-center gap-2 px-6 md:px-8 py-4 md:py-5 
                ${displayStatus === "cancelled" 
                  ? "bg-red-900/10 border-2 border-red-500/30 text-red-400" 
                  : displayStatus === "active" 
                    ? (isParticipating 
                        ? "bg-green-500/20 border-2 border-green-500/30 text-green-400" 
                        : "bg-dark-300/50 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed")
                    : displayStatus === "completed"
                      ? (isParticipating 
                          ? "bg-gray-500/20 border-2 border-gray-500/30 text-gray-300" 
                          : "bg-dark-300/50 border-2 border-gray-500/20 text-gray-400 cursor-not-allowed")
                      : (isParticipating 
                          ? "bg-dark-300/90 border-2 border-brand-400/30 text-brand-400" 
                          : "bg-gradient-to-r from-brand-500 to-brand-600 border-2 border-white/10 text-white shadow-2xl")
                }
                font-bold text-lg md:text-xl rounded-lg transform hover:scale-105 transition-all duration-300`}
            >
              {/* Icon based on state */}
              {displayStatus === "active" && isParticipating ? (
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
              ) : displayStatus === "completed" && isParticipating ? (
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
              ) : displayStatus === "pending" && isParticipating ? (
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
              ) : displayStatus === "cancelled" ? (
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : displayStatus === "pending" && !isButtonDisabled() ? (
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
              ) : null}
              
              <span>{getButtonLabel()}</span>
              
              {!isButtonDisabled() && (
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
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestDetails;