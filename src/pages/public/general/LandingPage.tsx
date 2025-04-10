// src/pages/LandingPage.tsx

/**
 * This is the landing page for the DegenDuel website.
 * It displays an enhanced background with particle effects,
 * animated title, features, and contests.
 */

import { motion } from "framer-motion";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, Link as RouterLink } from "react-router-dom";
// Import the Terminal component
import { Terminal } from '../../../components/terminal';
// CSS is now loaded from public/assets/degen-components.css via index.html
// import { processTerminalChat } from '../../../services/mockTerminalService';
import { 
  fetchContractAddress, 
  isReleaseTimePassed, 
  setContractAddressPublic,
  getTimeRemainingUntilRelease,
  CONTRACT_POLL_INTERVAL 
} from '../../../services/contractAddressService';
import {
  fetchReleaseDate,
  formatReleaseDate,
  FALLBACK_RELEASE_DATE
} from '../../../services/releaseDateService';
import { config as globalConfig } from '../../../config/config';

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle";
// Import WebSocketMonitor conditionally only for admins
// Features import removed and controlled by feature flag
import { FEATURE_FLAGS } from "../../../config/config";
import { useAuth } from "../../../hooks/useAuth";
import { isContestLive } from "../../../lib/utils";
import { ContestSection } from "../../../components/landing/contests-preview/ContestSection";
import { ddApi } from "../../../services/dd-api";
import { Contest } from "../../../types";

