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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
// Framer Motion
import { motion } from "framer-motion";
// Landing page
import { AuthDebugPanel } from "../../../components/debug";
import { ContestSection } from "../../../components/landing/contests-preview/ContestSection";
import { CtaSection } from "../../../components/landing/cta-section/CtaSection";
import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle";
import { FEATURE_FLAGS } from "../../../config/config";
import { isContestLive } from "../../../lib/utils";
import { Contest } from "../../../types";
// Didi AI Terminal and Decryption Timer
import { DecryptionTimer, Terminal } from '../../../components/terminal';
// Hooks
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useSystemSettings } from "../../../hooks/websocket/topic-hooks/useSystemSettings";
import { useTerminalData } from "../../../hooks/websocket/topic-hooks/useTerminalData";
// DD API
import { ddApi } from "../../../services/dd-api";
// Date Utilities
import { getTimeRemainingUntilRelease, isReleaseTimePassed } from '../../../utils/dateUtils';
// Release Date Service
import {
  CountdownResponse,
  FALLBACK_RELEASE_DATE,
  fetchCountdownData,
  formatReleaseDate,
} from '../../../services/releaseDateService';
// Import PaginatedResponse from types
import { PaginatedResponse } from '../../../types';
// Zustand store
import { useStore } from "../../../store/useStore"; // Ensure useStore is imported

// Config
import { config as globalConfig } from '../../../config/config';

