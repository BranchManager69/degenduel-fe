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
import { ContestSort } from "../../../components/contest-browser/ContestSort";
import { CreateContestButton } from "../../../components/contest-browser/CreateContestButton";
import { CreateContestModal } from "../../../components/contest-browser/CreateContestModal";
import { ProminentContestCard } from "../../../components/contest-browser/ProminentContestCard";
import { AuthDebugPanel } from "../../../components/debug";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContests } from "../../../hooks/websocket/topic-hooks/useContests";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Contest } from "../../../types/index";
import type { SortDirection, SortField } from "../../../types/sort";

// Contest browser page
export const ContestBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { isAdministrator, isAuthenticated, getToken } = useMigratedAuth();
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("start_time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableCredits, setAvailableCredits] = useState<number | undefined>(undefined);
  const [isRestLoading, setIsRestLoading] = useState(false);

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
      min_participants: 3,
      max_participants: 100,
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
        field: sortField,
        direction: sortDirection,
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
  
  // Refresh data when sort changes
  useEffect(() => {
    if (contests.length > 0) {
      fetchContestsViaRest();
    }
  }, [sortField, sortDirection]);

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

  // Filter and sort contests
  const filteredAndSortedContests = useMemo(() => {
    let filtered = [...contests];

    // Apply status filter first - this determines what contests to show
    if (activeStatusFilter !== "all") {
      filtered = filtered.filter((contest) => {
        const now = new Date();
        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);

        switch (activeStatusFilter) {
          case "live":
            return (
              now >= startTime &&
              now < endTime &&
              contest.status !== "cancelled"
            );
          case "upcoming":
            return now < startTime && contest.status !== "cancelled";
          case "completed":
            return now >= endTime || contest.status === "completed";
          case "cancelled":
            return contest.status === "cancelled";
          default:
            return true;
        }
      });
    } else {
      // When "all" is selected, apply the completed/cancelled toggles
      filtered = filtered.filter((contest) => {
        const now = new Date();
        const endTime = new Date(contest.end_time);
        const isCompleted = now >= endTime || contest.status === "completed";
        const isCancelled = contest.status === "cancelled";

        // If it's completed and we don't want to show completed, filter it out
        if (isCompleted && !showCompleted) return false;

        // If it's cancelled and we don't want to show cancelled, filter it out
        if (isCancelled && !showCancelled) return false;

        return true;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const getValue = (contest: Contest) => {
        switch (sortField) {
          case "start_time":
            return new Date(contest.start_time).getTime();
          case "participant_count":
            return contest.participant_count;
          case "prize_pool":
            return Number(contest.prize_pool);
          case "entry_fee":
            return Number(contest.entry_fee);
          default:
            return 0;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [
    contests,
    activeStatusFilter,
    sortField,
    sortDirection,
    showCompleted,
    showCancelled,
  ]);

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
            
            {/* WebSocket Connection Status */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`font-mono ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {wsConnected ? 'LIVE.DATA' : 'OFFLINE'}
              </span>
              {wsLastUpdate && (
                <span className="text-gray-500">
                  Updated: {wsLastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="md:hidden w-full mb-4 px-4 py-2 bg-dark-200 rounded-lg text-gray-100 flex items-center justify-between relative group hover:bg-dark-300/50 transition-colors"
          >
            <span className="flex items-center space-x-2 group-hover:animate-cyber-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sort/Filter</span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform duration-300 ${
                isFilterMenuOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Enhanced Filters Section */}
          <div
            className={`${
              isFilterMenuOpen ? "block" : "hidden"
            } md:block mb-8 space-y-4 bg-dark-200/50 backdrop-blur-sm p-4 rounded-lg border border-dark-300 relative group animate-fade-in`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive rounded-lg" />
            <div className="relative z-10">
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-4">
                {/* Status Filter - Now as buttons */}
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <label className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors mb-2 block">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "upcoming", label: "Joinable" },
                      { value: "live", label: "Live" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setActiveStatusFilter(value)}
                        className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                          activeStatusFilter === value
                            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                            : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>


                {/* Include Finished Duels - Now as toggle buttons */}
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <label className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors mb-2 block">
                    Include Finished
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                        showCompleted
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {showCompleted ? "✓" : ""} Completed
                      </span>
                    </button>
                    <button
                      onClick={() => setShowCancelled(!showCancelled)}
                      className={`px-4 py-2 rounded-lg text-sm flex-1 transition-all duration-200 ${
                        showCancelled
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-dark-300/50 text-gray-400 hover:bg-dark-300 hover:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {showCancelled ? "✓" : ""} Cancelled
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sort Controls - Keep as is since it looks good */}
              <div className="pt-4 border-t border-dark-400">
                <ContestSort
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={(field: SortField, direction: SortDirection) => {
                    setSortField(field);
                    setSortDirection(direction);
                    handleManualRefresh();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Active Filters Display */}
          {activeStatusFilter !== "all" && (
            <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
              {activeStatusFilter !== "all" && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-sm group hover:bg-brand-500/30 transition-all duration-300">
                  <span className="group-hover:animate-glitch">
                    {activeStatusFilter}
                  </span>
                  <button
                    onClick={() => setActiveStatusFilter("all")}
                    className="ml-2 hover:text-brand-200 group-hover:animate-neon-flicker"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

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
