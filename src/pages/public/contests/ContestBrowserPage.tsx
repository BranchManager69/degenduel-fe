// src/pages/public/ContestBrowserPage.tsx

/**
 * Contest Browser Page
 *    a.k.a. Contest Explorer
 *    a.k.a. Duel Explorer
 * 
 * @description This page displays a list of contests and allows users to filter and sort them.
 * 
 * CRITICAL LOADING STRATEGY:
 * 1. Load cached data immediately (if available) - users see something instantly
 * 2. Fetch fresh data via REST API immediately on mount - don't wait for WebSocket
 * 3. WebSocket provides live updates but is NOT the primary data source
 * 4. Show skeleton loaders only if we have no data to display
 * 
 * This ensures users ALWAYS see content quickly instead of waiting 10+ seconds
 * 
 * @author BranchManager69
 * @version 2.1.1
 * @created 2025-01-01
 * @updated 2025-06-04
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChallengeFriendButton } from "../../../components/contest-browser/ChallengeFriendButton";
import { ContestCard } from "../../../components/contest-browser/ContestCard";
import { CreateContestButton } from "../../../components/contest-browser/CreateContestButton";
import { CreateContestModal } from "../../../components/contest-browser/CreateContestModal";
import { ProminentContestCard } from "../../../components/contest-browser/ProminentContestCard";
import { AuthDebugPanel } from "../../../components/debug";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContests } from "../../../hooks/websocket/topic-hooks/useContests";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Contest } from "../../../types/index";

// Contest browser page
export const ContestBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { isAdministrator, isAuthenticated, getToken } = useMigratedAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableCredits, setAvailableCredits] = useState<number | undefined>(undefined);
  const [isRestLoading, setIsRestLoading] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hideCancelled, setHideCancelled] = useState(true);

  // **NEW: Use WebSocket-based contest data instead of REST API**
  const {
    contests: wsContests,
    isLoading: wsLoading,
    isConnected: wsConnected,
    error: wsError,
    lastUpdate: wsLastUpdate,
    refreshContests: wsRefreshContests
  } = useContests();

  // **Convert WebSocket contest data to local format if needed**
  const contests = useMemo(() => {
    // ALWAYS check cached data first for immediate display
    const cachedContests = useStore.getState().contests || [];
    
    if (!wsContests || wsContests.length === 0) {
      // Use cached contests while loading
      return cachedContests;
    }

    // Convert WebSocket Contest format to main Contest format
    return wsContests.map(contest => ({
      ...contest,
      id: (contest as any).contest_id || (contest as any).id || '',
      allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Default buckets
      participant_count: (contest as any).entry_count || 0,
      settings: {
        difficulty: (contest as any).difficulty || 'guppy',
        maxParticipants: null,
        minParticipants: 3,
        tokenTypesAllowed: [],
        startingPortfolioValue: '1000'
      },
      min_participants: (contest as any).min_participants,
      max_participants: (contest as any).max_participants,
      // Debug: Check all possible participation field names
      is_participating: (contest as any).joined || (contest as any).participating || (contest as any).is_participating || false,
      contest_code: (contest as any).contest_id || (contest as any).id || '',
      image_url: undefined,
      participants: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as unknown as Contest[];
  }, [wsContests]);

  // Smart loading state - show loading only if we have no data and are actively loading
  const loading = (wsLoading || isRestLoading) && contests.length === 0;
  const error = wsError || (!wsConnected && !wsLoading && !isRestLoading && contests.length === 0 ? "Failed to load contests" : null);

  // Fetch user credits
  const fetchUserCredits = async () => {
    if (!isAuthenticated) {
      setAvailableCredits(0);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch('/api/contests/credits/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableCredits(data.data.available_credits || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
      setAvailableCredits(0);
    }
  };

  // **FALLBACK: REST API retry function for compatibility**
  const fetchContestsViaRest = async () => {
    try {
      setIsRestLoading(true);
      console.log("[ContestBrowserPage] Fetching contests via REST API");

      // First check maintenance mode
      const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
      setIsMaintenanceMode(isInMaintenance);

      // If in maintenance mode, don't fetch contests
      if (isInMaintenance) {
        setIsRestLoading(false);
        return;
      }

      const data = await ddApi.contests.getAll({
        field: "start_time" as any,
        direction: "asc" as any,
      });
      
      // Update Zustand store with fallback REST API data
      useStore.getState().setContests(data);
      console.log("[ContestBrowserPage] REST API loaded", data.length, "contests");
    } catch (error) {
      console.error("Failed to fetch contests via REST:", error);
      // Check if the error is a 503 (maintenance mode)
      if (error instanceof Error && error.message.includes("503")) {
        setIsMaintenanceMode(true);
      }
    } finally {
      setIsRestLoading(false);
    }
  };

  // Initial setup and periodic maintenance check
  useEffect(() => {
    fetchUserCredits();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  // **CRITICAL: Load data IMMEDIATELY - don't wait for WebSocket!**
  useEffect(() => {
    // Step 1: Show cached data immediately if available
    const cachedContests = useStore.getState().contests;
    console.log('[ContestBrowserPage] Initial load - cached contests:', cachedContests?.length || 0);
    
    // Step 2: ALWAYS fetch fresh data via REST API immediately
    // Don't wait 10 seconds! Users are gone by then!
    fetchContestsViaRest();
    
    // Step 3: WebSocket will provide live updates when connected
    // But we don't depend on it for initial load
  }, []); // Only run once on mount
  

  // Manual refresh function that prefers WebSocket but falls back to REST API
  const handleManualRefresh = () => {
    if (wsConnected) {
      console.log('[ContestBrowserPage] Manual refresh via WebSocket');
      wsRefreshContests();
    } else {
      console.log('[ContestBrowserPage] Manual refresh via REST API fallback');
      fetchContestsViaRest();
    }
  };

  // Filter and smart sort contests
  const filteredAndSortedContests = useMemo(() => {
    const now = new Date();
    
    // First, filter based on checkboxes
    const filtered = contests.filter((contest) => {
      const endTime = new Date(contest.end_time);
      const isCompleted = now >= endTime || contest.status === "completed";
      const isCancelled = contest.status === "cancelled";

      if (isCompleted && hideCompleted) return false;
      if (isCancelled && hideCancelled) return false;

      return true;
    });
    
    // Then apply smart sorting
    return filtered.sort((a, b) => {
      const aStart = new Date(a.start_time);
      const aEnd = new Date(a.end_time);
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      
      const aIsLive = now >= aStart && now < aEnd && a.status !== "cancelled";
      const bIsLive = now >= bStart && now < bEnd && b.status !== "cancelled";
      const aIsUpcoming = now < aStart && a.status !== "cancelled";
      const bIsUpcoming = now < bStart && b.status !== "cancelled";
      
      // 1. Live contests first
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      // 2. Among live contests, sort by most participants
      if (aIsLive && bIsLive) {
        return b.participant_count - a.participant_count;
      }
      
      // 3. Upcoming contests next
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      
      // 4. Among upcoming contests, sort by start time
      if (aIsUpcoming && bIsUpcoming) {
        const timeDiff = aStart.getTime() - bStart.getTime();
        // If starting at roughly the same time (within 1 hour), use participant count as tiebreaker
        if (Math.abs(timeDiff) < 3600000) {
          return b.participant_count - a.participant_count;
        }
        return timeDiff;
      }
      
      // 5. Everything else (completed) by most recent end time
      return bEnd.getTime() - aEnd.getTime();
    });
  }, [contests, hideCompleted, hideCancelled]);

  // Show skeleton loaders ONLY if we have no contests to display
  if (loading && filteredAndSortedContests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show header immediately */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">
            Duel Explorer
          </h1>
        </div>
        
        {/* Show skeleton cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-dark-200 rounded-lg h-64 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream-responsive" />
              <div className="p-6 space-y-4">
                <div className="h-6 bg-dark-300 rounded w-3/4" />
                <div className="h-4 bg-dark-300 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-dark-300 rounded" />
                  <div className="h-3 bg-dark-300 rounded w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* WebSocket Connection Status */}
        <div className="mt-4 flex justify-center items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className={`font-mono ${wsConnected ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {isRestLoading ? 'LOADING.VIA.API' : wsConnected ? 'CONNECTING.TO.LIVE.DATA' : 'LOADING.CONTESTS'}
          </span>
        </div>
      </div>
    );
  }

  // Maintenance mode
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

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
          <p>{error}</p>
          <button
            onClick={handleManualRefresh}
            className="mt-4 px-4 py-2 bg-dark-400/50 hover:bg-dark-400 rounded text-emerald-400 text-sm transition-all duration-300 hover:scale-105"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Contest browser page
  return (
    <div className="flex flex-col min-h-screen">
      {/* Auth Debug Panel */}
      <AuthDebugPanel position="top-right" />
      
      {/* Content Section */}
      <div className="relative flex-1" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb navigation */}
          <div className="mb-4 flex items-center text-sm text-gray-400">
            <Link to="/" className="hover:text-brand-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-300">Contests</span>
          </div>

          {/* Enhanced Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative group">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 relative group">
              <span className="relative z-10 group-hover:animate-glitch">
                Duel Explorer
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            </h1>
            <div className="flex gap-3">
              <CreateContestButton
                onCreateClick={() => setIsCreateModalOpen(true)}
              />
              <ChallengeFriendButton
                onChallengeCreated={() => {
                  handleManualRefresh();
                  fetchUserCredits(); // Refresh credits after challenge creation
                }}
                userRole={isAdministrator ? "admin" : "user"}
                availableCredits={availableCredits}
              />
            </div>
            
          </div>

          {/* Filter Controls */}
          <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`group relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                hideCompleted
                  ? "bg-dark-300 border border-brand-500/50 text-brand-400"
                  : "bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-300 hover:border-dark-300"
              }`}
            >
              <div className="relative w-4 h-4">
                <div className={`absolute inset-0 rounded border-2 transition-all duration-200 ${
                  hideCompleted
                    ? "bg-brand-500 border-brand-500"
                    : "bg-dark-400/50 border-gray-600 group-hover:border-gray-500"
                }`}>
                  {hideCompleted && (
                    <svg className="absolute inset-0 w-full h-full p-0.5" viewBox="0 0 20 20" fill="white">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span>Hide Completed</span>
              {hideCompleted && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 rounded-lg pointer-events-none" />
              )}
            </button>
            
            <button
              onClick={() => setHideCancelled(!hideCancelled)}
              className={`group relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                hideCancelled
                  ? "bg-dark-300 border border-red-500/50 text-red-400"
                  : "bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-300 hover:border-dark-300"
              }`}
            >
              <div className="relative w-4 h-4">
                <div className={`absolute inset-0 rounded border-2 transition-all duration-200 ${
                  hideCancelled
                    ? "bg-red-500 border-red-500"
                    : "bg-dark-400/50 border-gray-600 group-hover:border-gray-500"
                }`}>
                  {hideCancelled && (
                    <svg className="absolute inset-0 w-full h-full p-0.5" viewBox="0 0 20 20" fill="white">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span>Hide Cancelled</span>
              {hideCancelled && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 rounded-lg pointer-events-none" />
              )}
            </button>
            </div>
            
            {/* Enhanced WebSocket Connection Status */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`font-mono ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {wsConnected ? 'WebSocket' : 'REST API'}
                </span>
              </div>
              
              {wsLastUpdate && (
                <div className="text-gray-500">
                  <span className="hidden sm:inline">Updated: </span>
                  <span className="font-mono">{wsLastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
              
              <div className={`px-2 py-1 rounded-md text-xs font-mono ${
                wsConnected 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {wsConnected ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>

          {/* Enhanced Contest Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedContests.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12 bg-dark-200/50 rounded-lg animate-fade-in">
                No duels matching these filters
              </div>
            ) : (
              filteredAndSortedContests.map((contest) => {
                // Check if this is a Crown Contest (Numero Uno)
                const upperName = contest.name.toUpperCase();
                const isCrownContest = upperName.includes('NUMERO UNO') || 
                                      upperName.includes('NUMERO  UNO') || // double space
                                      upperName.includes('NUMERO\tUNO') || // tab
                                      upperName.includes('NUMEROUNO'); // no space
                
                return (
                  <div
                    key={contest.id}
                    className="transform hover:scale-102 transition-transform duration-300"
                  >
                    {isCrownContest ? (
                      <ProminentContestCard
                        contest={contest}
                        onClick={() => navigate(`/contests/${contest.id}`)}
                        featuredLabel="👑 CROWN CONTEST"
                      />
                    ) : (
                      <ContestCard
                        contest={contest}
                        onClick={() => navigate(`/contests/${contest.id}`)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Create Contest Modal */}
          <CreateContestModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            userRole={isAdministrator ? "admin" : "user"}
            availableCredits={availableCredits}
            onSuccess={() => {
              handleManualRefresh();
              fetchUserCredits(); // Refresh credits after contest creation
            }}
          />
        </div>
      </div>
    </div>
  );
};
