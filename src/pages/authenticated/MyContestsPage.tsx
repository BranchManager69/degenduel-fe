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
  FaTrophy
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ContestCard } from "../../components/contest-browser/ContestCard";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { SearchInput } from "../../components/ui/SearchInput";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest } from "../../types";

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
  const [activeTab, setActiveTab] = useState("active");

  // Touch/swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const fetchUserContests = useCallback(async (): Promise<void> => {
    if (!user?.wallet_address) {
      setState(prev => ({ ...prev, isLoading: false, error: "Wallet not connected" }));
      return;
    }

    try {
      console.log("[MyContests] Fetching user participations...");
      
      // Fetch user participations (backend team just fixed this!)
      const participations = await ddApi.contests.getUserParticipations(user.wallet_address);
      
      if (!Array.isArray(participations)) {
        throw new Error("Invalid response format");
      }

      // Extract contests from participations with proper typing
      const userContests: Contest[] = participations
        .map((participation: UserParticipation) => ({
          ...participation.contest,
          // Add user-specific data
          user_portfolio_value: participation.portfolio_value,
          user_rank: participation.rank,
              is_participating: true,
        }))
        .filter((contest: Contest) => contest.id); // Only include valid contests

      console.log("[MyContests] Loaded", userContests.length, "user contests");

      setState({
        userContests,
        isLoading: false,
        error: null,
        lastFetch: new Date(),
      });

      // FIXED: Get fresh cache reference and update properly
      const currentCachedContests = useStore.getState().contests || [];
      const allContests = [...currentCachedContests];
      userContests.forEach(userContest => {
        const existingIndex = allContests.findIndex(c => c.id === userContest.id);
        if (existingIndex >= 0) {
          allContests[existingIndex] = { ...allContests[existingIndex], ...userContest };
        } else {
          allContests.push(userContest);
        }
      });
      useStore.getState().setContests(allContests);
      
    } catch (error) {
      console.error("[MyContests] Failed to fetch user contests:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load contests",
      }));
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
    const now = new Date();
    
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
      const startTime = new Date(contest.start_time);
      const endTime = new Date(contest.end_time);

      if (contest.status === "cancelled") {
        groups.cancelled.push(contest);
      } else if (now >= endTime) {
        groups.completed.push(contest);
      } else if (now >= startTime) {
        groups.active.push(contest);
      } else {
        groups.upcoming.push(contest);
      }
    });

    return groups;
  }, [state.userContests, searchTerm]);

  // Total count for display
  const totalContests = state.userContests.length;

  // Loading skeleton
  if (state.isLoading && state.userContests.length === 0) {
    return (
      <div className="min-h-screen bg-dark-100">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FaTrophy className="text-brand-400" /> My Contests
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
    );
  }

  return (
    <div className="min-h-screen bg-dark-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FaTrophy className="text-brand-400" /> My Contests
            </h1>
            <p className="text-gray-400 mt-2">
              {totalContests > 0 
                ? `You're participating in ${totalContests} contest${totalContests === 1 ? '' : 's'}`
                : "You haven't joined any contests yet"
              }
            </p>
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
        {state.error && (
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
            )}

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

        {/* Contest Tabs */}
        {totalContests > 0 && (
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