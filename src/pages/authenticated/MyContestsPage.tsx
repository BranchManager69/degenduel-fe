// src/pages/authenticated/MyContestsPage.tsx

/**
 * My Contests Page - SIMPLIFIED 2025-01-11
 * 
 * CLEAN APPROACH:
 * 1. Simple REST API only (no complex WebSocket)
 * 2. Proper TypeScript types (no 'as any')
 * 3. Smart caching for instant display
 * 4. Mobile-optimized with swipe gestures
 * 5. Better empty states and loading
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FaBan,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaHourglassHalf,
  FaRedo,
  FaTrophy,
  FaList,
  FaThLarge
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "../../components/contest-browser/ContestCard";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { SearchInput } from "../../components/ui/SearchInput";
import NanoLogo from "../../components/logo/NanoLogo";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest } from "../../types";
import { ContestHistoryList } from "../../components/profile/contest-history/ContestHistoryList";
import { UserPortfolio } from "../../types/profile";

// Proper TypeScript interface for user participation data
interface UserParticipation {
  contest_id: number;
  contest: Contest;
  portfolio_value: number;
  rank: number | null;
  created_at: string;
}

interface MyContestsState {
  userContests: Contest[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export const MyContestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useMigratedAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming"); // Default to upcoming
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view
  const [apiPortfolios, setApiPortfolios] = useState<UserPortfolio[]>([]); // Store raw API response for list view
  const [retryCount, setRetryCount] = useState(0);

  // Touch/swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = ["active", "upcoming", "completed", "cancelled"];
  const tabLabels = {
    active: "Active",
    upcoming: "Upcoming", 
    completed: "Completed",
    cancelled: "Cancelled"
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  // Handle touch end - detect swipe direction
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.indexOf(activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        setActiveTab(tabs[currentIndex + 1]);
        toast(`📱 ${tabLabels[tabs[currentIndex + 1] as keyof typeof tabLabels]}`, {
          duration: 1500,
          style: { background: '#1f2937', color: '#f3f4f6', fontSize: '14px' }
        });
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right - previous tab  
        setActiveTab(tabs[currentIndex - 1]);
        toast(`📱 ${tabLabels[tabs[currentIndex - 1] as keyof typeof tabLabels]}`, {
          duration: 1500,
          style: { background: '#1f2937', color: '#f3f4f6', fontSize: '14px' }
        });
      }
    }

    // Reset touch positions
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Navigate to previous/next tab
  const navigateTab = (direction: 'prev' | 'next') => {
    const currentIndex = tabs.indexOf(activeTab);
    
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  // Simple state management - no complex WebSocket nonsense
  const [state, setState] = useState<MyContestsState>({
    userContests: [],
    isLoading: true,
    error: null,
    lastFetch: null,
  });

  // Removed cached contests - using WebSocket for real-time updates
    
  // Simple REST API fetch function - FIXED: removed cachedContests dependency
  const fetchUserContests = useCallback(async () => {
    if (!user?.wallet_address) {
      setState(prev => ({ ...prev, isLoading: false, error: "Wallet not connected" }));
      return;
    }

    try {
      console.log("[MyContests] Fetching user participations...");
      
      // Fetch user participations (backend team just fixed this!)
      let participations;
      try {
        participations = await ddApi.contests.getUserParticipations(user.wallet_address);
      } catch (apiError: any) {
        // Check if it's a 502 error
        if (apiError?.status === 502 || apiError?.response?.status === 502) {
          throw { status: 502, message: "Server is temporarily unavailable" };
        }
        throw apiError;
      }
      
      // Also fetch full contest data to get complete information for ContestCard
      const allContests = await ddApi.contests.getAll();
      
      // Fetch portfolios for list view
      const portfolioResponse = await ddApi.portfolio.getAllUserPortfolios(
        user.wallet_address,
        {
          limit: 100,
          includeTokens: true,
          includePerformance: true,
        }
      );
      
      if (!Array.isArray(participations)) {
        throw new Error("Invalid response format: participations array not found");
      }

      // Store raw API response for list view
      setApiPortfolios(portfolioResponse.portfolios || []);

      // Extract contests from participations and merge with full contest data
      const userContests: Contest[] = participations
        .map((participation: UserParticipation) => {
          // Find the full contest data
          const fullContest = allContests.find(c => c.id === participation.contest_id);
          
          return {
            // Use full contest data as base (has all ContestCard fields)
            ...(fullContest || participation.contest),
            // Add user-specific data
            user_portfolio_value: participation.portfolio_value,
            user_rank: participation.rank,
            is_participating: true,
          };
        })
        .filter((contest: Contest) => contest.id); // Only include valid contests

      console.log("[MyContests] Loaded", userContests.length, "user contests");

      setState({
        userContests,
        isLoading: false,
        error: null,
        lastFetch: new Date(),
      });

      console.log("[MyContests] State updated - isLoading: false, userContests.length:", userContests.length);

      // FIXED: Get fresh cache reference and update properly
      const currentCachedContests = useStore.getState().contests || [];
      const cachedContests = [...currentCachedContests];
      userContests.forEach(userContest => {
        const existingIndex = cachedContests.findIndex(c => c.id === userContest.id);
        if (existingIndex >= 0) {
          cachedContests[existingIndex] = { ...cachedContests[existingIndex], ...userContest };
        } else {
          cachedContests.push(userContest);
        }
      });
      useStore.getState().setContests(cachedContests);
      
    } catch (error: any) {
      console.error("[MyContests] Failed to fetch user contests:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for 502 errors with better error structure handling
      const is502Error = (
        (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 502) ||
        (error && typeof error === 'object' && 'status' in error && error.status === 502) ||
        errorMessage.includes('502') ||
        errorMessage.toLowerCase().includes('bad gateway') ||
        errorMessage.toLowerCase().includes('server is temporarily unavailable')
      );
      
      // Auto-retry for 502 errors silently
      if (is502Error && retryCount < 3) {
        console.log(`[MyContests] Server down (502), retrying in 5 seconds... (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        
        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchUserContests();
        }, 5000);
        
        // Keep loading state true during retries
        return;
      }
      
      // If we've exhausted retries or it's not a 502, show error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: is502Error 
          ? "Server is temporarily unavailable. Please try again later." 
          : error instanceof Error ? error.message : "Failed to load contests",
      }));
      
      // Reset retry count on final error
      setRetryCount(0);
    }
  }, [user?.wallet_address]); // FIXED: Only depend on wallet_address

  // Load data immediately on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // FIXED: Get cached data properly inside useEffect
    const currentCachedContests = useStore.getState().contests || [];
    const userCachedContests = currentCachedContests.filter(contest => contest.is_participating);
    if (userCachedContests.length > 0) {
      setState(prev => ({
        ...prev,
        userContests: userCachedContests,
        isLoading: false,
      }));
    }

    // Fetch fresh data
    fetchUserContests();
  }, [isAuthenticated, navigate, fetchUserContests]);

  // Manual refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUserContests();
    setIsRefreshing(false);
    toast.success("Contests refreshed!");
  }, [fetchUserContests]);

  // Group contests by status with proper memoization
  const groupedContests = useMemo(() => {
    const filtered = state.userContests.filter(contest => {
      // Search filter
      if (searchTerm && !contest.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

    const groups = {
      active: [] as Contest[],
      upcoming: [] as Contest[],
      completed: [] as Contest[],
      cancelled: [] as Contest[],
    };

    filtered.forEach(contest => {

      // Map the correct backend statuses
      if (contest.status === "cancelled") {
        groups.cancelled.push(contest);
      } else if (contest.status === "completed") {
        groups.completed.push(contest);
      } else if (contest.status === "active") {
        groups.active.push(contest);
      } else if (contest.status === "pending") {
        groups.upcoming.push(contest);
      }
    });

    console.log("[MyContests] Grouped contests:", {
      total: filtered.length,
      active: groups.active.length,
      upcoming: groups.upcoming.length,
      completed: groups.completed.length,
      cancelled: groups.cancelled.length,
      activeTab
    });

    return groups;
  }, [state.userContests, searchTerm, activeTab]);

  // Total count for display
  const totalContests = state.userContests.length;

  // Auto-select active tab if there are active contests, otherwise stick with upcoming
  useEffect(() => {
    if (totalContests > 0) {
      if (groupedContests.active.length > 0 && activeTab === "upcoming") {
        console.log("[MyContests] Auto-switching to active tab (has active contests)");
        setActiveTab("active");
      }
    }
  }, [groupedContests.active.length, totalContests, activeTab]);

  // Debug logging
  console.log("[MyContests] Render state:", {
    isLoading: state.isLoading,
    userContestsLength: state.userContests.length,
    error: state.error,
    totalContests
  });

  // Loading skeleton - only show if we're loading AND have no data
  if (state.isLoading && state.userContests.length === 0 && !state.error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative flex-1" style={{ zIndex: 10 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-6">
              <div className="scale-150">
                <NanoLogo />
              </div>
              <span className="flex items-center gap-2">
                <FaTrophy className="text-brand-400" /> My Contests
              </span>
            </h1>
            <p className="text-gray-400 mt-2">Loading your contests...</p>
          </header>
          
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-dark-200 rounded-lg h-64"
              >
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
          </div>
        </div>
      </div>
    );
  }

  console.log("[MyContests] Main render - about to return JSX, totalContests:", totalContests);
  console.log("[MyContests] About to render tabs, totalContests:", totalContests);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Content Section */}
      <div className="relative flex-1" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-6">
                <div className="scale-150">
                  <NanoLogo />
                </div>
                <span className="flex items-center gap-2">
                  <FaTrophy className="text-brand-400" /> My Contests
                </span>
              </h1>
              <p className="text-gray-400 mt-2">
                {totalContests > 0 
                  ? `You're participating in ${totalContests} contest${totalContests === 1 ? '' : 's'}`
                  : "You haven't joined any contests yet"
                }
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-dark-200/50 rounded-lg p-2">
                <Button
                  variant={viewMode === 'list' ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? "bg-brand-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaList className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'cards' ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 ${
                    viewMode === 'cards' 
                      ? "bg-brand-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaThLarge className="h-4 w-4" />
                  Cards
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {state.lastFetch && (
                  <span className="text-xs text-gray-500 font-mono">
                    Updated: {state.lastFetch.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FaRedo className={isRefreshing ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="mb-6 max-w-md mx-auto">
          <SearchInput
            placeholder="Search your contests..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Error State */}
        {state.error ? (
          <div className="mb-6">
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="py-4">
                <p className="text-red-300 text-center">{state.error}</p>
                <div className="mt-3 text-center">
                  <Button onClick={handleRefresh} size="sm" variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Empty State */}
        {totalContests === 0 && !state.isLoading && !state.error && (
          <div className="text-center py-16">
            <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Contests Yet
                  </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven't joined any contests yet. Browse available contests to get started!
                  </p>
                  <Button
                    onClick={() => navigate("/contests")}
              className="bg-brand-500 hover:bg-brand-600"
                  >
              Browse Contests
                  </Button>
              </div>
            )}

        {/* Contest Display - List or Card View */}
        {totalContests > 0 && viewMode === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Contest History List */}
            <div className="lg:col-span-2">
              {apiPortfolios.length > 0 ? (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-dark-300 rounded-lg">
                  <ContestHistoryList 
                    portfolios={apiPortfolios.filter(p => {
                      // Apply search filter
                      const matchesSearch = searchTerm === "" ||
                        p.contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.portfolio.some(t => 
                          t.token?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.token?.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                      
                      return matchesSearch;
                    })} 
                  />
                </div>
              ) : (
                <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-200 mb-2">
                      No Contests Found
                    </h3>
                    <p className="text-gray-400">
                      Join some contests to see them here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Contest Stats and Info */}
            <div className="space-y-6">
              {/* Contest Summary Stats */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Contest Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-400">{apiPortfolios.length}</div>
                      <div className="text-xs text-gray-400">Total Contests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {apiPortfolios.filter(p => p.contest.status === 'completed' && p.final_rank && p.final_rank <= 3).length}
                      </div>
                      <div className="text-xs text-gray-400">Top 3 Finishes</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {groupedContests.active.length}
                      </div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {groupedContests.upcoming.length}
                      </div>
                      <div className="text-xs text-gray-400">Upcoming</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => navigate("/contests")}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white"
                  >
                    Browse New Contests
                  </Button>
                  <Button
                    onClick={() => setViewMode('cards')}
                    variant="outline"
                    className="w-full bg-dark-300 border-dark-400 text-gray-300 hover:bg-dark-400"
                  >
                    Switch to Card View
                  </Button>
                </CardContent>
              </Card>

              {/* Contest Status Legend */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Status Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Pending - Contest hasn't started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">Active - Contest is live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Completed - Contest finished</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300">Cancelled - Contest cancelled</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Contest Tabs - Card View */}
        {totalContests > 0 && viewMode === 'cards' && (
          <div 
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full"
          >
            {/* Mobile Tab Navigation */}
            <div className="sm:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => navigateTab('prev')}
                disabled={tabs.indexOf(activeTab) === 0}
                className="p-2 rounded-lg bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="text-gray-400" />
              </button>
              
              <div className="flex-1 text-center">
                <h3 className="text-lg font-semibold text-white">
                  {tabLabels[activeTab as keyof typeof tabLabels]} ({groupedContests[activeTab as keyof typeof groupedContests].length})
                  </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ← Swipe to navigate →
                </p>
              </div>
              
              <button
                onClick={() => navigateTab('next')}
                disabled={tabs.indexOf(activeTab) === tabs.length - 1}
                className="p-2 rounded-lg bg-dark-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronRight className="text-gray-400" />
              </button>
                  </div>

                         {/* Custom Tab System - Desktop */}
             <div className="hidden sm:block">
               <div className="grid w-full grid-cols-4 mb-6 bg-dark-200/50 rounded-lg p-1">
                 <button
                   onClick={() => setActiveTab('active')}
                   className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                     activeTab === 'active'
                       ? 'bg-dark-100 text-orange-400 shadow-sm'
                       : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300/50'
                   }`}
                 >
                   <FaFire className="text-orange-400" />
                   Active ({groupedContests.active.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('upcoming')}
                   className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                     activeTab === 'upcoming'
                       ? 'bg-dark-100 text-blue-400 shadow-sm'
                       : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300/50'
                   }`}
                 >
                   <FaCalendarAlt className="text-blue-400" />
                   Upcoming ({groupedContests.upcoming.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('completed')}
                   className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                     activeTab === 'completed'
                       ? 'bg-dark-100 text-green-400 shadow-sm'
                       : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300/50'
                   }`}
                 >
                   <FaTrophy className="text-green-400" />
                   Completed ({groupedContests.completed.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('cancelled')}
                   className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                     activeTab === 'cancelled'
                       ? 'bg-dark-100 text-red-400 shadow-sm'
                       : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300/50'
                   }`}
                 >
                   <FaBan className="text-red-400" />
                   Cancelled ({groupedContests.cancelled.length})
                 </button>
               </div>
             </div>

             {/* Tab Content */}
             <div className="mt-6">
               {activeTab === 'active' && (
                 <ContestGrid contests={groupedContests.active} emptyMessage="No active contests" />
               )}
               {activeTab === 'upcoming' && (
                 <ContestGrid contests={groupedContests.upcoming} emptyMessage="No upcoming contests" />
               )}
               {activeTab === 'completed' && (
                 <ContestGrid contests={groupedContests.completed} emptyMessage="No completed contests" />
               )}
               {activeTab === 'cancelled' && (
                 <ContestGrid contests={groupedContests.cancelled} emptyMessage="No cancelled contests" />
               )}
             </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper component for contest grid with empty states
interface ContestGridProps {
  contests: Contest[];
  emptyMessage: string;
}

const ContestGrid: React.FC<ContestGridProps> = ({ contests, emptyMessage }) => {
  if (contests.length === 0) {
    return (
      <div className="text-center py-12">
        <FaHourglassHalf className="text-4xl text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contests.map((contest) => (
        <ContestCard
          key={contest.id}
          contest={contest}
        />
      ))}
    </div>
  );
};

export default MyContestsPage;