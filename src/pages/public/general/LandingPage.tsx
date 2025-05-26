// src/pages/LandingPage.tsx

/**
 * Landing Page
 * 
 * @description This is the landing page for the DegenDuel website.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-01-01
 * @updated 2025-05-05
 */

// CSS (now loaded from public/assets/degen-components.css via index.html)
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
// Framer Motion
import { motion } from "framer-motion";
// Landing page
import { AuthDebugPanel } from "../../../components/debug";
import { ContestSection } from "../../../components/landing/contests-preview/ContestSection";
import { CtaSection } from "../../../components/landing/cta-section/CtaSection";
// import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle"; // No longer using HeroTitle
// Import new MarketTickerGrid component (replacing the three token display components)
// import IntroLogo from "../../../components/logo/IntroLogo"; // Original logo (no longer used)
import EnhancedIntroLogo from "../../../components/logo/EnhancedIntroLogo"; // Enhanced, more dramatic logo
import { FEATURE_FLAGS } from "../../../config/config";
import { isContestCurrentlyUnderway } from "../../../lib/utils";
import { Contest } from "../../../types";
// Decryption Timer
import { DecryptionTimer } from '../../../components/layout/DecryptionTimer';
import { MiniDecryptionTimer } from "../../../components/layout/DecryptionTimerMini";
// Hooks
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useLaunchEvent } from "../../../hooks/websocket/topic-hooks/useLaunchEvent";
import { useSystemSettings } from "../../../hooks/websocket/topic-hooks/useSystemSettings";
// DD API
import { ddApi } from "../../../services/dd-api";
// Date Utilities
// Release Date Service
import {
    FALLBACK_RELEASE_DATE
} from '../../../services/releaseDateService';
// Import PaginatedResponse from types
import { PaginatedResponse } from '../../../types';
// Zustand store
import { useStore } from "../../../store/useStore"; // Ensure useStore is imported

// Config
import { config } from "../../../config/config"; // Config

// Enhanced Floating Buttons
import FloatingButtonStack from '../../../components/layout/FloatingButtonStack'; // Enhanced floating button stack

// Contract Address
const FALLBACK_CA_FOR_BUTTONS = config.CONTRACT_ADDRESS.REAL;

// Directly import the Features component
import Features from "../../../components/landing/features-list/Features";

