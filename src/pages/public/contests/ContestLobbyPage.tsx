// src/pages/public/contests/ContestLobbyPage.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { ContestTimer } from "../../../components/contest-lobby/ContestTimer";
import { Leaderboard } from "../../../components/contest-lobby/Leaderboard";
import { PortfolioPerformance } from "../../../components/contest-lobby/PortfolioPerformance";
import { TestSkipButton } from "../../../components/contest-lobby/TestSkipButton";
import { TokenPerformance } from "../../../components/contest-lobby/TokenPerformance";
import { VisualTester } from "../../../components/contest-lobby/VisualTester";
import { PerformanceChart } from "../../../components/contest-results/PerformanceChart";
import { Badge } from "../../../components/ui/Badge";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import { formatCurrency } from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import { ContestViewData } from "../../../types";

// Contest Lobby page
export const ContestLobby: React.FC = () => {
  const { id: contestIdFromParams } = useParams<{ id: string }>();
  const { user: currentUser } = useMigratedAuth();

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'chat'>('overview');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initial data fetch via REST
  useEffect(() => {
    const contestId = contestIdFromParams ?? null;
    if (!contestId) {
      setError("Contest ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchContestView = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ddApi.contests.getView(contestId);
        setContestViewData(data);
      } catch (err) {
        console.error("Failed to fetch contest view:", err);
        setError(err instanceof Error ? err.message : "Failed to load contest details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContestView();
  }, [contestIdFromParams]);

  // WebSocket updates
  const { 
    contestViewData: wsUpdatedData, 
    isConnected: wsIsConnected, 
    error: wsError 
  } = useContestViewUpdates(contestIdFromParams ?? null, contestViewData);

  // Effect to update page state when WebSocket pushes new data
  useEffect(() => {
    if (wsUpdatedData) {
      setContestViewData(wsUpdatedData);
    }
  }, [wsUpdatedData]);

  // Optional: Handle wsError if needed, e.g., show a toast or a connection status indicator
  useEffect(() => {
    if (wsError) {
      console.warn("[ContestLobbyPage] WebSocket update error:", wsError);
      // Example: addToast('error', `Live updates error: ${wsError}`, 'WebSocket Error');
    }
  }, [wsError]);

  const handleNewMessage = () => {
    if (activeTab !== 'chat') {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const handleTabChange = (tab: 'overview' | 'performance' | 'chat') => {
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
  const leaderboardEntries = contestViewData?.leaderboard || [];
  const currentUserPerformance = contestViewData?.currentUserPerformance;

  // --- Loading and Error States --- 
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-dark-200/50 rounded-lg w-3/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
                <div className="h-96 bg-dark-200/50 rounded-lg"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
                <div className="h-64 bg-dark-200/50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!contestViewData || !contestDetails) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p className="text-xl text-gray-400">Contest data not found or still loading.</p>
      </div>
    );
  }

  // --- Prepare data for child components ---
  const portfolioDataForDisplay = {
    tokens: currentUserPerformance?.tokens.map(token => ({
      token: {
        name: token.name,
        symbol: token.symbol,
        price: parseFloat(token.currentValueContribution) / parseFloat(token.quantity), // Approximate current price
        image: token.imageUrl,
      },
      amount: parseFloat(token.quantity),
      initialValue: parseFloat(token.initialValueContribution),
      currentValue: parseFloat(token.currentValueContribution),
    })) || [],
    totalValue: currentUserPerformance ? parseFloat(currentUserPerformance.portfolioValue) : 0,
    totalChange: currentUserPerformance ? parseFloat(currentUserPerformance.performancePercentage) : 0,
  };

  const performanceChartData = currentUserPerformance?.historicalPerformance.map(dp => ({
    timestamp: dp.timestamp,
    value: parseFloat(dp.value),
  })) || [];

  // --- Render Logic --- 
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <div className="relative z-10 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {/* Header Section with Mobile Toggle */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-auto mb-4 sm:mb-0">
              {/* Breadcrumb navigation */}
              <div className="mb-2 flex items-center text-sm text-gray-400">
                <Link to="/" className="hover:text-brand-400 transition-colors">
                  Home
                </Link>
                <span className="mx-2">›</span>
                <Link
                  to="/contests"
                  className="hover:text-brand-400 transition-colors"
                >
                  Contests
                </Link>
                <span className="mx-2">›</span>
                <span className="text-gray-300">{contestDetails.name}</span>
              </div>

              {/* Contest Title */}
              <h1 className="text-3xl font-bold text-gray-100 mb-2 flex items-center">
                {contestDetails.name}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="ml-3"
                >
                  <Badge 
                    variant={contestDetails.status === 'active' ? "success" : new Date() < new Date(contestDetails.startTime) ? "secondary" : "destructive"}
                  >
                    {contestDetails.status === 'active'
                      ? "LIVE NOW"
                      : new Date() < new Date(contestDetails.startTime)
                        ? "UPCOMING"
                        : contestDetails.status.toUpperCase()}
                  </Badge>
                </motion.div>
              </h1>
              
              <div className="flex items-center flex-wrap gap-2">
                {/* Contest Status & Prize */}
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">
                    Prize Pool:{" "}
                    <span className="text-brand-400 font-mono">
                      {formatCurrency(parseFloat(contestDetails.prizePool))}
                    </span>
                  </span>
                </div>
                
                {/* Desktop Tabs */}
                <div className="hidden md:flex items-center border-l border-gray-700 pl-2 ml-2">
                  <button
                    onClick={() => handleTabChange('overview')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activeTab === 'overview'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => handleTabChange('performance')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activeTab === 'performance'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => handleTabChange('chat')}
                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                      activeTab === 'chat'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    Chat
                    {unreadMessages > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Timer & Mobile Menu Button */}
            <div className="flex items-center justify-between">
              <div className="relative group mr-4">
                <div className="text-right mb-1">
                  <span className="text-sm text-gray-400">
                    {contestDetails.status === 'active' ? "Contest Ends In:" : new Date() < new Date(contestDetails.startTime) ? "Contest Starts In:" : "Contest Ended On:"}
                  </span>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <ContestTimer
                    endTime={new Date(contestDetails.endTime)}
                    showDate={new Date() > new Date(contestDetails.endTime)}
                  />
                </motion.div>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden bg-dark-300 hover:bg-dark-400 text-gray-300 px-2 py-1 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
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
                    onClick={() => handleTabChange('overview')}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'overview'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => handleTabChange('performance')}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'performance'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => handleTabChange('chat')}
                    className={`px-3 py-2 rounded-md text-left flex items-center ${
                      activeTab === 'chat'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Chat
                    {unreadMessages > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                  <TestSkipButton contestId={contestIdFromParams!} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content that changes based on active tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              ref={contentRef}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {currentUserPerformance && <PortfolioPerformance {...portfolioDataForDisplay} />}
                    <Leaderboard entries={leaderboardEntries} currentUserRank={currentUserPerformance?.rank} />
                  </div>
                  <div className="space-y-6">
                    {currentUserPerformance?.tokens.map((token, index) => (
                      <motion.div
                        key={token.symbol}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (index * 0.1) }}
                        className="relative group overflow-hidden rounded-lg"
                      >
                        <TokenPerformance 
                          token={{
                            name: token.name,
                            symbol: token.symbol,
                            price: parseFloat(token.currentValueContribution) / parseFloat(token.quantity), // Approx price
                            imageUrl: token.imageUrl 
                          }}
                          amount={parseFloat(token.quantity)}
                          initialValue={parseFloat(token.initialValueContribution)}
                          currentValue={parseFloat(token.currentValueContribution)}
                        />
                      </motion.div>
                    ))}
                    <div className="hidden lg:block"><TestSkipButton contestId={contestIdFromParams!} /></div>
                  </div>
                </div>
              )}
              
              {activeTab === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-dark-200/50 backdrop-blur-sm p-4 rounded-lg border border-dark-300"
                    >
                      {currentUserPerformance && performanceChartData.length > 0 ? (
                        <PerformanceChart 
                          data={performanceChartData} 
                          interactive={true}
                          highlightColor={
                            (currentUserPerformance?.performancePercentage && parseFloat(currentUserPerformance.performancePercentage) >= 0) 
                              ? "#10b981"
                              : "#ef4444"
                          }
                        />
                      ) : (
                        <div className="text-center py-10 text-gray-500">
                          <p>Performance data is not yet available or still loading.</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                  
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Leaderboard 
                        entries={leaderboardEntries} 
                        currentUserRank={currentUserPerformance?.rank}
                        className="mb-6" 
                      />
                      <div className="hidden lg:block"><TestSkipButton contestId={contestIdFromParams!} /></div>
                    </motion.div>
                  </div>
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-dark-200/10 backdrop-blur-sm rounded-lg border border-dark-300 overflow-hidden h-[600px]"
                    >
                      {contestIdFromParams && <ContestChat contestId={contestIdFromParams} onNewMessage={handleNewMessage} />}
                    </motion.div>
                  </div>
                  
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Leaderboard 
                        entries={leaderboardEntries} 
                        currentUserRank={currentUserPerformance?.rank}
                        className="mb-6" 
                      />
                      
                      {/* Only show on desktop */}
                      <div className="hidden lg:block">
                        <TestSkipButton contestId={contestIdFromParams!} />
                      </div>
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
            onClick={() => handleTabChange('chat')}
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