// Landing Page
export const LandingPage: React.FC = () => {
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Decryption Timer -- Contract address reveal countdown
  const [contractAddress, setContractAddress] = useState<string>('');
  const [targetReleaseDate, setTargetReleaseDate] = useState<Date | null>(null);
  const [countdownDetails, setCountdownDetails] = useState<CountdownResponse | null>(null);
  const [apiTokenAddress, setApiTokenAddress] = useState<string | null>(null);
  const [isLoadingCountdown, setIsLoadingCountdown] = useState<boolean>(true);
  const [showContractReveal, setShowContractReveal] = useState<boolean>(false);
  const [showPumpFunButton, setShowPumpFunButton] = useState<boolean>(false);
  const countdownCheckerRef = useRef<number | null>(null);
  const isMounted = useRef(true); // Add a ref to track mounted state
  
  // Debug state for contests section
  const [contestDebugInfo, setContestDebugInfo] = useState<{
    lastFetchAttempt: string;
    errorDetails: string | null;
    contestApiResponse: string | null;
  }>({
    lastFetchAttempt: '',
    errorDetails: null,
    contestApiResponse: null
  });
  
  // Fetch countdown data from backend when component mounts
  useEffect(() => {
    const loadCountdownDetails = async () => {
      setIsLoadingCountdown(true);
      try {
        const data = await fetchCountdownData();
        setCountdownDetails(data);
        setApiTokenAddress(data.token_address || null);

        if (data.enabled && data.end_time) {
          const newReleaseDate = new Date(data.end_time);
          if (!isNaN(newReleaseDate.getTime())) {
            setTargetReleaseDate(newReleaseDate);
            console.log(`[LandingPage] Countdown active. Target: ${formatReleaseDate(newReleaseDate)}. Message: ${data.message}`);
          } else {
            console.warn("[LandingPage] Invalid end_time from countdown API, using fallback logic.");
            setTargetReleaseDate(FALLBACK_RELEASE_DATE); // Or null to show no countdown
          }
        } else {
          console.log("[LandingPage] Countdown not enabled by API or no end_time.");
          setTargetReleaseDate(null); // No active countdown
        }
      } catch (error) {
        console.error('[LandingPage] Error loading countdown details:', error);
        setTargetReleaseDate(FALLBACK_RELEASE_DATE); // Fallback on error
        setCountdownDetails({ enabled: false, title: "Countdown Error", message: "Could not load details." });
      } finally {
        setIsLoadingCountdown(false);
      }
    };
    loadCountdownDetails();
  }, []);
  
  // Get contract address from WebSocket-based Terminal data
  const { 
    contractAddress: websocketContractAddress, 
    contractAddressRevealed: websocketContractRevealed,
    isConnected: terminalConnected
  } = useTerminalData();
  
  // Update contract address when WebSocket provides it
  useEffect(() => {
    if (terminalConnected) {
      if (websocketContractAddress) {
        console.log(`[LandingPage] WebSocket contract address update received: ${websocketContractAddress}`);
        
        // Update contract address state
        setContractAddress(websocketContractAddress);
        
        // When a valid contract address is received, set reveal flag to true
        if (!showContractReveal && websocketContractRevealed) {
          console.log('[LandingPage] Contract address revealed via WebSocket');
          setShowContractReveal(true);
        }
      }
    }
  }, [terminalConnected, websocketContractAddress, websocketContractRevealed, showContractReveal]);
  
  // Fallback check for release time and handling completion/redirect
  useEffect(() => {
    if (websocketContractAddress) return; // WS has priority for reveal
    if (isLoadingCountdown || !countdownDetails) return; // Wait for countdownDetails

    if (!countdownDetails.enabled || !targetReleaseDate) {
      setShowContractReveal(false); // If countdown is not enabled, don't proceed to reveal via timer
      setShowPumpFunButton(false); // Also don't show button
      if (countdownCheckerRef.current) clearTimeout(countdownCheckerRef.current);
      return;
    }

    // Check if the release time has passed
    if (isReleaseTimePassed(targetReleaseDate)) {
      console.log(`[LandingPage] Target release time passed: ${formatReleaseDate(targetReleaseDate)}`);
      setShowContractReveal(true);
      setShowPumpFunButton(true); // Show the button instead of auto-redirecting
    } else {
      const timeUntilRelease = getTimeRemainingUntilRelease(targetReleaseDate);
      countdownCheckerRef.current = window.setTimeout(() => {
        console.log('[LandingPage] Countdown timer complete.');
        setShowContractReveal(true);
        setShowPumpFunButton(true); // Show the button instead of auto-redirecting
      }, timeUntilRelease + 100);
    }
    return () => { if (countdownCheckerRef.current) clearTimeout(countdownCheckerRef.current); };
  }, [targetReleaseDate, isLoadingCountdown, countdownDetails, websocketContractAddress]);

  // Terminal configuration
  const terminalConfig = {
    CONTRACT_ADDRESS: websocketContractAddress || (showContractReveal ? globalConfig.CONTRACT_ADDRESS.REAL : contractAddress),
    RELEASE_DATE: targetReleaseDate || globalConfig.RELEASE_DATE.TOKEN_LAUNCH_DATETIME, 
    DISPLAY: { // Corrected mapping
      DATE_SHORT: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_SHORT,
      DATE_FULL: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_DATE_FULL,
      TIME: globalConfig.RELEASE_DATE.DISPLAY.LAUNCH_TIME,
    }
  };
  
  // Debug log for release date sources
  useEffect(() => {
    console.log('[LandingPage] Release date sources:', {
      targetReleaseDate,
      targetReleaseDateToISOString: targetReleaseDate?.toISOString(),
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
  }, [targetReleaseDate, terminalConfig]);
  
  // Use auth hook for proper admin status checks
  const { user, isAdmin } = useMigratedAuth();
  
  // Use WebSocket hook for system settings (including maintenance mode)
  const { 
    settings, // Destructure the settings object
    isConnected: systemSettingsConnected,
    error: systemSettingsError // Capture error from system settings hook
  } = useSystemSettings();
  
  // Derived maintenance state from settings hook
  const isMaintenanceModeActive = settings?.maintenanceMode || false;
  const maintenanceMessageToDisplay = settings?.maintenanceMessage || "DegenDuel is in Maintenance Mode. Please try again later.";

  // Update local and store maintenance mode when WebSocket provides updates
  useEffect(() => {
    if (systemSettingsConnected) {
      console.log(`[LandingPage] System settings received: Maintenance: ${isMaintenanceModeActive}`);
      
      if (isMounted.current) { // Check if component is still mounted
        if (useStore.getState().setMaintenanceMode) {
          useStore.getState().setMaintenanceMode(isMaintenanceModeActive);
        }
        
        if (isMaintenanceModeActive) {
          const message = maintenanceMessageToDisplay || "DegenDuel is in Maintenance Mode. Please try again later.";
          setError(message);
        } else if (error && error.includes("Maintenance Mode")) {
          setError(null);
        }
      }
    }
  }, [systemSettingsConnected, settings, setError, isMaintenanceModeActive, maintenanceMessageToDisplay, error]); // Added dependencies from inside the effect

  // Add cleanup function for the mounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Log system settings errors
  useEffect(() => {
    if (systemSettingsError) {
        console.warn("[LandingPage] System Settings WebSocket error:", systemSettingsError);
    }
  }, [systemSettingsError]);
  
  // Log user status for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[LandingPage] User permissions:', { 
        loggedIn: !!user,
        isAdmin: isAdmin,
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
    
    // Use derived isMaintenanceModeActive from settings hook
    if (isMaintenanceModeActive) {
      console.log("[LandingPage] Maintenance mode active, contest fetch aborted by retryContestFetch.");
      setLoading(false);
      return;
    }
    
    try {
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
      
      // Update the Zustand store with all contests for caching
      useStore.getState().setContests(contestsArray);
      
      // Set active ('live') contests in local state
      setActiveContests(contestsArray.filter(isContestLive));
      
      // Set open ('pending' / 'upcoming') contests in local state
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
      
      if (!(err instanceof Error && err.message.includes("503"))) { // 503 might be maintenance from API layer
         setError(`Failed to load contests: ${err instanceof Error ? err.message : String(err)}`);
      } else {
        // Do not set the error message if it's a maintenance message (handled above)
        //setError(maintenanceMessageToDisplay);
      }
    } finally {
      setLoading(false);
    }
  }, [isMaintenanceModeActive, maintenanceMessageToDisplay]);

  // Define animation variants for Framer Motion
  const landingPageVariants = {
    // Define variants for hidden state
    hidden: { opacity: 0 },
    
    // Define variants for visible state
    visible: {
      opacity: 1,
      transition: {
        // When parent becomes visible, stagger children animations
        staggerChildren: 0.3,
        // Delay before starting children animations
        delayChildren: FEATURE_FLAGS.SHOW_HERO_TITLE ? 0.8 : 0.2,
        // Transition duration for the parent itself
        duration: 0.5
      }
    }
  };
  
  // Define variants for children elements
  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 80,
        duration: 0.7
      }
    }
  };
  
  // Secondary content variants (appears later)
  const secondaryVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 50,
        duration: 0.8,
        delay: 0.4
      }
    }
  };
  
  // Define whether animation is done (for use in JSX)
  const animationDone = useStore.getState().landingPageAnimationDone;
  
  // Check if the animation has already run in this session
  useEffect(() => {
    const animationDone = useStore.getState().landingPageAnimationDone;
    
    if (animationDone) {
      // Skip animation, set final phase immediately
      setAnimationPhase(2);
    } else {
      // Set up a single timer to mark animation as completed
      const animationCompleteTimer = setTimeout(() => {
        // Set the flag in the store after a delay matching our staggered animation duration
        useStore.getState().setLandingPageAnimationDone(true);
        setAnimationPhase(2);
      }, FEATURE_FLAGS.SHOW_HERO_TITLE ? 2400 : 1200);
      
      // Initial animation phase
      setAnimationPhase(1);
      
      // Return cleanup function
      return () => {
        clearTimeout(animationCompleteTimer);
      };
    }
  }, []); // Run only on initial mount

  // Separate useEffect for contest fetch and maintenance status via WebSocket (runs regardless of animation skip)
  useEffect(() => {
    // Check for cached contests in Zustand store first
    const cachedContests = useStore.getState().contests;
    
    if (cachedContests && cachedContests.length > 0) {
      // Log that we're using cached data
      console.log('[LandingPage] Using cached contests data:', {
        count: cachedContests.length,
        cachedAt: new Date().toISOString()
      });
      
      // Filter active and pending contests from cache
      const cachedActive = cachedContests.filter(isContestLive);
      const cachedPending = cachedContests.filter(
        (contest: Contest) => contest.status === "pending"
      );
      
      // Use cached data immediately
      setActiveContests(cachedActive);
      setOpenContests(cachedPending);
      
      // Update loading state
      setLoading(false);
      
      // Fetch fresh data in the background after a delay
      setTimeout(() => {
        retryContestFetch().then(() => {
          console.log('[LandingPage] Background refresh of contests completed');
        });
      }, 2000); // 2 second delay before background refresh
    } else {
      // No cached data available, perform normal fetch
      const fetchContests = async () => {
        await retryContestFetch();
      };
      fetchContests();
    }
  }, [retryContestFetch]); // Depend on retryContestFetch

  // Landing Page JSX
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">

      {/* Landing Page Content Section */}
      <section className="relative flex-1 pb-20" style={{ zIndex: 10 }}>
        
        {/* Landing Page Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Landing Page Content */}
          <div className="text-center space-y-4">
            
            {/* Title Section */}
            <div className="flex flex-col items-center justify-center">
              

              {/* (does this ALL exist within the Title Section!? ) */}


              {/* Admin debug button - visible even when HeroTitle is hidden */}
              {isAdmin && (
                <div className="flex justify-end mb-2">
                  {/* Debug button - visible even when HeroTitle is hidden */}
                  <button
                    className="bg-black/50 text-white text-xs p-1 rounded-md"
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    {debugMode ? "🛠️" : "🐛"}
                  </button>
                </div>
              )}
              
              {/* WebSocket Demo Section - only visible to admins with debug mode enabled */}
              {debugMode && isAdmin && (
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
                  {/* HeroTitle component with better Terminal coordination - conditionally rendered based on feature flag */}
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
                  <div className="h-[8vh] min-h-[40px] w-full">
                  </div>
                </>
              )}
              
              {/* Main content container using variants */}
              <motion.div 
                className="landing-content"
                initial={animationDone ? "visible" : "hidden"}
                animate="visible"
                variants={landingPageVariants}
              >
              
              {/* Common tagline for all users */}
              <motion.div
                className="mt-8 mb-6"
                variants={childVariants}
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

              {/* Call to action buttons - Now using the CtaSection component */}
              <CtaSection user={user} animationPhase={animationPhase} />

              {/* Countdown Timer Component - uses new state */}
              <motion.div className="w-full max-w-lg mx-auto mb-8 relative z-20" /* variants={childVariants} */ >
                {isLoadingCountdown ? (
                  <div>Loading countdown...</div>
                ) : countdownDetails?.enabled && targetReleaseDate ? (
                  <>
                    {countdownDetails.title && <h2 className="text-3xl font-bold text-purple-300 mb-2">{countdownDetails.title}</h2>}
                    {countdownDetails.message && <p className="text-lg text-gray-300 mb-4">{countdownDetails.message}</p>}
                    <DecryptionTimer
                      targetDate={targetReleaseDate} // Pass the Date object
                      contractAddress={websocketContractAddress || contractAddress} // Pass current contractAddress state
                      // onComplete is now handled by setting showPumpFunButton
                    />
                    {/* Button to link to pump.fun - NOW WITH APLOMB! */}
                    {showPumpFunButton && websocketContractAddress && (
                      <motion.button
                        initial={{ opacity: 0, y: 40, scale: 0.7 }}
                        animate={{ 
                          opacity: [0, 1, 0.6, 1], // Opacity stutters for a digital feel
                          y: 0, 
                          scale: 1 
                        }}
                        transition={{
                          delay: 0.3,
                          y: { type: "spring", stiffness: 180, damping: 15 },
                          scale: { type: "spring", stiffness: 180, damping: 15 },
                          opacity: { duration: 0.5, ease: "easeOut", times: [0, 0.25, 0.5, 1] } // Controls the stutter timing
                        }}
                        onClick={() => {
                          const contractToUse = apiTokenAddress || websocketContractAddress; // Prioritize API, fallback to WS
                          if (contractToUse) {
                            const pumpFunUrl = `https://pump.fun/coin/${contractToUse}`;
                            console.log("[LandingPage] Pump.fun button clicked. Opening with contract:", contractToUse, "URL:", pumpFunUrl);
                            window.open(pumpFunUrl, '_blank');
                          } else {
                            console.error("[LandingPage] Pump.fun button clicked, but no contract address is available.");
                          }
                        }}
                        className="mt-8 p-0 bg-gradient-to-r from-pink-500 via-purple-600 to-brand-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 inline-flex items-center justify-center aspect-square w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28" // Adjusted for image, made square
                        aria-label="View on Pump.fun"
                      >
                        <img 
                          src="/assets/media/logos/pump.png" 
                          alt="View on Pump.fun" 
                          className="h-10 w-auto sm:h-12 md:h-14 object-contain" // Control image size within button
                        />
                      </motion.button>
                    )}
                  </>
                ) : (
                  // Optional: Message if countdown is not enabled or date is not set
                  <div className="text-xl text-gray-500 py-8">{(countdownDetails && !countdownDetails.enabled) ? (countdownDetails.message || "Launch details coming soon!") : "Loading launch details..."}</div>
                )}
              </motion.div>

              {/* Platform Features Section */}
              <motion.div
                className="text-center mb-10"
                variants={childVariants}
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
                variants={childVariants}
                onAnimationComplete={() => {
                  console.log('Terminal animation completed');
                }}
              >
                {isLoadingCountdown ? (
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
                variants={secondaryVariants}
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
                variants={secondaryVariants}
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
                variants={secondaryVariants}
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
                variants={secondaryVariants}
              >
                {/* Maintenance mode */}
                {isMaintenanceModeActive ? (
                  <div className="relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                      <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-yellow-400">
                          <span className="animate-pulse">⚠</span>
                          
                          {/* Maintenance mode message */}
                          <span>
                            {maintenanceMessageToDisplay}
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
                          {isAdmin && (
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
              
              </motion.div> {/* Close the main landing-content container with variants */}

            </div>


            {/* Test moving the non-header content HERE */}


          </div>

        </div>

      </section>

    </div>
  );
};