// TODO: move to separate file
interface ContestResponse {
  contests: Contest[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Landing Page Component
export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // For contract address polling and management
  const [contractAddress, setContractAddress] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<Date>(FALLBACK_RELEASE_DATE);
  const [isLoadingReleaseDate, setIsLoadingReleaseDate] = useState<boolean>(true);
  const [showContractReveal, setShowContractReveal] = useState<boolean>(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const countdownCheckerRef = useRef<number | null>(null);
  const countdownEndedRef = useRef<boolean>(false);
  
  // Fetch release date from backend when component mounts
  useEffect(() => {
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
  
  // Start contract address polling (after countdown ends)
  const startAddressPolling = useCallback(() => {
    console.log('Starting contract address polling');
    countdownEndedRef.current = true;
    
    // For demo purposes, make the contract address public after countdown ends
    // In production, your backend would determine this
    setContractAddressPublic(true);
    
    // Trigger immediate fetch
    fetchContractAddress().then(address => {
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
    
    // Clean up on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (countdownCheckerRef.current) {
        clearTimeout(countdownCheckerRef.current);
      }
    };
  }, [releaseDate, startAddressPolling, isLoadingReleaseDate]);

  // Terminal configuration
  const terminalConfig = {
    // Contract address for display in Terminal
    CONTRACT_ADDRESS: showContractReveal ? globalConfig.CONTRACT_ADDRESS.REAL : contractAddress, // Use global config or fallback to polled address
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
  
  // Shared debug mode state - controls both HeroTitle debug panel and WebSocketMonitor visibility
  const [debugMode, setDebugMode] = useState(false);

  // useEffect for the animation phases with better HeroTitle/Terminal coordination
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
      try {
        // First check maintenance mode
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode(); // TODO: improve MM checks via WSS
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch contests
        if (isInMaintenance) {
          setError("DegenDuel is in Maintenance Mode. Please try again later.");
          setLoading(false);
          return;
        }

        const response = await ddApi.contests.getAll();
        const contestsArray: Contest[] = Array.isArray(response)
          ? response
          : (response as ContestResponse).contests;

        // Set active ('live') contests
        setActiveContests(contestsArray.filter(isContestLive));

        // Set open ('pending' / 'upcoming') contests
        setOpenContests(
          contestsArray.filter(
            (contest: Contest) => contest.status === "pending",
          ),
        );
      } catch (err) {
        console.error(`Failed to load contests: ${err}`);
        if (err instanceof Error && err.message.includes("503")) {
          // TODO: improve MM checks via WSS
          setIsMaintenanceMode(true);
          setError("DegenDuel is in Maintenance Mode. Please try again later.");
        } else {
          setError("Failed to load contests");
        }
      } finally {
        setLoading(false);
      }
    };
    // Fetch contests since we're not in maintenance mode
    fetchContests();

    // Poll maintenance status every n seconds
    const MM_POLL_INTERVAL = 30; // in seconds
    // TODO: improve MM checks via WSS
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
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* 3D Background Scene */}
      <BackgroundEffects />

      {/* Content Section */}
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
              
              {/* WebSocket Demo Section - only visible in debug mode */}
              {debugMode && isAdmin() && (
                <div className="w-full mb-10">
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
              
              {/* Terminal Component - Animation adjusted based on HeroTitle presence */}
              <motion.div
                className="w-full max-w-4xl mx-auto mb-10 relative z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: animationPhase > 0 ? 1 : 0,
                  y: animationPhase > 0 ? 0 : 20,
                  transition: {
                    // When HeroTitle is hidden, start Terminal animation immediately
                    delay: FEATURE_FLAGS.SHOW_HERO_TITLE ? 0.3 : 0.1,
                    duration: 0.8,
                  },
                }}
                onAnimationComplete={() => {
                  // When terminal animation completes, it signals completion
                  console.log('Terminal animation completed');
                }}
              >
                {isLoadingReleaseDate ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-xl font-orbitron text-brand-400">Loading countdown timer...</p>
                    </div>
                  </div>
                ) : (
                  <Terminal 
                    config={terminalConfig} 
                    onCommandExecuted={(command, response) => {
                      console.log('Command executed:', command, 'Response:', response);
                    }}
                  />
                )}
              </motion.div>

              {/* Only show content below this point when user is logged in */}
              {user && (
                <>
                  {/* Enhanced tagline with properly masked shine effect - increased top margin */}
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

                  {/* Call to action buttons */}
                  <motion.div
                    className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-0 max-w-full"
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
                    {/* HOW TO PLAY button first */}
                    <RouterLink to="/how-it-works" className="w-full sm:w-auto">
                      <button className="w-full relative group overflow-hidden">
                        <div className="relative clip-edges bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500">
                          <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                              <span className="bg-gradient-to-r from-blue-300 to-cyan-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-blue-200">
                                HOW TO PLAY
                              </span>
                              <svg
                                className="w-6 h-6 text-blue-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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

                    {/* START DUELING button second */}
                    <RouterLink to="/contests" className="w-full sm:w-auto">
                      <button className="w-full relative group overflow-hidden">
                        <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500">
                          <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                              <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                                START DUELING
                              </span>
                              <svg
                                className="w-6 h-6 text-emerald-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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
                  </motion.div>
                  
                  {/* Market Overview Panel */}
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
                    {(() => {
                      // Lazy-load the MarketStatsPanel component
                      const MarketStatsPanel = React.lazy(() => 
                        import("../../../components/landing/market-stats").then(module => ({ 
                          default: module.MarketStatsPanel 
                        }))
                      );
                      
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
                  
                  {/* Elite Hot Tokens List */}
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
                      // Lazy-load the HotTokensList component
                      const HotTokensList = React.lazy(() => 
                        import("../../../components/landing/hot-tokens").then(module => ({ 
                          default: module.HotTokensList 
                        }))
                      );
                      
                      return (
                        <React.Suspense 
                          fallback={
                            <div className="py-10 flex justify-center">
                              <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          }
                        >
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <HotTokensList maxTokens={5} />
                          </div>
                        </React.Suspense>
                      );
                    })()}
                  </motion.div>
                  
                  {/* Top Tokens Display */}
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
                      
                      return (
                        <React.Suspense 
                          fallback={
                            <div className="py-10 flex justify-center">
                              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          }
                        >
                          <TokensPreviewSection maxTokens={6} />
                        </React.Suspense>
                      );
                    })()}
                  </motion.div>
                  
                  {/* Enhanced Features section - conditionally rendered based on feature flag */}
                  {FEATURE_FLAGS.SHOW_FEATURES_SECTION && (
                    <motion.div
                      className="relative"
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
                        {/* This prevents the component from being bundled and loaded when disabled */}
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

                  {/* Contest sections */}
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
                    {isMaintenanceMode ? (
                      <div className="relative">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                          <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                            <div className="flex items-center justify-center gap-2 text-yellow-400">
                              <span className="animate-pulse">⚠</span>
                              <span>
                                DegenDuel is in Maintenance Mode. Please try again later.
                              </span>
                              <span className="animate-pulse">⚙️</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="relative">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <div className="text-center p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg">
                            <div className="text-red-500 animate-glitch">{error}</div>
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

                            {activeContests.length === 0 &&
                              openContests.length === 0 &&
                              !loading && (
                                <div className="text-center py-16">
                                  <h2 className="text-2xl font-bold mb-4 font-cyber tracking-wide bg-gradient-to-r from-brand-400 to-purple-500 text-transparent bg-clip-text">
                                    No Duels Available
                                  </h2>
                                  <p className="text-gray-400 mb-8">
                                    Check back soon for new Duels.
                                  </p>
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
                </>
              )}
              
              {/* When user is not logged in, show a message beneath the terminal */}
              {!user && (
                <div className="mt-8 mb-32 text-center p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-0 max-w-full"
                  >
                    <RouterLink to="/login" className="w-full sm:w-auto">
                      <button className="w-full relative group overflow-hidden">
                        <div className="relative clip-edges bg-gradient-to-r from-brand-500 to-brand-600 p-[1px] transition-all duration-300 group-hover:from-brand-400 group-hover:to-brand-500">
                          <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                              <span className="bg-gradient-to-r from-brand-300 to-brand-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-brand-200">
                                CONNECT WALLET
                              </span>
                              <svg
                                className="w-6 h-6 text-brand-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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
                  </motion.div>
                  
                  {/* Market Overview Panel for non-logged in users */}
                  <motion.div
                    className="w-full mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: {
                        delay: 0.6,
                        duration: 0.8,
                      },
                    }}
                  >
                    {(() => {
                      // Lazy-load the MarketStatsPanel component
                      const MarketStatsPanel = React.lazy(() => 
                        import("../../../components/landing/market-stats").then(module => ({ 
                          default: module.MarketStatsPanel 
                        }))
                      );
                      
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
                  
                  {/* Elite Hot Tokens List for non-logged in users */}
                  <motion.div
                    className="w-full mt-8 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: {
                        delay: 0.7,
                        duration: 0.8,
                      },
                    }}
                  >
                    {(() => {
                      // Lazy-load the HotTokensList component
                      const HotTokensList = React.lazy(() => 
                        import("../../../components/landing/hot-tokens").then(module => ({ 
                          default: module.HotTokensList 
                        }))
                      );
                      
                      return (
                        <React.Suspense 
                          fallback={
                            <div className="py-10 flex justify-center">
                              <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          }
                        >
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <HotTokensList maxTokens={3} />
                          </div>
                        </React.Suspense>
                      );
                    })()}
                  </motion.div>
                  
                  {/* Top Tokens Display for non-logged in users */}
                  <motion.div
                    className="w-full mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
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
                      
                      return (
                        <React.Suspense 
                          fallback={
                            <div className="py-10 flex justify-center">
                              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                          }
                        >
                          <TokensPreviewSection maxTokens={3} />
                        </React.Suspense>
                      );
                    })()}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};