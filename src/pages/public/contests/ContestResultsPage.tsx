// src/pages/public/contests/ContestResultsPage.tsx


import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import { formatCurrency } from "../../../lib/utils";
// import { ddApi } from "../../../services/dd-api"; // No longer needed - using fetch directly
import { ContestViewData, TokenHoldingPerformance } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Contest Results page - enhanced with next-level UI and interactive features
export const ContestResults: React.FC = () => {
  const navigate = useNavigate();
  const { id: contestIdFromParams } = useParams<{ id: string }>();
  const { user: _ } = useMigratedAuth(); // Auth hook still needed but user not used directly

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'results' | 'details' | 'chat'>('results');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animationComplete] = useState(false);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initial data fetch
  useEffect(() => {
    const contestId = contestIdFromParams ?? null;
    if (!contestId) {
      setError("Contest ID is missing.");
      setIsLoading(false);
      return;
    }
    const fetchContestResults = async () => {
      setIsLoading(true); setError(null);
      try {
        // Backend team confirmed: use /contests/:id/leaderboard for results
        const response = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the leaderboard response to match expected ContestViewData structure
        const viewData: ContestViewData = {
          contest: data.contest,
          leaderboard: data.leaderboard,
          currentUserPerformance: data.leaderboard.find((entry: any) => entry.is_current_user) || null
        };
        
        setContestViewData(viewData);
      } catch (err) { setError(err instanceof Error ? err.message : "Failed to load contest results."); }
      finally { setIsLoading(false); }
    };
    fetchContestResults();

    return () => {
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, [contestIdFromParams]);

  // Setup OG meta tags when contest data is loaded
  useEffect(() => {
    if (contestViewData?.contest && contestIdFromParams) {
      setupContestOGMeta(
        contestIdFromParams, 
        `${contestViewData.contest.name} - Results`, 
        `View the final results for ${contestViewData.contest.name} trading competition!`
      );
    }
  }, [contestViewData?.contest, contestIdFromParams]);

  // WebSocket updates
  const { 
    contestViewData: wsUpdatedData, 
    error: wsError 
  } = useContestViewUpdates(contestIdFromParams ?? null, contestViewData);

  // Effect to update page state when WebSocket pushes new data
  useEffect(() => {
    if (wsUpdatedData) {
      setContestViewData(wsUpdatedData);
    }
  }, [wsUpdatedData]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      console.warn("[ContestResults] WebSocket update error:", wsError);
    }
  }, [wsError]);

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = (event: React.KeyboardEvent, tab: 'results' | 'details' | 'chat') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabChange(tab);
    }
  };
  
  
  
  // Trigger sequential animations after celebration completes
  useEffect(() => {
    if (animationComplete && contentRef.current) {
      contentRef.current.classList.add('animate-reveal-content');
    }
  }, [animationComplete]);
  
  // Handle new messages
  const handleNewMessage = () => {
    if (activeTab !== 'chat') {
      setUnreadMessages(prev => prev + 1);
    }
  };

  // --- Handle Tab Changes ---
  const handleTabChange = (tab: 'results' | 'details' | 'chat') => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadMessages(0);
    }
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  // --- Derived data based on contestViewData ---
  const contestDetails = contestViewData?.contest;
  const currentUserPerformance = contestViewData?.currentUserPerformance;

  // --- Memoized data for performance ---
  const leaderboardEntriesForDisplay = useMemo(() => {
    return (contestViewData?.leaderboard || []).map(entry => ({
      ...entry,
      finalValue: parseFloat(entry.portfolioValue),
      totalReturn: parseFloat(entry.performancePercentage),
      prize: entry.prizeAwarded ? parseFloat(entry.prizeAwarded) : 0
    }));
  }, [contestViewData?.leaderboard]);

  const currentUserLeaderboardEntry = useMemo(() => {
    return leaderboardEntriesForDisplay.find(entry => entry.isCurrentUser);
  }, [leaderboardEntriesForDisplay]);

  const userRankForDisplay = currentUserPerformance?.rank;

  const performanceChartData = useMemo(() => {
    return currentUserPerformance?.historicalPerformance.map(dp => ({
      timestamp: dp.timestamp,
      value: parseFloat(dp.value),
    })) || [];
  }, [currentUserPerformance?.historicalPerformance]);

  const tokenResultsForDisplay = useMemo(() => {
    return currentUserPerformance?.tokens.map((apiToken: TokenHoldingPerformance) => {
      const quantity = parseFloat(apiToken.quantity);
      const currentValue = parseFloat(apiToken.currentValueContribution);
      
      return {
        symbol: apiToken.symbol,
        name: apiToken.name,
        imageUrl: apiToken.imageUrl,
        finalValue: currentValue, 
        change: parseFloat(apiToken.performancePercentage),
        contribution: parseFloat(apiToken.profitLossValueContribution),
        quantityForDetail: quantity,
        initialValueForDetail: parseFloat(apiToken.initialValueContribution),
        priceForDetail: quantity > 0 ? currentValue / quantity : 0,
      };
    }) || [];
  }, [currentUserPerformance?.tokens]);

  // Safe access to leaderboard data with fallbacks
  const safeLeaderboardAccess = useMemo(() => {
    const hasEntries = leaderboardEntriesForDisplay.length > 0;
    const currentUserEntry = currentUserLeaderboardEntry;
    const firstEntry = hasEntries ? leaderboardEntriesForDisplay[0] : null;
    
    return {
      hasEntries,
      currentUserEntry,
      firstEntry,
      fallbackValue: currentUserPerformance ? parseFloat(currentUserPerformance.portfolioValue) : 1000,
    };
  }, [leaderboardEntriesForDisplay, currentUserLeaderboardEntry, currentUserPerformance]);

  // --- Loading and Error States --- 
  if (isLoading) { return <div className="p-8 text-center">Loading contest results...</div>; }
  if (error) { return <div className="p-8 text-center text-red-500">Error: {error}</div>; }
  if (!contestViewData || !contestDetails) { return <div className="p-8 text-center">No contest data available.</div>; }

  // --- Render the Contest Results Page ---
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      
      {/* Celebration overlay removed - component no longer exists */}

      {/* Content Section Parent Container */}
      <div className="relative z-10 flex-grow">
        
        {/* Content Section - Main Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          
          {/* Breadcrumb navigation */}
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-400">
              <a href="/" className="hover:text-brand-400 transition-colors">
                Home
              </a>
              <span className="mx-2">›</span>
              <a href="/contests" className="hover:text-brand-400 transition-colors">
                Contests
              </a>
              <span className="mx-2">›</span>
              <span className="text-gray-300">{contestDetails?.name || 'Contest Results'}</span>
            </div>
          </div>
          
          {/* Enhanced Header Section with interactive elements */}
          <div 
            ref={headerRef}
            className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between relative overflow-hidden rounded-lg p-4 bg-dark-200/30 backdrop-blur-sm border border-dark-400/30"
          >
            <div>

              {/* Contest Results Header */}
              <motion.h1 
                className="text-3xl font-bold text-gray-100 group-hover:animate-glitch flex items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Contest Results
                <motion.div
                  className="ml-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Badge variant="destructive">ENDED</Badge>
                </motion.div>
              </motion.h1>

              {/* Contest Name */}
              <motion.h2
                className="text-xl text-gray-300 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {contestDetails.name}
              </motion.h2>
              
              {/* Contest Completion Date */}
              <motion.p 
                className="text-gray-400 mt-2 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Contest completed on {new Date(contestDetails.endTime).toLocaleDateString()}
              </motion.p>
              
              {/* User result summary banner */}
              <motion.div
                className="mt-4 px-4 py-2 bg-brand-900/30 border border-brand-500/30 rounded-md flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >

                {/* User Result Summary Banner */}
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <span className="text-brand-300 font-medium">
                      Your Rank: <span className="text-white font-bold">{userRankForDisplay ?? 'N/A'}</span>
                    </span>
                    <span className="text-gray-400 text-sm">
                      Final value: <span className="text-white font-mono">{currentUserPerformance ? formatCurrency(parseFloat(currentUserPerformance.portfolioValue)) : 'N/A'}</span>
                    </span>
                  </div>
                </div>
                
                {/* Flexible Prize Indicator - Works with any payout structure */}
                {(parseFloat(currentUserLeaderboardEntry?.prizeAwarded || "0") > 0) && (
                  <motion.div 
                    className="bg-yellow-900/30 px-3 py-2 rounded-md border border-yellow-500/30 flex items-center"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(234, 179, 8, 0.3)" }}
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0px rgba(234, 179, 8, 0)",
                        "0 0 15px rgba(234, 179, 8, 0.4)",
                        "0 0 0px rgba(234, 179, 8, 0)"
                      ]
                    }}
                    transition={{ 
                      repeat: 2,
                      repeatType: "reverse",
                      duration: 1.5
                    }}
                  >
                    {/* Custom rank indicator with sophisticated styling */}
                    <motion.div 
                      className="mr-3 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, delay: 1, repeat: 1 }}
                    >
                      {(() => {
                        // Get current user's rank (accounting for tied positions)
                        const currentUser = leaderboardEntriesForDisplay.find(entry => entry.isCurrentUser);
                        const rank = currentUser?.rank || 0;
                        
                        // Different styled indicators based on rank
                        if (rank === 1) {
                          return (
                            <div className="relative w-8 h-8">
                              {/* Gold medal shape */}
                              <motion.div 
                                className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border border-yellow-200 shadow-lg"
                                animate={{ 
                                  boxShadow: [
                                    "0 0 5px rgba(234, 179, 8, 0.5)",
                                    "0 0 15px rgba(234, 179, 8, 0.8)",
                                    "0 0 5px rgba(234, 179, 8, 0.5)"
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-yellow-800 text-xs">1</div>
                              {/* Crown accent */}
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-yellow-300 border border-yellow-400" 
                                style={{
                                  clipPath: "polygon(0% 100%, 20% 0%, 40% 100%, 60% 0%, 80% 100%, 100% 0%, 100% 100%)"
                                }}
                              />
                            </div>
                          );
                        }
                        
                        if (rank === 2) {
                          return (
                            <div className="relative w-8 h-8">
                              {/* Silver medal shape */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-200 shadow-md" />
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-700 text-xs">2</div>
                              {/* Subtle accent line */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-[1px] bg-gray-400/60" />
                            </div>
                          );
                        }
                        
                        if (rank === 3) {
                          return (
                            <div className="relative w-8 h-8">
                              {/* Bronze medal shape */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300 shadow-md" />
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-amber-900 text-xs">3</div>
                              {/* Subtle accent curve */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-4 h-4 border-b border-amber-500/50 rounded-full" />
                            </div>
                          );
                        }
                        
                        // For any other rank, show a stylized number badge
                        return (
                          <div className="relative w-8 h-8">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400/80 to-brand-600/80 border border-brand-300/30 shadow-sm" />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs">
                              {rank}
                            </div>
                            {/* Decorative accent */}
                            <div className="absolute inset-0 rounded-full border-2 border-brand-400/20 scale-90" />
                          </div>
                        );
                      })()}
                    </motion.div>

                    {/* Prize Awarded Section */}
                    <div className="flex flex-col">

                      {/* Prize Awarded Header */}
                      <span className="text-yellow-300 font-medium">Prize Awarded</span>
                      
                      {/* Prize Awarded */}
                      <span className="text-white font-mono text-base font-bold">
                        {formatCurrency(parseFloat(currentUserLeaderboardEntry?.prizeAwarded || "0"))}
                      </span>
                      
                      {/* Show rank info for context */}
                      <span className="text-yellow-200/70 text-xs mt-0.5">
                        {(() => {
                          const rank = leaderboardEntriesForDisplay.find(entry => entry.isCurrentUser)?.rank;
                          // Handle special cases for 1st, 2nd, 3rd
                          if (rank === 1) return "1st Place";
                          if (rank === 2) return "2nd Place";
                          if (rank === 3) return "3rd Place";
                          if (rank) return `${rank}th Place`;
                          return "Winner";
                        })()}
                      </span>

                    </div>
                  </motion.div>
                )}
                
              </motion.div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-3">
              {/* Share Contest Button - Removed for completed contests */}
              {/* Contest is completed, no need to share for recruiting participants */}
              
              <Button
                onClick={() => navigate("/contests")}
                className="relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream-responsive" />
                <span className="relative flex items-center font-medium group-hover:animate-glitch">
                  Join New Contest
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
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
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle mobile menu"
                className="md:hidden bg-dark-300 hover:bg-dark-400 text-gray-300 px-2 py-1 rounded-md self-start mt-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>

          </div>
          
          {/* Tab Navigation */}
          <div className="hidden md:flex mb-6 border-b border-gray-700/50" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'results'}
              aria-label="Results and Performance tab"
              tabIndex={activeTab === 'results' ? 0 : -1}
              onClick={() => handleTabChange('results')}
              onKeyDown={(e) => handleTabKeyDown(e, 'results')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'results'
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Results & Performance
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'details'}
              aria-label="Portfolio Details tab"
              tabIndex={activeTab === 'details' ? 0 : -1}
              onClick={() => handleTabChange('details')}
              onKeyDown={(e) => handleTabKeyDown(e, 'details')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'details'
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Portfolio Details
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-label="Contest Chat tab"
              tabIndex={activeTab === 'chat' ? 0 : -1}
              onClick={() => {
                handleTabChange('chat');
                setUnreadMessages(0);
              }}
              onKeyDown={(e) => handleTabKeyDown(e, 'chat')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px flex items-center ${
                activeTab === 'chat'
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Contest Chat
              {unreadMessages > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          </div>
          
          {/* Mobile Menu Tabs */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden mb-4 overflow-hidden"
              >
                <div className="flex flex-col bg-dark-200/80 backdrop-blur-md rounded-lg p-2 border border-gray-700/50">
                  <button
                    onClick={() => {handleTabChange('results'); setMobileMenuOpen(false)}}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'results'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Results & Performance
                  </button>
                  <button
                    onClick={() => {handleTabChange('details'); setMobileMenuOpen(false)}}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'details'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Portfolio Details
                  </button>
                  <button
                    onClick={() => {
                      handleTabChange('chat');
                      setMobileMenuOpen(false);
                      setUnreadMessages(0);
                    }}
                    className={`px-3 py-2 rounded-md text-left flex items-center ${
                      activeTab === 'chat'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Contest Chat
                    {unreadMessages > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              role="tabpanel"
              aria-labelledby={`${activeTab}-tab`}
            >

              {/* Details Tab */}
              {activeTab === 'results' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {/* Performance Chart Section */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors mb-6">
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Performance</h2>
                        
                        {/* Performance Chart */}
                        <div className="h-64 bg-dark-300/50 rounded-lg p-4 mb-4">
                          {/* Here we would render the actual chart using performanceChartData */}
                          <div className="flex items-center justify-center h-full text-gray-400">
                            {performanceChartData.length > 0 ? (
                              <div className="w-full h-full flex flex-col">
                                <div className="text-center text-sm mb-2">Portfolio Performance Over Time</div>
                                <div className="flex-1 relative">
                                  {/* Simple line visualization of the performance data */}
                                  <div className="absolute inset-0 flex items-end">
                                    {performanceChartData.map((dataPoint, index) => (
                                      <div 
                                        key={index}
                                        className="w-full bg-brand-500 mx-0.5"
                                        style={{ 
                                          height: `${Math.max(10, Math.min(100, (dataPoint.value / 1200) * 100))}%`,
                                          opacity: 0.7 + (index / performanceChartData.length) * 0.3
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span>No performance data available</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-dark-300/50 rounded-lg p-3 text-center">
                            <div className="text-gray-400 text-sm mb-1">Initial Value</div>
                            <div className="text-white font-medium">
                              {currentUserPerformance && formatCurrency(parseFloat(currentUserPerformance.initialPortfolioValue))}
                            </div>
                          </div>
                          <div className="bg-dark-300/50 rounded-lg p-3 text-center">
                            <div className="text-gray-400 text-sm mb-1">Final Value</div>
                            <div className="text-white font-medium">
                              {currentUserPerformance && formatCurrency(parseFloat(currentUserPerformance.portfolioValue))}
                            </div>
                          </div>
                          <div className="bg-dark-300/50 rounded-lg p-3 text-center">
                            <div className="text-gray-400 text-sm mb-1">% Change</div>
                            <div className={`font-medium ${currentUserPerformance && parseFloat(currentUserPerformance.portfolioValue) >= parseFloat(currentUserPerformance.initialPortfolioValue) ? 'text-green-400' : 'text-red-400'}`}>
                              {currentUserPerformance && (
                                ((parseFloat(currentUserPerformance.portfolioValue) / parseFloat(currentUserPerformance.initialPortfolioValue)) - 1) * 100
                              ).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Leaderboard Section */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Final Leaderboard</h2>
                        
                        <div className="space-y-3">
                          {leaderboardEntriesForDisplay.map((entry) => (
                            <div 
                              key={entry.username}
                              className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                entry.isCurrentUser
                                  ? 'bg-brand-500/20 border border-brand-500/30'
                                  : entry.isAiAgent
                                    ? 'bg-cyber-500/20 border border-cyber-400/30'
                                    : 'bg-dark-300/50'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center font-mono
                                  ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 
                                    entry.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' : 
                                    'bg-amber-600/20 text-amber-400 border border-amber-600/40'}
                                `}>
                                  {entry.rank}
                                </div>
                                <div className="flex flex-col ml-3">
                                  <span className={`font-medium ${
                                    entry.isAiAgent ? 'text-cyber-300' : 
                                    entry.isCurrentUser ? 'text-brand-300' : 'text-gray-100'
                                  }`}>
                                    {entry.username}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    ${entry.finalValue.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="font-medium">
                                <span className={`${entry.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {entry.totalReturn >= 0 ? '+' : ''}{entry.totalReturn.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Referral Progress Card - Removed for completed contests */}
                    {/* Contest is completed, no need to show referral incentives */}
                    
                    {/* Your Stats */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Your Results</h2>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Rank</span>
                            <span className="text-white font-mono">{userRankForDisplay || 'N/A'}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Final Value</span>
                            <span className="text-white font-mono">
                              {currentUserPerformance && formatCurrency(parseFloat(currentUserPerformance.portfolioValue))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Return</span>
                            <span className={`font-mono ${
                              currentUserPerformance && 
                              parseFloat(currentUserPerformance.portfolioValue) >= parseFloat(currentUserPerformance.initialPortfolioValue) 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {currentUserPerformance && (
                                ((parseFloat(currentUserPerformance.portfolioValue) / parseFloat(currentUserPerformance.initialPortfolioValue)) - 1) * 100
                              ).toFixed(2)}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Prize</span>
                            <span className="text-white font-mono">
                              {formatCurrency(parseFloat(currentUserLeaderboardEntry?.prizeAwarded || "0"))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Tokens Held</span>
                            <span className="text-white">
                              {currentUserPerformance?.tokens.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Top Tokens */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Top Performing Tokens</h2>
                        
                        <div className="space-y-3">
                          {/* We use tokenResultsForDisplay here */}
                          {tokenResultsForDisplay.slice(0, 3).map((token) => (
                            <div 
                              key={token.symbol}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-300/50"
                            >
                              <div className="flex items-center">
                                {token.imageUrl && (
                                  <img 
                                    src={token.imageUrl} 
                                    alt={token.name} 
                                    className="w-8 h-8 rounded-full mr-3" 
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-white">{token.symbol}</div>
                                  <div className="text-xs text-gray-400">{token.name}</div>
                                </div>
                              </div>
                              <div className={`font-medium ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">

                    {/* Portfolio Distribution Section Card */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      
                      {/* Portfolio Distribution Section */}
                      <div className="p-6">

                        {/* Portfolio Distribution Header */}
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Portfolio Distribution</h2>
                        
                        {/* Portfolio Distribution Chart (placeholder circle chart) */}
                        <div className="aspect-square max-w-md mx-auto relative mb-8">
                          
                          {/* Portfolio Distribution Chart */}
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            
                            {/* SOL segment (60%) */}
                            <motion.path
                              d="M 50 50 L 50 0 A 50 50 0 0 1 97.55 34.55 Z"
                              fill="#9945FF"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                            
                            {/* JTO segment (40%) */}
                            <motion.path
                              d="M 50 50 L 97.55 34.55 A 50 50 0 0 1 50 100 A 50 50 0 0 1 2.45 34.55 A 50 50 0 0 1 50 0 Z"
                              fill="#14F195"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                            />
                            
                            {/* Center circle */}
                            <circle cx="50" cy="50" r="30" fill="#13151A" />
                            
                            <text x="50" y="45" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Total Value</text>
                            <text x="50" y="55" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                              ${safeLeaderboardAccess.currentUserEntry?.finalValue || safeLeaderboardAccess.fallbackValue}
                            </text>
                          </svg>
                          
                          {/* Legend */}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-6">
                            
                            {/* SOL segment (60%) */}
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-[#9945FF] rounded-full mr-2"></div>
                              <span className="text-sm text-gray-300">SOL (60%)</span>
                            </div>

                            {/* JTO segment (40%) */}
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-[#14F195] rounded-full mr-2"></div>
                              <span className="text-sm text-gray-300">JTO (40%)</span>
                            </div>

                          </div>

                        </div>
                        
                        {/* Trade History */}
                        <h3 className="text-lg font-semibold text-gray-100 mb-2">
                          Trade History
                        </h3>
                        
                        {/* Trade History Table */}
                        <div className="border border-gray-700 rounded-md overflow-hidden">
                          
                          <table className="w-full">
                            <thead className="bg-dark-300">
                              <tr>
                                <th className="p-2 text-left text-gray-400 text-sm">Date</th>
                                <th className="p-2 text-left text-gray-400 text-sm">Token</th>
                                <th className="p-2 text-left text-gray-400 text-sm">Action</th>
                                <th className="p-2 text-left text-gray-400 text-sm">Amount</th>
                                <th className="p-2 text-left text-gray-400 text-sm">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t border-gray-700">
                                <td className="p-2 text-gray-300">Today, 10:30 AM</td>
                                <td className="p-2 text-gray-300">SOL</td>
                                <td className="p-2 text-green-400">BUY</td>
                                <td className="p-2 text-gray-300">10</td>
                                <td className="p-2 text-gray-300">$90.25</td>
                              </tr>
                              <tr className="border-t border-gray-700">
                                <td className="p-2 text-gray-300">Today, 11:45 AM</td>
                                <td className="p-2 text-gray-300">JTO</td>
                                <td className="p-2 text-green-400">BUY</td>
                                <td className="p-2 text-gray-300">150</td>
                                <td className="p-2 text-gray-300">$2.67</td>
                              </tr>
                              <tr className="border-t border-gray-700">
                                <td className="p-2 text-gray-300">Today, 2:15 PM</td>
                                <td className="p-2 text-gray-300">SOL</td>
                                <td className="p-2 text-red-400">SELL</td>
                                <td className="p-2 text-gray-300">2</td>
                                <td className="p-2 text-gray-300">$103.45</td>
                              </tr>
                            </tbody>
                          </table>

                        </div>

                      </div>
                    </Card>
                  </div>

                  {/* Performance Stats Section Card */}
                  <div className="space-y-6">
                    
                    {/* Performance Stats Section Card */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      
                      {/* Performance Stats Section Card */}
                      <div className="p-6">
                        
                        {/* Performance Stats Header */}
                        <h2 className="text-xl font-bold text-gray-100 mb-4">Performance Stats</h2>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Starting Value</span>
                            <span className="text-white font-mono">
                              {currentUserPerformance 
                                ? formatCurrency(parseFloat(currentUserPerformance.initialPortfolioValue))
                                : "$1,000"
                              }
                            </span>
                          </div>
                          
                          {/* Final Value */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Final Value</span>
                            <span className="text-white font-mono">
                              {safeLeaderboardAccess.currentUserEntry 
                                ? `$${safeLeaderboardAccess.currentUserEntry.finalValue.toLocaleString()}`
                                : `$${safeLeaderboardAccess.fallbackValue.toLocaleString()}`
                              }
                            </span>
                          </div>

                          {/* Total Return */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Total Return</span>
                            <span className={`font-mono ${
                              safeLeaderboardAccess.currentUserEntry 
                                ? (safeLeaderboardAccess.currentUserEntry.totalReturn >= 0 ? 'text-green-400' : 'text-red-400')
                                : 'text-gray-400'
                            }`}>
                              {safeLeaderboardAccess.currentUserEntry 
                                ? `${safeLeaderboardAccess.currentUserEntry.totalReturn >= 0 ? '+' : ''}${safeLeaderboardAccess.currentUserEntry.totalReturn.toFixed(2)}%`
                                : 'N/A'
                              }
                            </span>
                          </div>

                          {/* Final Rank */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Final Rank</span>
                            <span className="text-yellow-400 font-medium">{userRankForDisplay} of {leaderboardEntriesForDisplay.length}</span>
                          </div>

                          {/* Prize */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Prize</span>
                            <span className="text-white font-mono">
                              {formatCurrency(safeLeaderboardAccess.currentUserEntry?.prize || 0)}
                            </span>
                          </div>

                          {/* Duration */}
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Duration</span>
                            <span className="text-white">
                              {(() => {
                                const start = new Date(contestDetails.startTime);
                                const end = new Date(contestDetails.endTime);
                                const durationMs = end.getTime() - start.getTime();
                                const hours = Math.round(durationMs / (1000 * 60 * 60));
                                return hours === 24 ? '24 hours' : `${hours} hours`;
                              })()}
                            </span>
                          </div>

                        </div>

                      </div>

                    </Card>
                    
                    {/* Contest Details Section Card */}
                    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                      
                      {/* Contest Details Section Card */}
                      <div className="p-6">

                        <h2 className="text-xl font-bold text-gray-100 mb-4">
                          Contest Details
                        </h2>
                        
                        <div className="space-y-4">

                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Name</span>
                            <span className="text-white">{contestDetails.name}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Start Date</span>
                            <span className="text-white">{new Date(contestDetails.startTime).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">End Date</span>
                            <span className="text-white">{new Date(contestDetails.endTime).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Total Participants</span>
                            <span className="text-white">{leaderboardEntriesForDisplay.length}</span>
                          </div>
                          
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Total Prize Pool</span>
                            <span className="text-white font-mono">{formatCurrency(parseFloat(contestDetails.prizePool || '0'))}</span>
                          </div>
                          
                        </div>

                      </div>

                    </Card>

                  </div>

                </div>
              )}
              
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Chat Section */}
                  <div className="lg:col-span-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-dark-200/10 backdrop-blur-sm rounded-lg border border-dark-300 overflow-hidden h-[600px]"
                    >
                      <ContestChat 
                        contestId={contestIdFromParams!} 
                        onNewMessage={handleNewMessage} 
                      />
                    </motion.div>
                  </div>

                  {/* Final Standings Section */}
                  <div>
                    {/* Referral Progress Card - Removed for completed contests */}
                    {/* Contest is completed, no need to show referral incentives */}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >

                      {/* Final Standings Section Card */}  
                      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors mb-6">
                        <div className="p-6">
                          <h2 className="text-xl font-bold text-gray-100 mb-4">Final Standings</h2>
                          
                          <div className="space-y-3">
                            {leaderboardEntriesForDisplay.slice(0, 3).map((entry) => (
                              <div 
                                key={entry.username}
                                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                  entry.isCurrentUser
                                    ? 'bg-brand-500/20 border border-brand-500/30'
                                    : entry.isAiAgent
                                      ? 'bg-cyber-500/20 border border-cyber-400/30'
                                      : 'bg-dark-300/50'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-mono
                                    ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' : 
                                      entry.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' : 
                                      'bg-amber-600/20 text-amber-400 border border-amber-600/40'}
                                  `}>
                                    {entry.rank}
                                  </div>
                                  <div className="flex flex-col ml-3">
                                    <span className={`font-medium ${
                                      entry.isAiAgent ? 'text-cyber-300' : 
                                      entry.isCurrentUser ? 'text-brand-300' : 'text-gray-100'
                                    }`}>
                                      {entry.username}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ${entry.finalValue.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="font-medium">
                                  <span className={`${entry.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {entry.totalReturn >= 0 ? '+' : ''}{entry.totalReturn.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* View full leaderboard button */}
                          <button
                            onClick={() => handleTabChange('results')}
                            className="w-full mt-3 py-2 text-sm text-center text-brand-300 hover:text-brand-200 transition-colors"
                          >
                            View Full Leaderboard
                          </button>
                        </div>
                      </Card>
                      
                      {/* Contest summary stats */}
                      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
                        <div className="p-6">

                          {/* Contest Summary Header */}
                          <h2 className="text-xl font-bold text-gray-100 mb-4">Contest Summary</h2>

                          {/* Contest Summary Stats */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Your Return</span>
                              <span className={`font-medium ${
                                safeLeaderboardAccess.currentUserEntry 
                                  ? (safeLeaderboardAccess.currentUserEntry.totalReturn >= 0 ? 'text-green-400' : 'text-red-400')
                                  : 'text-gray-400'
                              }`}>
                                {safeLeaderboardAccess.currentUserEntry 
                                  ? `${safeLeaderboardAccess.currentUserEntry.totalReturn >= 0 ? '+' : ''}${safeLeaderboardAccess.currentUserEntry.totalReturn.toFixed(2)}%`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Best Performer</span>
                              <span className="text-green-400">
                                {safeLeaderboardAccess.firstEntry
                                  ? `+${safeLeaderboardAccess.firstEntry.totalReturn.toFixed(2)}%`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Average Return</span>
                              <span className="text-white">
                                {leaderboardEntriesForDisplay.length > 0 
                                  ? `${(leaderboardEntriesForDisplay.reduce((sum, entry) => sum + entry.totalReturn, 0) / leaderboardEntriesForDisplay.length).toFixed(1)}%`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Your Prize</span>
                              <span className="text-white font-mono">
                                {formatCurrency(safeLeaderboardAccess.currentUserEntry?.prize || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </div>

                </div>
              )}
                
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
      
      {/* Floating Action Button for Mobile Chat Toggle */}
      <AnimatePresence>
        {activeTab !== 'chat' && (
          <motion.button
            aria-label="Open chat"
            className="md:hidden fixed bottom-16 right-6 bg-brand-500 text-white rounded-full p-3 shadow-lg z-20 flex items-center justify-center"
            onClick={() => {
              setActiveTab('chat');
              setUnreadMessages(0);
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
    </div>
  );
};