// Landing Page
export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const forceShowFabs = true; // Changed from useState to a const, always true
  
  const isMounted = useRef(true);

  const mainTimerContainerRef = useRef<HTMLDivElement>(null);
  
  // Floating timer coordination
  const [mainTimerFloating, setMainTimerFloating] = useState(false);
  const [showMiniTimer, setShowMiniTimer] = useState(false);

  // Handle scroll-based timer sequence
  const handleMainTimerMorphComplete = useCallback((scrolledDown: boolean) => {
    setShowMiniTimer(scrolledDown); // Show mini timer when scrolled down, hide when scrolled up
  }, []);
  
  // const { trackEvent } = useAnalytics(); // If 'trackEvent' error persists, we may need to review useAnalytics hook
  // const { isMobile, isTablet, isDesktop } = useScreenSize(); // Marked for removal if unused
  
  // Debug state for contests section (keep if used, remove if not)
  const [contestDebugInfo, setContestDebugInfo] = useState<{
    lastFetchAttempt: string;
    errorDetails: string | null;
    contestApiResponse: string | null;
  }>({
    lastFetchAttempt: '',
    errorDetails: null,
    contestApiResponse: null
  });
  
  // Removed console.log referencing deleted state

  // Contract address reveal is handled by dedicated launch event service
  const { contractAddress: websocketContractAddress } = useLaunchEvent();
  const websocketContractRevealed = !!websocketContractAddress; // Contract is revealed if address exists
  
  const { settings } = useSystemSettings(); // Get settings for maintenance mode

  const isMaintenanceModeActive = settings?.maintenance_mode?.enabled || false;
  const maintenanceMessageToDisplay = settings?.maintenance_mode?.message || "Contests are temporarily paused for maintenance. Please check back soon!";
  
  useEffect(() => {
    if (websocketContractAddress && websocketContractRevealed) {
      console.log(`[LandingPage] WebSocket contract address update received: ${websocketContractAddress}, Revealed: ${websocketContractRevealed}`);
    }
  }, [websocketContractAddress, websocketContractRevealed]);
  
  // Removed Fallback check for release time and handling completion/redirect useEffect block
  // Removed Debug log for release date sources useEffect block

  useEffect(() => {
    isMounted.current = true;
    const skipAnimation = new URLSearchParams(window.location.search).has('skip_animation');
    if (skipAnimation) {
      setAnimationPhase(3);
      setAnimationDone(true);
    } else {
      const timer1 = setTimeout(() => isMounted.current && setAnimationPhase(1), 500);
      const timer2 = setTimeout(() => isMounted.current && setAnimationPhase(2), 1500);
      const timer3 = setTimeout(() => {
        if (isMounted.current) {
          setAnimationPhase(3);
          setAnimationDone(true);
          // Start floating timer sequence 2 seconds after main animation is done
          setTimeout(() => {
            if (isMounted.current) {
              setMainTimerFloating(true);
            }
          }, 2000);
        }
      }, 2500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize User and Admin status
  const { user, isAdministrator } = useMigratedAuth();
  
  // Terminal Data - This is the "AI Chat" websocket connection
  // const terminalData = useTerminalData(); // Commented out as it's not used

  // Fetch initial contest data (simplified, retry logic assumed to be in useContests or similar)
  const retryContestFetch = useCallback(async (attempt = 1) => {
    if (!isMounted.current) return;
    try {
      setLoading(true);
      const response = await ddApi.contests.getAll(); 
      const contestsData = (Array.isArray(response) ? response : (response as PaginatedResponse<Contest>)?.data) || [];
      
      if (isMounted.current) {
        const liveContests = contestsData.filter(isContestCurrentlyUnderway);
        const pendingContests = contestsData.filter((contest: Contest) => contest.status === "pending");
        
        setActiveContests(liveContests);
        setOpenContests(pendingContests);
        setError(null);
        
        // Update Zustand store with fetched contests
        useStore.getState().setContests(contestsData);
        
        setContestDebugInfo(prev => ({
          ...prev,
          lastFetchAttempt: new Date().toISOString(),
          contestApiResponse: JSON.stringify(response, null, 2).substring(0, 500) + "...", // Truncate for brevity
        }));
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error("[LandingPage] Failed to load contests data:", err);
        setError("Failed to load contests. Please try again later.");
        setContestDebugInfo(prev => ({
          ...prev,
          lastFetchAttempt: new Date().toISOString(),
          errorDetails: err.message || String(err),
        }));
        
        if (attempt < 3) { // Retry up to 3 times
          console.log(`[LandingPage] Retrying contest fetch, attempt ${attempt + 1}`);
          setTimeout(() => retryContestFetch(attempt + 1), 3000 * attempt); // Exponential backoff
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch initial contest data (simplified, retry logic assumed to be in useContests or similar)
  useEffect(() => {
    const cachedContests = useStore.getState().contests;
    if (cachedContests && cachedContests.length > 0) {
      console.log('[LandingPage] Using cached contests data.');
      const cachedActive = cachedContests.filter(isContestCurrentlyUnderway);
      const cachedPending = cachedContests.filter((contest: Contest) => contest.status === "pending");
      setActiveContests(cachedActive);
      setOpenContests(cachedPending);
      setLoading(false);
      setTimeout(() => retryContestFetch(), 2000);
    } else {
      retryContestFetch();
    }
  }, [retryContestFetch]);

  const fallbackDateForTimers = useMemo(() => new Date(FALLBACK_RELEASE_DATE), []);

  // Define dummy variants to satisfy linter, replace with actual definitions
  const landingPageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const childVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const secondaryVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  // Render section with staggered animation
  // const renderSectionWithStagger = (
  //   index: number,
  //   id: string,
  //   className: string,
  //   children: React.ReactNode
  // ) => (
  //   <motion.div
  //     key={id}
  //     className={`${className} ${id}`}
  //     initial="hidden"
  //     animate="visible"
  //     variants={landingPageVariants}
  //   >
  //     {children}
  //   </motion.div>
  // );

  // Landing Page JSX
  return (
    <>
      {/* <ScrollToTop /> */}
      <div className="flex flex-col min-h-screen relative overflow-x-hidden">

        {/* Landing Page Content Section */}
        <section className="relative flex-1 pb-20" style={{ zIndex: 10 }}>
          
          {/* Landing Page Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
            
            {/* Landing Page Content */}
            <div className="text-center space-y-4">
              
              {/* Title Section - Now featuring IntroLogo */}
              <div className="flex flex-col items-center justify-center mb-8 md:mb-12">
                
                {/* Admin debug button - visible even when HeroTitle is hidden */}
                {isAdministrator && (
                  <div className="flex justify-end mb-2 w-full max-w-4xl">
                    <button
                      className="bg-black/50 text-white text-xs p-1 rounded-md"
                      onClick={() => setDebugMode(!debugMode)}
                    >
                      {debugMode ? "🛠️" : "🐛"}
                    </button>
                  </div>
                )}
                
                {/* Demo Section - only visible to admins with debug mode enabled */}
                {debugMode && isAdministrator && (
                  <div className="w-full mb-10">
                    
                    {/* Auth Debug Panel 1 - shows authentication state for debugging */}
                    <div className="mb-6 bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                      <h4 className="text-xl font-semibold mb-4 text-amber-400">Auth Debug 1</h4>
                      <AuthDebugPanel />
                    </div>
                    
                    {/* Auth Debug Panel 2 - shows authentication state for debugging */}
                    <div className="fixed bottom-0 left-0 right-0 z-[100] p-2 bg-dark-700/80 backdrop-blur-sm">
                      <h4 className="text-xl font-semibold mb-4 text-amber-400">Auth Debug 2</h4>
                      <AuthDebugPanel />
                    </div>

                    {/* Responsive grid layout - one column on mobile, three columns on large screens */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Token Data Demo 
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
                
                {/* Enhanced Hero Section with IntroLogo and animated background */}
                <div className="relative w-full my-4 md:my-8">
                  
                  {/* Visual effects layer - positioned behind content */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    
                    {/* Subtle grid overlay (also sucks...) */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(153, 51, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(153, 51, 255, 0.03) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                      }}
                    />

                    {/* Deep ambient glow spots */}
                    <motion.div
                      className="absolute top-1/4 -left-1/4 w-full h-full rounded-full blur-3xl"
                      style={{
                        background: 'radial-gradient(circle, rgba(153, 51, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'
                      }}
                      animate={{
                        opacity: [0.5, 0.7, 0.5],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "mirror"
                      }}
                    />

                    {/* Elegant data flow lines */}
                    <motion.div
                      className="absolute bottom-1/3 -right-1/4 w-full h-full rounded-full blur-3xl"
                      style={{
                        background: 'radial-gradient(circle, rgba(0, 225, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'
                      }}
                      animate={{
                        opacity: [0.5, 0.7, 0.5],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 18,
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: 3
                      }}
                    />

                    {/* Elegant data flow lines (kind of gay though) */}
                    <div className="absolute inset-0">
                      <motion.div
                        className="h-[0.5px] w-[30%] bg-gradient-to-r from-transparent via-brand-400/15 to-transparent absolute transform -rotate-[30deg]"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        style={{ top: '35%', left: '0%' }}
                      />

                      {/* Another data flow line (again, gay) */}
                      <motion.div
                        className="h-[0.5px] w-[40%] bg-gradient-to-r from-transparent via-cyber-400/10 to-transparent absolute transform rotate-[15deg]"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 3 }}
                        style={{ top: '60%', left: '0%' }}
                      />
                    </div>

                    {/* High-quality particle effect (now this I like) */}
                    <div className="absolute inset-0">
                      {Array(8).fill(null).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                            backgroundColor: i % 2 === 0 ? 'rgba(153, 51, 255, 0.4)' : 'rgba(0, 225, 255, 0.4)',
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            boxShadow: `0 0 4px ${i % 2 === 0 ? 'rgba(153, 51, 255, 0.4)' : 'rgba(0, 225, 255, 0.4)'}`
                          }}
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.2, 1],
                            y: [0, -30, 0]
                          }}
                          transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Enhanced IntroLogo with dramatic animations - Use 'standard' mode when animation already seen */}
                  <div className="relative z-10 flex justify-center items-center">
                    <EnhancedIntroLogo mode={animationPhase >= 3 ? 'standard' : 'epic'} />
                  </div>
                  
                </div>

                {/* Main content container using variants */}
                <motion.div
                  className="landing-content"
                  initial={animationDone ? "visible" : "hidden"}
                  animate="visible"
                  variants={landingPageVariants}
                >


                {/* Countdown Timer Component - uses new state */}
                <motion.div // Keep this motion.div if it was part of the structure, or simplify to a normal div
                  ref={mainTimerContainerRef} 
                  className="my-8 md:my-12 w-full max-w-3xl mx-auto"
                  // Remove variants={childVariants} if this specific div doesn't need it
                  // or ensure childVariants is correctly defined and used if it should animate
                >

                  {/* Decryption Timer */}
                  <DecryptionTimer
                    targetDate={fallbackDateForTimers}
                    enableFloating={mainTimerFloating}
                    onMorphComplete={handleMainTimerMorphComplete}
                  />

                </motion.div>

                {/* Enhanced tagline with secondary line */}
                <motion.div
                  className="mt-8 mb-6"
                  variants={childVariants}
                >

                {/* Tagline with animated gradient */}
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

                  {/* Primary tagline */}
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight px-4">
                    High-Stakes Trading Competitions on Solana
                  </h2>
                </motion.div>

                {/* Secondary tagline */}
                <p className="text-sm sm:text-base text-gray-300/80 font-medium mt-2">
                  Win big. Trade like a degen. No liquidations.
                </p>

                </motion.div>

                {/* CTAs - Now using the CtaSection component */}
                <CtaSection user={user} animationPhase={animationPhase} />

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

                    {/* Features section container */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      {/* Features component is only imported and rendered when the flag is enabled */}
                      {(() => {

                        // Only import and render when the flag is enabled (we already tested this once above)
                        if (FEATURE_FLAGS.SHOW_FEATURES_SECTION) {
                          
                          // Dynamic import only when needed
                          // const Features = React.lazy(  // <-- REMOVE THIS LINE
                          //   () =>                    // <-- REMOVE THIS LINE
                          //     import(                 // <-- REMOVE THIS LINE
                          //       "../../../components/landing/features-list/Features" // <-- REMOVE THIS LINE
                          //     ),                   // <-- REMOVE THIS LINE
                          // );                         // <-- REMOVE THIS LINE
                          return (

                            // Features List (Loading fallback)
                            // <React.Suspense fallback={<div>Loading features...</div>}> // <-- REMOVE THIS LINE
                            <Features />
                            // </React.Suspense> // <-- REMOVE THIS LINE
                            
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                  </motion.div>
                )}
                
                {/* NYSE-Style Market Ticker Grid - Replaces all previous token displays 
                <motion.div
                  className="w-full mt-8 mb-6"
                  variants={secondaryVariants}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <MarketTickerGrid
                      maxTokens={12}
                      title="DegenDuel • Market Data"
                      subtitle="Real-time NYSE-style market feed"
                      reorderInterval={8000}
                      showBillboard={true}
                    />
                  </div>
                </motion.div>
                */}
                
                {/* Contest sections - shown to all users */}
                <motion.div
                  variants={secondaryVariants}
                >
                  {isMaintenanceModeActive ? (
                    <div className="relative">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                          <h3 className="text-2xl font-bold text-yellow-300 mb-2">⚙️ Maintenance Mode ⚙️</h3>
                          <p className="text-yellow-200">
                            {maintenanceMessageToDisplay}
                          </p>
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
                            {isAdministrator && (
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
                              onClick={() => retryContestFetch()}
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
                
                </motion.div> 
                {/* Close the main landing-content container with variants */}

              </div>

            </div>

          </div>

        </section>

        {/* Mini Timer - Appears when scrolled down */}
        {showMiniTimer && (
          <MiniDecryptionTimer
            targetDate={fallbackDateForTimers}
            isVisible={showMiniTimer}
            delayedEntrance={false}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>

      {/* Enhanced Floating Action Buttons Stack */}
      <FloatingButtonStack
        tokenAddress={websocketContractAddress || FALLBACK_CA_FOR_BUTTONS}
        tokenSymbol={"DUEL"}
        enabled={forceShowFabs || (websocketContractRevealed && websocketContractAddress)}
      />
    </>
  );
};

export default LandingPage;