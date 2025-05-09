// src/pages/public/contests/ContestResultsPage.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { VisualTester } from "../../../components/contest-lobby/VisualTester";
import { CelebrationOverlay } from "../../../components/contest-results/CelebrationOverlay";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import { formatCurrency } from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import { LeaderboardEntry as ApiLeaderboardEntry, ContestViewData, TokenHoldingPerformance } from "../../../types";

// Contest Results page - enhanced with next-level UI and interactive features
export const ContestResults: React.FC = () => {
  const navigate = useNavigate();
  const { id: contestIdFromParams } = useParams<{ id: string }>();
  const { user: currentUser } = useMigratedAuth();

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'results' | 'details' | 'chat'>('results');
  const [showCelebration, setShowCelebration] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highlightedToken, setHighlightedToken] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  
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
        const data = await ddApi.contests.getView(contestId);
        setContestViewData(data);
      } catch (err) { setError(err instanceof Error ? err.message : "Failed to load contest results."); }
      finally { setIsLoading(false); }
    };
    fetchContestResults();
  }, [contestIdFromParams]);

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

  // Optional: Handle wsError
  useEffect(() => {
    if (wsError) {
      console.warn("[ContestResults] WebSocket update error:", wsError);
      // Potentially addToast here
    }
  }, [wsError]);

  // UI state
  const [userRank, setUserRank] = useState(2); // Example placement
  
  // Handle celebration dismissal
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setAnimationComplete(true);
    
    // Trigger a subtle header highlight effect when the celebration closes
    if (headerRef.current) {
      headerRef.current.classList.add('animate-pulse-brief');
      setTimeout(() => {
        if (headerRef.current) {
          headerRef.current.classList.remove('animate-pulse-brief');
        }
      }, 1500);
    }
  };
  
  // Auto-dismiss celebration after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCelebrationClose();
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Trigger sequential animations after celebration completes
  useEffect(() => {
    if (animationComplete && contentRef.current) {
      contentRef.current.classList.add('animate-reveal-content');
    }
  }, [animationComplete]);
  
  /*
  // Random but consistent avatar generation for demo
  const getAvatarUrl = (username: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  };
  */

  /*
  // Generate random performance data (in production, this would come from API)
  const generatePerformanceData = () => {
    const now = new Date();
    const data = [];
    const contestDuration = 24; // 24 hours contest
    
    // Seed with a value that grows over time with some randomness
    let currentValue = 1000; // Starting value - $1000
    
    for (let i = 0; i < contestDuration; i++) {
      const timestamp = new Date(now.getTime() - (contestDuration - 1 - i) * 3600000).toISOString();
      
      // Create more interesting data pattern - start flat, then either up or down trend
      let change = 0;
      if (i < 4) {
        // First few hours relatively flat
        change = Math.random() * 20 - 10;
      } else if (i < 12) {
        // Middle hours trending up
        change = Math.random() * 30 + 10;
      } else if (i < 18) {
        // Later hours more volatile
        change = Math.random() * 60 - 20;
      } else {
        // End hours strong uptrend
        change = Math.random() * 40 + 20;
      }
      
      currentValue += change;
      currentValue = Math.max(currentValue, 800); // Don't go too low
      
      data.push({ timestamp, value: currentValue });
    }
    
    return data;
  };
  */
  
  // Contest data
  const contest = {
    id: contestIdFromParams,
    title: "Daily SOL Tournament",
    initialPortfolioValue: 1000,
    finalPortfolioValue: 1500, // Fixed to 1500 for a win for demo
  };
  
  // Enhanced leaderboard with profile pictures
  const leaderboardEntries: ApiLeaderboardEntry[] = contestViewData?.leaderboard || [];
  
  // Performance data for the chart
  const performanceData = generatePerformanceData();
  
  // Token results with images
  const tokenResults = [
    {
      symbol: "SOL",
      name: "Solana",
      initialValue: 600,
      finalValue: 900,
      change: 50,
      contribution: 60,
      image: "https://cryptologos.cc/logos/solana-sol-logo.png",
    },
    {
      symbol: "JTO",
      name: "Jito",
      initialValue: 400,
      finalValue: 600,
      change: 50,
      contribution: 40,
      image: "https://cryptologos.cc/logos/jito-jto-logo.png",
    },
  ];
  
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
  const leaderboardEntriesForDisplay: ApiLeaderboardEntry[] = contestViewData?.leaderboard || [];
  const currentUserPerformance = contestViewData?.currentUserPerformance;
  const currentUserLeaderboardEntry = leaderboardEntriesForDisplay.find(entry => entry.isCurrentUser);
  const userRankForDisplay = currentUserPerformance?.rank;

  // --- Loading and Error States --- 
  if (isLoading) { return <div className="p-8 text-center">Loading contest results...</div>; }
  if (error) { return <div className="p-8 text-center text-red-500">Error: {error}</div>; }
  if (!contestViewData || !contestDetails) { return <div className="p-8 text-center">No contest data available.</div>; }

  // --- Prepare data for child components (ensure correct property names and parsing) ---
  const performanceChartData = currentUserPerformance?.historicalPerformance.map(dp => ({
    timestamp: dp.timestamp,
    value: parseFloat(dp.value),
  })) || [];

  // --- Token Results for Display (for details tab) ---
  const tokenResultsForDisplay = currentUserPerformance?.tokens.map((apiToken: TokenHoldingPerformance) => ({
    symbol: apiToken.symbol,
    name: apiToken.name,
    imageUrl: apiToken.imageUrl,
    finalValue: parseFloat(apiToken.currentValueContribution), 
    change: parseFloat(apiToken.performancePercentage),
    contribution: parseFloat(apiToken.profitLossValueContribution),
    quantityForDetail: parseFloat(apiToken.quantity), // For details tab
    initialValueForDetail: parseFloat(apiToken.initialValueContribution), // For details tab
    priceForDetail: (parseFloat(apiToken.currentValueContribution) / (parseFloat(apiToken.quantity) || 1)) || 0, // For details tab
  })) || [];

  // --- Render the Contest Results Page ---
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      
      {/* Enhanced celebration overlay with custom handler */}
      {showCelebration && currentUserPerformance && (
        <CelebrationOverlay
          initialValue={parseFloat(currentUserPerformance.initialPortfolioValue)}
          finalValue={parseFloat(currentUserPerformance.portfolioValue)}
          onClose={handleCelebrationClose}
        />
      )}

      {/* Content Section Parent Container */}
      <div className="relative z-10 flex-grow">
        
        {/* Content Section - Main Container */}
        <div className="container mx-auto px-4 py-4 lg:py-8">
          
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
            
            {/* Join New Contest Button */}
            <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-3">
              <Button
                onClick={() => navigate("/contests")}
                className="relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
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
          <div className="hidden md:flex mb-6 border-b border-gray-700/50">
            <button
              onClick={() => handleTabChange('results')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'results'
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Results & Performance
            </button>
            <button
              onClick={() => handleTabChange('details')}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'details'
                  ? 'text-brand-400 border-brand-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Portfolio Details
            </button>
            <button
              onClick={() => {
                handleTabChange('chat');
                setUnreadMessages(0);
              }}
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
            >

              {/* Details Tab */}
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
                            <text x="50" y="55" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">${leaderboardEntriesForDisplay[1].finalValue}</text>
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
                            <span className="text-white font-mono">${contest.initialPortfolioValue.toLocaleString()}</span>
                          </div>
                          
                          {/* Final Value */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Final Value</span>
                            <span className="text-white font-mono">${leaderboardEntriesForDisplay[1].finalValue.toLocaleString()}</span>
                          </div>

                          {/* Total Return */}
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Total Return</span>
                            <span className={`font-mono ${leaderboardEntriesForDisplay[1].totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {leaderboardEntriesForDisplay[1].totalReturn >= 0 ? '+' : ''}{leaderboardEntriesForDisplay[1].totalReturn.toFixed(2)}%
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
                            <span className="text-white font-mono">${leaderboardEntriesForDisplay[1].prize}</span>
                          </div>

                          {/* Duration */}
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Duration</span>
                            <span className="text-white">24 hours</span>
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
                            <span className="text-white">{new Date(Date.now() - 86400000).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">End Date</span>
                            <span className="text-white">{new Date().toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span className="text-gray-400">Total Participants</span>
                            <span className="text-white">{leaderboardEntriesForDisplay.length}</span>
                          </div>
                          
                          <div className="flex justify-between pb-2">
                            <span className="text-gray-400">Total Prize Pool</span>
                            <span className="text-white font-mono">$1,000</span>
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
                              <span className={`font-medium ${leaderboardEntriesForDisplay[1].totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {leaderboardEntriesForDisplay[1].totalReturn >= 0 ? '+' : ''}{leaderboardEntriesForDisplay[1].totalReturn.toFixed(2)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Best Performer</span>
                              <span className="text-green-400">+{leaderboardEntriesForDisplay[0].totalReturn.toFixed(2)}%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Average Return</span>
                              <span className="text-white">+12.1%</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Your Prize</span>
                              <span className="text-white font-mono">${leaderboardEntriesForDisplay[1].prize}</span>
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
            className="md:hidden fixed bottom-6 right-6 bg-brand-500 text-white rounded-full p-3 shadow-lg z-20 flex items-center justify-center"
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
      
      {/* Visual Test Panel */}
      <VisualTester />
    </div>
  );
};