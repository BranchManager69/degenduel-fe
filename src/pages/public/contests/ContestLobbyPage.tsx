// src/pages/public/contests/ContestLobbyPage.tsx

import React, { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { ContestTimer } from "../../../components/contest-lobby/ContestTimer";
import { Leaderboard } from "../../../components/contest-lobby/Leaderboard";
import { PortfolioPerformance } from "../../../components/contest-lobby/PortfolioPerformance";
import { TestSkipButton } from "../../../components/contest-lobby/TestSkipButton";
import { TokenPerformance } from "../../../components/contest-lobby/TokenPerformance";
import { VisualTester } from "../../../components/contest-lobby/VisualTester";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { PerformanceChart } from "../../../components/contest-results/PerformanceChart";
import { formatCurrency, isContestLive } from "../../../lib/utils";
import { ddApi } from "../../../services/dd-api";
import { Contest as BaseContest } from "../../../types";
import { Badge } from "../../../components/ui/Badge";

// Contest Lobby page
export const ContestLobby: React.FC = () => {
  // Get the contest ID from the URL
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realContest, setRealContest] = useState<BaseContest | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'chat'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for animations
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Random but consistent avatar generation
  const getAvatarUrl = (username: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  };
  
  // Sample performance data (placeholder)
  const generatePerformanceData = () => {
    const now = new Date();
    const data = [];
    // Generate 24 hours of data
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (23 - i) * 3600000).toISOString();
      const value = 1000 + i * 20 + Math.random() * 50;
      data.push({ timestamp, value });
    }
    return data;
  };
  
  const performanceData = generatePerformanceData();

  // Fetch contest data from API
  useEffect(() => {
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
        console.log("Contest data (lobby):", data);
        setRealContest(data);
      } catch (err) {
        console.error("Failed to fetch contest:", err);
        // Check if the error is a 503 (maintenance mode)
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.",
          );
        } else {
          setError("Failed to load contest details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContest();
  }, [id]);

  // Derived contest data with proper types
  const contest = {
    id,
    title: realContest?.name || "Loading Contest...",
    difficulty: (realContest?.settings?.difficulty || "guppy") as
      | "guppy"
      | "tadpole"
      | "squid"
      | "dolphin"
      | "shark"
      | "whale",
    prizePool: Number(realContest?.prize_pool || 0),
    endTime: realContest
      ? new Date(realContest.end_time)
      : new Date(Date.now() + 3600000),
  };
  
  // Enhanced leaderboard entries with AI agent
  const leaderboardEntries = [
    {
      rank: 1,
      username: "DebugManager69",
      portfolioValue: 69420,
      change24h: 420.7,
      profilePicture: getAvatarUrl("DebugManager69"),
    },
    {
      rank: 2,
      username: "DegenDuelAI",
      portfolioValue: 42069,
      change24h: 69.4,
      isAiAgent: true,
      profilePicture: "/ai-assistant.png",
    },
    {
      rank: 3,
      username: "realDonaldTrump",
      portfolioValue: 15100,
      change24h: 12.3,
      profilePicture: getAvatarUrl("realDonaldTrump"),
    },
    {
      rank: 4,
      username: "iEatAss_sn1p3z",
      portfolioValue: 12300,
      change24h: 8.7,
      profilePicture: getAvatarUrl("iEatAss_sn1p3z"),
    },
    {
      rank: 5,
      username: "YoWhoFknJ33T3D",
      portfolioValue: 6900,
      change24h: -5.2,
      profilePicture: getAvatarUrl("YoWhoFknJ33T3D"),
    },
    {
      rank: 6,
      username: "sol_survivor",
      portfolioValue: 4200,
      change24h: -8.1,
      profilePicture: getAvatarUrl("sol_survivor"),
    },
  ];
  
  // Enhanced portfolio data with token images
  const portfolioData = {
    tokens: [
      {
        token: {
          name: "Solana",
          symbol: "SOL",
          price: 105.25,
          image: "https://cryptologos.cc/logos/solana-sol-logo.png",
        },
        amount: 10,
        initialValue: 1000,
        currentValue: 1052.5,
      },
      {
        token: {
          name: "Bonk",
          symbol: "BONK",
          price: 0.00001875,
          image: "https://cryptologos.cc/logos/bonk-bonk-logo.png",
        },
        amount: 26666666.67,
        initialValue: 500,
        currentValue: 500,
      },
      {
        token: {
          name: "Jito",
          symbol: "JTO",
          price: 3.25,
          image: "https://cryptologos.cc/logos/jito-jto-logo.png",
        },
        amount: 150,
        initialValue: 500,
        currentValue: 487.5,
      },
    ],
    totalValue: 2040,
    totalChange: 2.00,
  };
  
  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadMessages(0);
    }
  };
  
  // Handle new messages
  const handleNewMessage = () => {
    if (!showChat) {
      setUnreadMessages(prev => prev + 1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
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

  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
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

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <BackgroundEffects />

      {/* Content Section */}
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
                <span className="text-gray-300">{contest.title}</span>
              </div>

              {/* Contest Title */}
              <h1 className="text-3xl font-bold text-gray-100 mb-2 flex items-center">
                {contest.title}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="ml-3"
                >
                  {realContest && (
                    <Badge 
                      variant={isContestLive(realContest) ? "success" : new Date() < new Date(realContest.start_time) ? "secondary" : "destructive"}
                    >
                      {isContestLive(realContest)
                        ? "LIVE NOW"
                        : new Date() < new Date(realContest.start_time)
                          ? "UPCOMING"
                          : "ENDED"}
                    </Badge>
                  )}
                </motion.div>
              </h1>
              
              <div className="flex items-center flex-wrap gap-2">
                {/* Contest Status & Prize */}
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">
                    Prize Pool:{" "}
                    <span className="text-brand-400 font-mono">
                      {formatCurrency(contest.prizePool)}
                    </span>
                  </span>
                </div>
                
                {/* Desktop Tabs */}
                <div className="hidden md:flex items-center border-l border-gray-700 pl-2 ml-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activeTab === 'overview'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activeTab === 'performance'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => {setActiveTab('chat'); toggleChat()}}
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
                    {realContest && (
                      isContestLive(realContest)
                        ? "Contest Ends In:"
                        : new Date() < new Date(realContest.start_time)
                          ? "Contest Starts In:"
                          : "Contest Ended On:"
                    )}
                  </span>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <ContestTimer
                    endTime={contest.endTime}
                    showDate={
                      !!(
                        realContest &&
                        new Date() > new Date(realContest.end_time)
                      )
                    }
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
                    onClick={() => {setActiveTab('overview'); setMobileMenuOpen(false)}}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'overview'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => {setActiveTab('performance'); setMobileMenuOpen(false)}}
                    className={`px-3 py-2 rounded-md text-left ${
                      activeTab === 'performance'
                        ? 'bg-brand-500/30 text-brand-300'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Performance
                  </button>
                  <button
                    onClick={() => {setActiveTab('chat'); setMobileMenuOpen(false); toggleChat()}}
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
                  <TestSkipButton contestId={id!} />
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
                    {/* Portfolio Performance */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative group overflow-hidden rounded-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <PortfolioPerformance {...portfolioData} />
                    </motion.div>

                    {/* Leaderboard */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative group overflow-hidden rounded-lg"
                    >
                      <Leaderboard entries={leaderboardEntries} currentUserRank={2} />
                    </motion.div>
                  </div>

                  {/* Token Performance Cards Column */}
                  <div className="space-y-6">
                    {portfolioData.tokens.map((tokenData, index) => (
                      <motion.div
                        key={tokenData.token.symbol}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (index * 0.1) }}
                        className="relative group overflow-hidden rounded-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <TokenPerformance {...tokenData} />
                      </motion.div>
                    ))}
                    
                    {/* Only show on desktop */}
                    <div className="hidden lg:block">
                      <TestSkipButton contestId={id!} />
                    </div>
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
                      <PerformanceChart data={performanceData} />
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
                        currentUserRank={2}
                        className="mb-6" 
                      />
                      
                      {/* Only show on desktop */}
                      <div className="hidden lg:block">
                        <TestSkipButton contestId={id!} />
                      </div>
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
                      <ContestChat contestId={id!} onNewMessage={handleNewMessage} />
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
                        currentUserRank={2}
                        className="mb-6" 
                      />
                      
                      {/* Only show on desktop */}
                      <div className="hidden lg:block">
                        <TestSkipButton contestId={id!} />
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
            onClick={() => {
              setActiveTab('chat');
              toggleChat();
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