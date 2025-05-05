// src/pages/LandingPage.tsx

/**
 * Landing Page
 * @description This is the landing page for the DegenDuel website.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-01-01
 * @updated 2025-05-02
 */

// CSS (now loaded from public/assets/degen-components.css via index.html)
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Link as RouterLink } from "react-router-dom";
// Framer Motion
import { motion } from "framer-motion";
// Landing page
import { AuthDebugPanel } from "../../../components/debug";
import { ContestSection } from "../../../components/landing/contests-preview/ContestSection";
import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle";
import { FEATURE_FLAGS } from "../../../config/config";
import { isContestLive } from "../../../lib/utils";
import { Contest } from "../../../types";
// Terminal components
import { DecryptionTimer, Terminal } from '../../../components/terminal';
//// import { processTerminalChat } from '../../../services/mockTerminalService';
// Hooks
import { useAuth } from "../../../hooks/useAuth";
import { useWallet } from "../../../hooks/websocket/topic-hooks/useWallet";
// DD API
import { ddApi } from "../../../services/dd-api";


// Contract Address Service (DEPRECATED)
import {
  CONTRACT_POLL_INTERVAL, // ?
  fetchContractAddress, // DEPRECATED
  getTimeRemainingUntilRelease, // ?
  isReleaseTimePassed, // DEPRECATED
  setContractAddressPublic // DEPRECATED
} from '../../../services/contractAddressService';
// Release Date Service (?)
import {
  FALLBACK_RELEASE_DATE, // ?
  fetchReleaseDate, // ?
  formatReleaseDate // ?
} from '../../../services/releaseDateService';

// Config
import { config as globalConfig } from '../../../config/config';

// Import PaginatedResponse from types
import { PaginatedResponse } from '../../../types';

// Define WhaleRoomButton component
const WhaleRoomButton = ({ walletAddress }: { walletAddress: string }) => {
  // useWallet hook - Retrieve client balance data
  const {
    balance,
    isLoading,
  } = useWallet(walletAddress);
  
  // Whale criteria check: 
  //   1. SOL balance > 10 SOL, or
  //   2. Any token with USD value > $5,000, or
  //   3. Total portfolio value > $10,000 
  const isWhale = React.useMemo(() => {
    if (!balance || isLoading) return false;
    
    // Check SOL balance criteria (>10 SOL)
    if (balance.sol_balance > 10) return true;
    
    // Check for any high-value tokens (>$5,000)
    const hasHighValueToken = balance.tokens.some(token => 
      token.value_usd && token.value_usd > 5000
    );
    
    if (hasHighValueToken) return true;
    
    // Calculate total portfolio value
    const totalValue = balance.tokens.reduce((sum, token) => 
      sum + (token.value_usd || 0), 
      0
    );
    
    // Add SOL value (approximating $100 per SOL)
    const portfolioValueWithSol = totalValue + (balance.sol_balance * 100);
    
    // Check portfolio value criteria (>$10,000) 
    return portfolioValueWithSol > 10000;
  }, [balance, isLoading]);
  
  // If user meets whale criteria, show button to access the exclusive Whale Room
  if (!isWhale) return null;
  
  // If user does not meet whale criteria, do not show the button
  return (
    <div className="w-full max-w-md">
      <RouterLink to="/whale-room" className="w-full">
        <button 
          className="w-full relative group overflow-hidden"
          aria-label="Access the exclusive Whale Room"
        >
          {/* Gradient background */}
          <div className="relative clip-edges bg-gradient-to-r from-purple-500 to-indigo-600 p-[1px] transition-all duration-300 group-hover:from-purple-400 group-hover:to-indigo-500 shadow-md shadow-purple-900/20">
            <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                <span className="bg-gradient-to-r from-purple-300 to-indigo-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-purple-200 flex items-center">
                  <span className="mr-2">💎</span>
                    WHALE ROOM
                  </span>
                  {/* Arrow icon */}
                  <svg
                    className="w-5 h-5 text-purple-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
                    fill="none" 
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {/* Arrow path */}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </RouterLink>
      </div>
  );
};

