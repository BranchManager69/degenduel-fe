// src/pages/LandingPage.tsx

/**
 * This is the landing page for the DegenDuel website.
 * It displays an enhanced background with particle effects,
 * animated title, features, and contests.
 */

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, Link as RouterLink } from "react-router-dom";

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle";
// Import WebSocketMonitor conditionally only for admins
// Features import removed and controlled by feature flag
import { FEATURE_FLAGS } from "../../../config/config";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency, isContestLive } from "../../../lib/utils";
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

  // useEffect for the animation phases
  useEffect(() => {
    // Animation phases for the title
    const phaseOneTimer = setTimeout(() => {
      setAnimationPhase(1); // Initial reveal
    }, 1000);

    const phaseTwoTimer = setTimeout(() => {
      setAnimationPhase(2); // Full animation
    }, 2000);

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
              {/* WebSocket Monitor for debugging - only shown to admins */}
              {debugMode && isAdmin() && (
                <div className="w-full mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-brand-400">WebSocket Connection Monitor</h2>
                    <button 
                      onClick={() => setDebugMode(false)} 
                      className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                    >
                      Hide Monitor
                    </button>
                  </div>
                  {/* Import WebSocketMonitor dynamically only when needed and user is admin */}
                  <React.Suspense fallback={<div>Loading monitor...</div>}>
                    {(() => {
                      const WebSocketMonitor = React.lazy(() => import("../../../components/debug/websocket/WebSocketMonitor"));
                      return <WebSocketMonitor />;
                    })()}
                  </React.Suspense>
                </div>
              )}
              
              {/* Admin-only button to show WebSocket Monitor - with improved visibility */}
              {!debugMode && isAdmin() && (
                <button
                  onClick={() => setDebugMode(true)}
                  className="mb-4 px-4 py-2 bg-brand-600 text-white rounded font-medium hover:bg-brand-500 transition-colors shadow-md"
                >
                  Show WebSocket Monitor
                </button>
              )}
              
              {/* HeroTitle component solely for hero animation */}
              <div className="w-full h-[40vh] relative overflow-visible z-10">
                <HeroTitle 
                  onComplete={() => {}} 
                  debugMode={debugMode}
                  setDebugMode={setDebugMode}
                />
              </div>

              {/* Spacer to push content below the hero animation - reduced since we have proper relative positioning now */}
              <div className="h-[10vh] min-h-[50px] w-full mb-4"></div>

              {/* Original animated logo (commented out but preserved) */}
              {/*
              <div className="flex items-center justify-center space-x-4 mb-8">
                <motion.h1
                  className="text-5xl sm:text-6xl font-black tracking-tighter whitespace-nowrap"
                  initial={{ opacity: 0, y: -50 }}
                  animate={{
                    opacity: animationPhase > 0 ? 1 : 0,
                    y: animationPhase > 0 ? 0 : -50,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    },
                  }}
                >
                  <motion.span
                    className="relative inline-block"
                    animate={{
                      scale: [1, 1.05, 1],
                      transition: {
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                      },
                    }}
                  >
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                      DEGEN
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 blur-lg -z-10"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.1, 1],
                        transition: {
                          repeat: Infinity,
                          duration: 3,
                        },
                      }}
                    />
                  </motion.span>

                  <motion.span
                    className="relative inline-block mx-4 text-cyan-400 transform -skew-x-12"
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                    }}
                    initial={{ rotate: 0, scale: 0 }}
                    animate={{
                      rotate: animationPhase > 1 ? [0, 360] : 0,
                      scale: animationPhase > 0 ? 1 : 0,
                      transition: {
                        rotate: {
                          repeat: Infinity,
                          duration: 6,
                          ease: "linear",
                        },
                        scale: {
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        },
                      },
                    }}
                  >
                    ×
                  </motion.span>

                  <motion.span
                    className="relative inline-block"
                    animate={{
                      scale: [1, 1.05, 1],
                      transition: {
                        repeat: Infinity,
                        duration: 4,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                        delay: 0.5,
                      },
                    }}
                  >
                    <span className="relative z-10 text-gray-400">DUEL</span>
                  </motion.span>
                </motion.h1>
              </div>
              */}

              {/* Enhanced tagline with dynamic animation */}
              <motion.div
                className="relative overflow-hidden mb-6"
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
                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600">
                  High-Stakes Trading Competitions on Solana
                </h2>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                  animate={{
                    x: ["100%", "-100%"],
                    transition: {
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                      repeatDelay: 1,
                    },
                  }}
                />
              </motion.div>

              {/* Call to action buttons */}
              <motion.div
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6"
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

                <RouterLink to="/how-it-works" className="w-full sm:w-auto">
                  <button className="w-full relative group overflow-hidden">
                    <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm border border-brand-400/20 px-8 py-4 transition-all duration-300 hover:bg-dark-200/60">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                        <span className="text-brand-400 group-hover:text-brand-300">
                          HOW TO PLAY
                        </span>
                        <svg
                          className="w-6 h-6 text-brand-400 group-hover:text-brand-300 transform group-hover:translate-x-1 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                </RouterLink>
              </motion.div>
            </div>
          </div>
        </div>

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
                  {activeContests.length > 0 && (
                    <section className="relative py-12">
                      <h2 className="text-2xl font-bold mb-8 font-cyber tracking-wide bg-gradient-to-r from-brand-400 to-purple-500 text-transparent bg-clip-text">
                        Live Duels
                      </h2>
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-48 rounded animate-pulse bg-dark-300/20"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activeContests.map((contest) => (
                            <div key={contest.id} className="relative">
                              <Link
                                to={`/contests/${contest.id}`}
                                className="block"
                              >
                                <div className="bg-dark-200/80 backdrop-blur-sm border border-dark-300 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10 rounded-lg p-6">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <h3 className="text-2xl font-bold text-gray-100 truncate pr-2 hover:text-brand-400 transition-colors">
                                        {contest.name}
                                      </h3>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/20 animate-cyber-pulse">
                                      Live
                                    </span>
                                  </div>
                                  <div className="mt-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="text-sm text-gray-400">
                                          Prize Pool
                                        </span>
                                        <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text">
                                          {formatCurrency(contest.prize_pool)}
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-sm text-gray-400">
                                          Entry Fee
                                        </span>
                                        <div className="text-2xl font-bold text-gray-200">
                                          {formatCurrency(contest.entry_fee)}
                                        </div>
                                      </div>
                                    </div>
                                    <button className="w-full mt-4 py-3 rounded-md bg-gradient-to-r from-brand-400 to-brand-600 text-white font-bold hover:from-brand-500 hover:to-brand-700 transition-all">
                                      Spectate Duel
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {openContests.length > 0 && (
                    <section className="relative py-12">
                      <h2 className="text-2xl font-bold mb-8 font-cyber tracking-wide bg-gradient-to-r from-green-400 to-brand-500 text-transparent bg-clip-text">
                        Starting Soon
                      </h2>
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-48 rounded animate-pulse bg-dark-300/20"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {openContests.map((contest) => (
                            <div key={contest.id} className="relative">
                              <Link
                                to={`/contests/${contest.id}`}
                                className="block"
                              >
                                <div className="bg-dark-200/80 backdrop-blur-sm border border-dark-300 hover:border-brand-400/20 hover:shadow-2xl hover:shadow-brand-500/10 rounded-lg p-6">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                      <h3 className="text-2xl font-bold text-gray-100 truncate pr-2 hover:text-brand-400 transition-colors">
                                        {contest.name}
                                      </h3>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                      Upcoming
                                    </span>
                                  </div>
                                  <div className="mt-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="text-sm text-gray-400">
                                          Prize Pool
                                        </span>
                                        <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-transparent bg-clip-text">
                                          {formatCurrency(contest.prize_pool)}
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-sm text-gray-400">
                                          Entry Fee
                                        </span>
                                        <div className="text-2xl font-bold text-gray-200">
                                          {formatCurrency(contest.entry_fee)}
                                        </div>
                                      </div>
                                    </div>
                                    <button className="w-full mt-4 py-3 rounded-md bg-gradient-to-r from-green-400 to-brand-400 text-white font-bold hover:from-green-500 hover:to-brand-500 transition-all">
                                      Enter Duel
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

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
      </section>
    </div>
  );
};