// Landing Page component
export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Contract address polling and management
  const [contractAddress, setContractAddress] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<Date>(FALLBACK_RELEASE_DATE);
  const [isLoadingReleaseDate, setIsLoadingReleaseDate] = useState<boolean>(true);
  const [showContractReveal, setShowContractReveal] = useState<boolean>(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const countdownCheckerRef = useRef<number | null>(null);
  const countdownEndedRef = useRef<boolean>(false);
  
  // Debug state for contests section (?)
  const [contestDebugInfo, setContestDebugInfo] = useState<{
    lastFetchAttempt: string;
    errorDetails: string | null;
    contestApiResponse: string | null;
  }>({
    lastFetchAttempt: '',
    errorDetails: null,
    contestApiResponse: null
  });
  
  // Fetch release date from backend when component mounts (?)
  useEffect(() => {
    // Fetch release date from backend
    const loadReleaseDate = async () => {
      try {
        setIsLoadingReleaseDate(true);
        const date = await fetchReleaseDate();
        setReleaseDate(date);
        console.log(`Release date set to: ${formatReleaseDate(date)}`);
      } catch (error) {
        console.error('Error fetching release date:', error);
        setReleaseDate(FALLBACK_RELEASE_DATE);
        console.log(`Using fallback date: ${formatReleaseDate(FALLBACK_RELEASE_DATE)}`);
      } finally {
        setIsLoadingReleaseDate(false);
      }
    };
    
    loadReleaseDate();
  }, []);
  
  // Start contract address polling (after countdown ends) (?)
  const startAddressPolling = useCallback(() => {
    console.log('Starting contract address polling');
    countdownEndedRef.current = true;
    
    // For demo purposes, make the contract address public after countdown ends
    //
    // TODO: Remove this!
    //
    setContractAddressPublic(true);
    
    // Trigger immediate fetch
    //
    // TODO: remove this after testing
    //
    fetchContractAddress().then(address => {
      // Update the contract address
      setContractAddress(address);
    });
    
    // Start polling for contract address
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = window.setInterval(async () => {
        const address = await fetchContractAddress();
        setContractAddress(address);
      }, CONTRACT_POLL_INTERVAL);
    }
  }, []);
  
  // Set up a checker to detect when countdown ends
  useEffect(() => {
    // Don't set up the checker if we're still loading the release date
    if (isLoadingReleaseDate) {
      return;
    }
    
    // Clear any existing timeout when release date changes
    if (countdownCheckerRef.current) {
      clearTimeout(countdownCheckerRef.current);
      countdownCheckerRef.current = null;
    }
    
    // Check if countdown has already ended
    if (isReleaseTimePassed(releaseDate)) {
      console.log(`Release time already passed: ${formatReleaseDate(releaseDate)}`);
      setShowContractReveal(true);
      startAddressPolling();
    } else {
      // Calculate time until release
      const timeUntilRelease = getTimeRemainingUntilRelease(releaseDate);
      const formattedDate = formatReleaseDate(releaseDate);
      console.log(`Countdown to ${formattedDate} will end in ${timeUntilRelease}ms`);
      
      // Set a timeout to start polling when countdown ends
      countdownCheckerRef.current = window.setTimeout(() => {
        console.log('Countdown timer complete - starting polling');
        setShowContractReveal(true);
        startAddressPolling();
      }, timeUntilRelease + 100); // Add 100ms buffer
    }
    
    // Clean up polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (countdownCheckerRef.current) {
        clearTimeout(countdownCheckerRef.current);
      }
    };
  }, [releaseDate, startAddressPolling, isLoadingReleaseDate]);

  // Terminal configuration (NEED WEBSOCKET VERSION ASAP!)
  const terminalConfig = {
    // Contract address for display in Terminal
    CONTRACT_ADDRESS: showContractReveal ? globalConfig.CONTRACT_ADDRESS.REAL : contractAddress,
    // Launch date for countdown timer 
    RELEASE_DATE: globalConfig.RELEASE_DATE.TOKEN_LAUNCH_DATETIME || releaseDate,
    // Format settings for display
    DISPLAY: {
      DATE_SHORT: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_SHORT,
      DATE_FULL: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_FULL,
      TIME: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_TIME,
    }
  };
  
  // Debug log for release date sources
  useEffect(() => {
    console.log('[LandingPage] Release date sources:', {
      releaseDate,
      releaseDateToISOString: releaseDate.toISOString(),
      globalConfigDate: globalConfig.RELEASE_DATE.TOKEN_LAUNCH_DATETIME,
      globalConfigDateToISOString: globalConfig.RELEASE_DATE.TOKEN_LAUNCH_DATETIME.toISOString(),
      fallbackDate: FALLBACK_RELEASE_DATE,
      fallbackDateToISOString: FALLBACK_RELEASE_DATE.toISOString(),
      configReleaseDate: terminalConfig.RELEASE_DATE,
      configReleaseDateToISOString: terminalConfig.RELEASE_DATE.toISOString(),
      envVars: {
        DATE_SHORT: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_SHORT,
        DATE_FULL: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_FULL,
        TIME: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_TIME,
      }
    });
  }, [releaseDate, terminalConfig]);
  
  // Use auth hook for proper admin status checks
  const { user, isAdmin } = useAuth();
  
  // Log user status for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LandingPage] User permissions:', { 
        loggedIn: !!user,
        isAdmin: isAdmin(),
        role: user?.role
      });
    }
  }, [user, isAdmin]);
  
  // Shared debug mode state - controls both HeroTitle debug panel and WebSocketMonitor visibility (?)
  const [debugMode, setDebugMode] = useState(false);

  // Function to manually retry contest fetch (?)
  const retryContestFetch = useCallback(async () => {
    console.log("[LandingPage] Manually retrying contest fetch...");
    setLoading(true);
    setError(null);
    
    // Update the debug info with attempt timestamp
    setContestDebugInfo(prev => ({
      ...prev,
      lastFetchAttempt: new Date().toISOString()
    }));
    
    try {
      // First check maintenance mode
      const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
      setIsMaintenanceMode(isInMaintenance);
      
      // If in maintenance mode, don't fetch contests
      if (isInMaintenance) {
        setError("DegenDuel is in Maintenance Mode. Please try again later.");
        setLoading(false);
        return;
      }
      
      // If not in maintenance mode, fetch contests with detailed logging
      const response = await ddApi.contests.getAll();
      console.log("[LandingPage] Contests:", response);
      
      // Store response in debug info
      setContestDebugInfo(prev => ({
        ...prev,
        contestApiResponse: JSON.stringify(response, null, 2)
      }));
      
      // Process response
      const contestsArray: Contest[] = Array.isArray(response)
        ? response
        : (response as PaginatedResponse<Contest>).data || [];
      
      // Log info about contests received
      console.log("[LandingPage] Contest fetch success:", {
        total: contestsArray.length,
        statuses: contestsArray.map(c => c.status),
        names: contestsArray.map(c => c.name)
      });
      
      // Set active ('live') contests
      setActiveContests(contestsArray.filter(isContestLive));
      
      // Set open ('pending' / 'upcoming') contests
      setOpenContests(
        contestsArray.filter(
          (contest: Contest) => contest.status === "pending",
        ),
      );
      
      // Clear any errors
      setError(null);
    } catch (err) {
      console.error(`[LandingPage] Failed to load contests:`, err);
      
      // Store detailed error for debugging
      const errorDetails = err instanceof Error 
        ? `${err.name}: ${err.message}\n${err.stack || "No stack trace"}`
        : String(err);
      
      setContestDebugInfo(prev => ({
        ...prev,
        errorDetails
      }));
      
      if (err instanceof Error && err.message.includes("503")) {
        setIsMaintenanceMode(true);
        setError("DegenDuel is in Maintenance Mode. Please try again later.");
      } else {
        setError(`Failed to load contests: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect for the animation phases with better HeroTitle/Terminal coordination (?)
  useEffect(() => {
    // Adjust animation timing based on whether HeroTitle is shown
    const initialDelay = FEATURE_FLAGS.SHOW_HERO_TITLE ? 1200 : 300;
    const secondDelay = FEATURE_FLAGS.SHOW_HERO_TITLE ? 2400 : 800;
    
    // Animation phases for the title - timing adjusted based on HeroTitle visibility
    const phaseOneTimer = setTimeout(() => {
      setAnimationPhase(1); // Initial reveal 
    }, initialDelay);

    const phaseTwoTimer = setTimeout(() => {
      setAnimationPhase(2); // Full animation
    }, secondDelay);

    // Fetch contests
    const fetchContests = async () => {
      await retryContestFetch();
    };
    
    // Fetch contests immediately
    fetchContests();

    // Poll maintenance status every n seconds
    // TODO: improve Maintenance Mode checks via WSS if technically possible
    const MM_POLL_INTERVAL = 30; // in seconds
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
        if (isInMaintenance) {
          setError("DegenDuel is in Maintenance Mode. Please try again later.");
        }
      } catch (err) {
        console.error(`Failed to check maintenance status: ${err}`);
      }
    }, MM_POLL_INTERVAL * 1000);

    return () => {
      clearInterval(maintenanceCheckInterval);
      clearTimeout(phaseOneTimer);
      clearTimeout(phaseTwoTimer);
    };
  }, [retryContestFetch]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">

      {/* Landing Page Content Section */}
      <section className="relative flex-1 pb-20" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-4">
            
            {/* Title Section */}
            <div className="flex flex-col items-center justify-center">
              {/* Admin button now only shows the three topic-specific monitors */}
              
              {/* Admin debug button - visible even when HeroTitle is hidden */}
              {isAdmin() && (
                <div className="flex justify-end mb-2">
                  <button
                    className="bg-black/50 text-white text-xs p-1 rounded-md"
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    {debugMode ? "🛠️" : "🐛"}
                  </button>
                </div>
              )}
              
              {/* WebSocket Demo Section - only visible to admins with debug mode enabled */}
              {debugMode && isAdmin() && (
                <div className="w-full mb-10">
                  
                  {/* Auth Debug Panel - shows authentication state for debugging */}
                  <div className="mb-6 bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                    <h4 className="text-xl font-semibold mb-4 text-amber-400">Authentication Debug</h4>
                    <AuthDebugPanel />
                  </div>
                  
                  {/* Responsive grid layout - one column on mobile, three columns on large screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Token Data Demo */}
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                      <h4 className="text-xl font-semibold mb-4 text-brand-400">Market Data Topic</h4>
                      <React.Suspense fallback={<div className="p-4 text-center text-gray-500">Loading token data...</div>}>
                        {(() => {
                          const TokenDataDebug = React.lazy(() => import("../../../components/debug/websocket/TokenDataDebug"));
                          return <TokenDataDebug />;
                        })()}
                      </React.Suspense>
                    </div>
                    
                    {/* System Status Demo */}
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                      <h4 className="text-xl font-semibold mb-4 text-cyan-400">System Topic</h4>
                      <React.Suspense fallback={<div className="p-4 text-center text-gray-500">Loading system status...</div>}>
                        {(() => {
                          const SystemStatusDebug = React.lazy(() => import("../../../components/debug/websocket/SystemStatusDebug"));
                          return <SystemStatusDebug />;
                        })()}
                      </React.Suspense>
                    </div>
                    
                    {/* User Profile Demo */}
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                      <h4 className="text-xl font-semibold mb-4 text-purple-400">User Topic (Requires Auth)</h4>
                      <React.Suspense fallback={<div className="p-4 text-center text-gray-500">Loading user profile...</div>}>
                        {(() => {
                          const UserProfileDebug = React.lazy(() => import("../../../components/debug/websocket/UserProfileDebug"));
                          return <UserProfileDebug />;
                        })()}
                      </React.Suspense>
                    </div>
                  </div>
                </div>
              )}
              
              {/* HeroTitle component with better Terminal coordination - conditionally rendered based on feature flag */}
              {FEATURE_FLAGS.SHOW_HERO_TITLE && (
                <>
                  <div className="w-full h-[15vh] relative overflow-visible z-10">
                    <HeroTitle 
                      onComplete={() => {
                        // When HeroTitle animation is complete, we could trigger Terminal actions
                        console.log('HeroTitle animation completed');
                      }} 
                      debugMode={debugMode}
                      setDebugMode={setDebugMode}
                    />
                  </div>

                  {/* Spacing between hero and terminal - only shown when HeroTitle is visible */}
                  <div className="h-[8vh] min-h-[40px] w-full"></div>
                </>
              )}
              
              {/* Common tagline for all users */}
              <motion.div
                className="mt-8 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 20,
                  transition: {
                    delay: 0.3,
                    duration: 0.8,
                  },
                }}
              >
                <motion.div
                  className="relative"
                  initial={{ backgroundPosition: "200% center" }}
                  animate={{
                    backgroundPosition: ["200% center", "-200% center"],
                  }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        to right, 
                        #b266ff, #9933ff, #6600cc, #9933ff, 
                        #b266ff 50%, #9933ff 50%,
                        #b266ff 55%, #9933ff 55%, 
                        #ddbcff 56%, #ffffff 58%, 
                        #ddbcff 60%, #9933ff 62%,
                        #b266ff 70%
                      )
                    `,
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    display: "inline-block"
                  }}
                >
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight px-4">
                    High-Stakes Trading Competitions on Solana
                  </h2>
                </motion.div>
              </motion.div>

              {/* Call to action buttons - using a 2-row layout with primary button on top */}
              <motion.div
                className="mt-8 mb-10 flex flex-col items-center justify-center gap-6 px-4 sm:px-0 max-w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 20,
                  transition: {
                    delay: 0.6,
                    duration: 0.8,
                  },
                }}
              >
                {/* Primary action button - larger and with pulse animation */}
                {user ? (
                  <RouterLink to="/contests" className="w-full max-w-md">
                    <button 
                      className="w-full relative group overflow-hidden"
                      aria-label="Find a duel to join"
                    >
                      <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[2px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500 shadow-lg shadow-emerald-900/20 animate-pulse-subtle">
                        <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-10 py-5">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                          <div className="relative flex items-center justify-between space-x-6 text-2xl font-cyber">
                            <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                              FIND DUEL
                            </span>
                            <svg
                              className="w-7 h-7 text-emerald-400 group-hover:text-white transform group-hover:translate-x-2 transition-all"
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
                          </div>
                        </div>
                      </div>
                    </button>
                  </RouterLink>
                ) : (
                  <RouterLink to="/login" className="w-full max-w-md">
                    <button 
                      className="w-full relative group overflow-hidden"
                      aria-label="Connect your wallet to start"
                    >
                      <div className="relative clip-edges bg-gradient-to-r from-brand-500 to-brand-600 p-[2px] transition-all duration-300 group-hover:from-brand-400 group-hover:to-brand-500 shadow-lg shadow-brand-900/20 animate-pulse-subtle">
                        <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-10 py-5">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                          <div className="relative flex items-center justify-between space-x-6 text-2xl font-cyber">
                            <span className="bg-gradient-to-r from-brand-300 to-brand-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-brand-200">
                              CONNECT
                            </span>
                            <svg
                              className="w-7 h-7 text-brand-400 group-hover:text-white transform group-hover:translate-x-2 transition-all"
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
                          </div>
                        </div>
                      </div>
                    </button>
                  </RouterLink>
                )}

                {/* Secondary buttons row - two buttons side by side with same color */}
                <div className="flex flex-col sm:flex-row w-full max-w-md gap-4 justify-between">
                  {/* GAMEPLAY button */}
                  <RouterLink to="/how-it-works" className="w-full sm:w-[48%]">
                    <button 
                      className="w-full relative group overflow-hidden"
                      aria-label="Learn gameplay instructions"
                    >
                      <div className="relative clip-edges bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500 shadow-md shadow-blue-900/20">
                        <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                          <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                            <span className="bg-gradient-to-r from-blue-300 to-cyan-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-blue-200">
                              GAMEPLAY
                            </span>
                            <svg
                              className="w-5 h-5 text-blue-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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
                          </div>
                        </div>
                      </div>
                    </button>
                  </RouterLink>

                  {/* FAQ button - now using same blue/cyan color scheme as GAMEPLAY */}
                  <RouterLink to="/faq" className="w-full sm:w-[48%]">
                    <button 
                      className="w-full relative group overflow-hidden"
                      aria-label="View frequently asked questions"
                    >
                      <div className="relative clip-edges bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500 shadow-md shadow-blue-900/20">
                        <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                          <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                            <span className="bg-gradient-to-r from-blue-300 to-cyan-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-blue-200">
                              FAQ
                            </span>
                            <svg
                              className="w-5 h-5 text-blue-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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
                          </div>
                        </div>
                      </div>
                    </button>
                  </RouterLink>
                </div>

                {/* Conditional WHALE ROOM button - only shown to users with significant token/SOL balances */}
                {user && (
                  <WhaleRoomButton walletAddress={user.wallet_address} />
                )}
                
                {/* Whale room button is conditionally rendered above */}
                
                {/* Link to standardized test page */}
                <RouterLink to="/tokens/standardized-test" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                  View Standardized Components
                </RouterLink>
              </motion.div>

              {/* Countdown Timer Component */}
              <motion.div
                className="w-full max-w-lg mx-auto mb-8 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 20,
                  transition: {
                    delay: FEATURE_FLAGS.SHOW_HERO_TITLE ? 0.2 : 0.1,
                    duration: 0.7,
                  },
                }}
              >
                {isLoadingReleaseDate ? (
                  <div className="flex items-center justify-center h-[120px]">
                    <div className="text-center">
                      <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-md font-orbitron text-green-400">Loading countdown...</p>
                    </div>
                  </div>
                ) : (
                  <DecryptionTimer
                    targetDate={releaseDate}
                    contractAddress={contractAddress}
                  />
                )}
              </motion.div>

              {/* Platform Features Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: animationPhase > 0 ? 1 : 0,
                  transition: { duration: 0.7, delay: 0.4 }
                }}
                className="text-center mb-10"
              >
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple-500 mb-4">PLATFORM <span className="text-purple-300">·</span> FEATURES</h2>
                <div className="w-full max-w-2xl mx-auto h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-8"></div>
                <p className="text-xl sm:text-2xl md:text-3xl font-light text-white/90">
                  Experience the future of competitive token trading
                </p>
              </motion.div>

              {/* Terminal Component */}
              <motion.div
                className="w-full max-w-3xl mx-auto mb-10 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 20,
                  transition: {
                    delay: FEATURE_FLAGS.SHOW_HERO_TITLE ? 0.6 : 0.3,
                    duration: 0.8,
                  },
                }}
                onAnimationComplete={() => {
                  // When terminal animation completes, it signals completion
                  console.log('Terminal animation completed');
                }}
              >
                {isLoadingReleaseDate ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-xl font-orbitron text-purple-400">Loading terminal...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl sm:text-3xl font-bold text-purple-500">TERMINAL</h3>
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-purple-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </motion.div>
                    </div>
                    
                    <Terminal 
                      config={terminalConfig} 
                      onCommandExecuted={(command, response) => {
                        console.log('Command executed:', command, 'Response:', response);
                      }}
                      size="middle"
                    />
                  </div>
                )}
              </motion.div>
              
              {/* Enhanced Features section - shown to all users */}
              {FEATURE_FLAGS.SHOW_FEATURES_SECTION && (
                <motion.div
                  className="relative w-full mt-12"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: animationPhase > 0 ? 1 : 0,
                    transition: {
                      delay: 0.9,
                      duration: 1.2,
                    },
                  }}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Features component is only imported and rendered when the flag is enabled */}
                    {(() => {
                      if (FEATURE_FLAGS.SHOW_FEATURES_SECTION) {
                        // Dynamic import only when needed
                        const Features = React.lazy(
                          () =>
                            import(
                              "../../../components/landing/features-list/Features"
                            ),
                        );
                        return (
                          <React.Suspense fallback={<div>Loading features...</div>}>
                            <Features />
                          </React.Suspense>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>
              )}
              
              {/* Market Overview Panel - shown to all users */}
              <motion.div
                className="w-full mt-8 mb-4"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: animationPhase > 1 ? 1 : 0,
                  transition: {
                    delay: 0.7,
                    duration: 0.8,
                  },
                }}
              >
                {/* Market Overview Panel */}
                {(() => {

                  // Lazy-load the StandardizedMarketStatsPanel component
                  const MarketStatsPanel = React.lazy(() => 
                    import("../../../components/landing/market-stats").then(module => ({ 
                      default: module.StandardizedMarketStatsPanel
                    }))
                  );

                  // Return the MarketStatsPanel component
                  return (
                    <React.Suspense 
                      fallback={
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                          <div className="h-32 bg-dark-300/20 rounded-xl animate-pulse"></div>
                        </div>
                      }
                    >
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <MarketStatsPanel />
                      </div>
                    </React.Suspense>
                  );

                })()}
              </motion.div>
              
              {/* Elite Hot Tokens List - shown to all users with consistent token count */}
              <motion.div
                className="w-full mt-8 mb-6"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: animationPhase > 1 ? 1 : 0,
                  transition: {
                    delay: 0.7,
                    duration: 0.8,
                  },
                }}
              >
                {(() => {
               
                  // Lazy-load the StandardizedHotTokensList component
                  const HotTokensList = React.lazy(() => 
                    import("../../../components/landing/hot-tokens").then(module => ({ 
                      default: module.StandardizedHotTokensList
                    }))
                  );
                  
                  // Return the HotTokensList component
                  return (
                    <React.Suspense 
                      fallback={
                        <div className="py-10 flex justify-center">
                          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      }
                    >
                      {/* Display the HotTokensList component */}
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <HotTokensList maxTokens={5} />
                      </div>
                    </React.Suspense>
                  );

                })()}
              </motion.div>
              
              {/* Top Tokens Display - shown to all users with consistent token count */}
              <motion.div
                className="w-full mt-8"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: animationPhase > 1 ? 1 : 0,
                  transition: {
                    delay: 0.9,
                    duration: 0.8,
                  },
                }}
              >
                {(() => {
               
                  // Lazy-load the TokensPreviewSection component
                  const TokensPreviewSection = React.lazy(() => 
                    import("../../../components/landing/tokens-preview").then(module => ({ 
                      default: module.TokensPreviewSection 
                    }))
                  );
                  
                  // Return the TokensPreviewSection component
                  return (
                    <React.Suspense 
                      fallback={
                        <div className="py-10 flex justify-center">
                          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      }
                    >
                      {/* Display the TokensPreviewSection component */}
                      <TokensPreviewSection maxTokens={6} />                      
                    </React.Suspense>
                  );
                })()}
              </motion.div>
              
              {/* Contest sections - shown to all users */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 40,
                  transition: {
                    delay: 1.2,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 50,
                  },
                }}
              >
                {/* Maintenance mode */}
                {isMaintenanceMode ? (
                  <div className="relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                      <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-yellow-400">
                          <span className="animate-pulse">⚠</span>
                          
                          {/* Maintenance mode message */}
                          <span>
                            DegenDuel is in Maintenance Mode. Please try again later.
                          </span>
                          
                          {/* Maintenance mode icon */}
                          <span className="animate-pulse">⚙️</span>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
                        <div className="text-center py-4">
                          <div className="text-red-400 mb-2">
                            {error}
                          </div>
                          
                          {/* Debug info (admin only) */}
                          {isAdmin() && (
                            <details className="mt-3 text-left bg-dark-300/50 p-3 rounded-lg border border-gray-700/50 text-xs">
                              <summary className="text-gray-400 cursor-pointer">Debug Information</summary>
                              
                              {/* Debug info */}
                              <div className="mt-2 text-gray-300 space-y-1 font-mono pl-2">
                               
                                {/* Last fetch attempt */}
                                <div>Last Fetch Attempt:
                                  <span className="text-blue-400">
                                    {contestDebugInfo.lastFetchAttempt}
                                  </span>
                                </div>
                                
                                {/* Error details */}
                                <div>Error Details:</div>
                                <pre className="text-red-400 whitespace-pre-wrap ml-2 text-xs bg-dark-400/30 p-2 rounded-md">
                                  {contestDebugInfo.errorDetails || "No specific error details available"}
                                </pre>

                                {/* API response */}
                                <div>API Response:</div>
                                <pre className="text-gray-400 whitespace-pre-wrap ml-2 text-xs bg-dark-400/30 p-2 rounded-md">
                                  {contestDebugInfo.contestApiResponse || "No API response recorded"}
                                </pre>

                              </div>
                            </details>
                          )}
                          
                          {/* Retry loading button */}
                          <button 
                            onClick={retryContestFetch}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            Retry
                          </button>

                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                      
                      {/* Add significant bottom margin to prevent footer overlap */}
                      <div className="mb-32">
                        {/* Use the shared ContestSection component for active contests */}
                        {activeContests.length > 0 && (
                          <ContestSection
                            title="Live Duels"
                            type="active"
                            contests={activeContests}
                            loading={loading}
                          />
                        )}

                        {/* Use the shared ContestSection component for upcoming contests */}
                        <ContestSection
                          title="Starting Soon"
                          type="pending"
                          contests={openContests}
                          loading={loading}
                        />

                        {/* No duels available */}
                        {activeContests.length === 0 &&
                          openContests.length === 0 &&
                          !loading && (
                            <div className="text-center py-16">
                              
                              {/* No duels available title */}
                              <h2 className="text-2xl font-bold mb-4 font-cyber tracking-wide bg-gradient-to-r from-brand-400 to-purple-500 text-transparent bg-clip-text">
                                No Duels Available
                              </h2>
                              
                              {/* Check back soon message */}
                              <p className="text-gray-400 mb-8">
                                Check back soon for new Duels.
                              </p>

                              {/* Create a Duel button */}
                              <Link
                                to="/contests/create"
                                className="inline-block px-8 py-3 rounded-md bg-gradient-to-r from-brand-400 to-brand-600 text-white font-bold hover:from-brand-500 hover:to-brand-700 transition-all"
                              >
                                Create a Duel
                              </Link>

                            </div>
                          )}
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
};