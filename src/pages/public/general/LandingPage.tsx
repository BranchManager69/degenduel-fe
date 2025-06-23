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
import { ContestSection } from "../../../components/landing/contests-preview/ContestSection";
import { EnhancedContestSection } from "../../../components/landing/contests-preview/EnhancedContestSection";
import { CtaSection } from "../../../components/landing/cta-section/CtaSection";
import { TemplateSection, TemplateSection2, TemplateSection3 } from "../../../components/landing/template-section";
// import { HeroTitle } from "../../../components/landing/hero-title/HeroTitle"; // No longer using HeroTitle
// Import new MarketTickerGrid component (replacing the three token display components)
// import IntroLogo from "../../../components/logo/IntroLogo"; // Original logo (no longer used)
import EnhancedIntroLogo from "../../../components/logo/EnhancedIntroLogo"; // Enhanced, more dramatic logo
import { FEATURE_FLAGS } from "../../../config/config";
import { isContestCurrentlyUnderway, isContestJoinable } from "../../../lib/utils";
import { Contest } from "../../../types";
// Hooks
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useSystemSettings } from "../../../hooks/websocket/topic-hooks/useSystemSettings";
// DD API
import { ddApi } from "../../../services/dd-api";
// Date Utilities
// Release Date Service
import {
  FALLBACK_RELEASE_DATE
} from '../../../services/releaseDateService';
// Import PaginatedResponse from types (used for API response typing)
// import type { PaginatedResponse } from '../../../types';
// Zustand store
import { useStore } from "../../../store/useStore"; // Ensure useStore is imported

// Config
import { config } from "../../../config/config"; // Config

// Debug flags for template sections
const SHOW_TEMPLATE_SECTION_1 = false;
const SHOW_TEMPLATE_SECTION_2 = false;
const SHOW_TEMPLATE_SECTION_3 = false;

// Enhanced Floating Buttons
import FloatingButtonStack from '../../../components/layout/FloatingButtonStack'; // Enhanced floating button stack
import FloatingDuelNowButton from '../../../components/layout/FloatingDuelNowButton'; // Floating DUEL NOW button above footer


// Contract Address
const FALLBACK_CA_FOR_BUTTONS = config.CONTRACT_ADDRESS.REAL;

// Lazy load the Features component for better performance
const Features = React.lazy(() => import("../../../components/landing/features-list/Features"));

// NEW: Import WebSocket-based contest hook
import { useContests } from "../../../hooks/websocket/topic-hooks/useContests";

// NOT READY YET:

// Landing Page
export const LandingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const forceShowFabs = true; // Changed from useState to a const, always true
  
  const isMounted = useRef(true);
  const lastRestFetchRef = useRef<Date | null>(null);

  // Countdown completion state
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);

  // Get cached contests immediately for instant display
  const cachedContests = useMemo(() => {
    return useStore.getState().contests || [];
  }, []);
  
  // const { trackEvent } = useAnalytics(); // If 'trackEvent' error persists, we may need to review useAnalytics hook
  // const { isMobile, isTablet, isDesktop } = useScreenSize(); // Marked for removal if unused
  
  // Debug state for contests section (keep if used, remove if not)
  const [contestDebugInfo, setContestDebugInfo] = useState<{
    lastFetchAttempt: string;
    errorDetails: string | null;
    contestApiResponse: string | null;
    wsConnectionStatus: string;
    wsLastUpdate: string | null;
  }>({
    lastFetchAttempt: '',
    errorDetails: null,
    contestApiResponse: null,
    wsConnectionStatus: 'disconnected',
    wsLastUpdate: null
  });
  
  // Removed console.log referencing deleted state

  // Contract address reveal disabled for performance - using static config
  const websocketContractAddress = config.CONTRACT_ADDRESS;
  const websocketContractRevealed = true; // Always revealed for performance
  
  const { settings } = useSystemSettings();

  // **NEW: Use WebSocket-based contest data instead of REST API**
  const {
    activeContests: wsActiveContests,
    upcomingContests: wsUpcomingContests,
    contests: allContests,
    isLoading: wsLoading,
    isConnected: wsConnected,
    error: wsError,
    lastUpdate: wsLastUpdate,
    refreshContests: wsRefreshContests
  } = useContests();

  // Map WebSocket contest statuses to our local state
  // Initialize with cached data for instant display
  const [activeContests, setActiveContests] = useState<Contest[]>(() => {
    return cachedContests.filter(isContestCurrentlyUnderway);
  });
  const [openContests, setOpenContests] = useState<Contest[]>(() => {
    return cachedContests.filter(isContestJoinable);
  });

  // Sync WebSocket data to local state
  useEffect(() => {
    // Only update from WebSocket if we have data and it's newer than our REST fetch
    if (wsActiveContests && wsUpcomingContests && wsConnected) {
      const shouldUpdateFromWs = !lastRestFetchRef.current || 
        (wsLastUpdate && wsLastUpdate > lastRestFetchRef.current);
      
      if (shouldUpdateFromWs) {
        console.log("[LandingPage] WebSocket contest data received:", {
          active: wsActiveContests.length,
          upcoming: wsUpcomingContests.length,
          total: allContests.length,
          wsConnected,
          wsLastUpdate
        });
      
      // DEBUG: Log raw WebSocket contest names
      console.log('[LandingPage] DEBUG - Raw WebSocket active contests:', wsActiveContests.map(c => ({
        id: (c as any).contest_id || (c as any).id,
        name: c.name,
        status: c.status
      })));
      console.log('[LandingPage] DEBUG - Raw WebSocket upcoming contests:', wsUpcomingContests.map(c => ({
        id: (c as any).contest_id || (c as any).id,
        name: c.name,
        status: c.status
      })));

      // Debug: Log raw contest data
      console.log("[LandingPage] DEBUG - Raw active contests from WebSocket:", wsActiveContests.map(c => ({
        id: (c as any).contest_id || (c as any).id,
        name: (c as any).name,
        status: (c as any).status
      })));
      console.log("[LandingPage] DEBUG - Raw upcoming contests from WebSocket:", wsUpcomingContests.map(c => ({
        id: (c as any).contest_id || (c as any).id,
        name: (c as any).name,
        status: (c as any).status
      })));

      // Convert WebSocket Contest format to main Contest format
      const convertedActiveContests = wsActiveContests.map(contest => ({
        ...contest,
        id: (contest as any).contest_id || (contest as any).id || '',
        allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Default buckets
        participant_count: (contest as any).entry_count || 0,
        settings: {
          difficulty: (contest as any).difficulty || 'guppy',
          maxParticipants: null,
          minParticipants: 2,
          tokenTypesAllowed: [],
          startingPortfolioValue: '1000'
        },
        min_participants: 2,
        max_participants: 100,
        is_participating: (contest as any).joined || (contest as any).participating || (contest as any).is_participating || false,
        contest_code: (contest as any).contest_id || (contest as any).id || '',
        image_url: undefined,
        participants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as unknown as Contest[];

      const convertedUpcomingContests = wsUpcomingContests.map(contest => ({
        ...contest,
        id: (contest as any).contest_id || (contest as any).id || '',
        allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Default buckets
        participant_count: (contest as any).entry_count || 0,
        settings: {
          difficulty: (contest as any).difficulty || 'guppy',
          maxParticipants: null,
          minParticipants: 2,
          tokenTypesAllowed: [],
          startingPortfolioValue: '1000'
        },
        min_participants: 2,
        max_participants: 100,
        is_participating: (contest as any).joined || (contest as any).participating || (contest as any).is_participating || false,
        contest_code: (contest as any).contest_id || (contest as any).id || '',
        image_url: undefined,
        participants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })) as unknown as Contest[];

        setActiveContests(convertedActiveContests);
        setOpenContests(convertedUpcomingContests);
        setLoading(false); // We have data, so stop loading

        // Update debug info
        setContestDebugInfo(prev => ({
          ...prev,
          wsConnectionStatus: wsConnected ? 'connected' : 'disconnected',
          wsLastUpdate: wsLastUpdate ? wsLastUpdate.toISOString() : null,
          lastFetchAttempt: new Date().toISOString(),
          errorDetails: wsError,
          contestApiResponse: `WebSocket: ${allContests.length} contests total`
        }));

        // Update Zustand store with converted WebSocket contest data
        if (allContests.length > 0) {
          const convertedAllContests = allContests.map(contest => ({
            ...contest,
            id: (contest as any).contest_id || (contest as any).id || '',
            allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            participant_count: (contest as any).entry_count || 0,
            settings: {
              difficulty: (contest as any).difficulty || 'guppy',
              maxParticipants: null,
              minParticipants: 2,
              tokenTypesAllowed: [],
              startingPortfolioValue: '1000'
            },
            min_participants: 2,
            max_participants: 100,
            is_participating: (contest as any).joined || (contest as any).participating || (contest as any).is_participating || false,
            contest_code: (contest as any).contest_id || (contest as any).id || '',
            image_url: undefined,
            participants: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })) as unknown as Contest[];
          useStore.getState().setContests(convertedAllContests);
        }
      }
    }
  }, [wsActiveContests, wsUpcomingContests, allContests, wsLoading, wsConnected, wsError, wsLastUpdate]);

  const isMaintenanceModeActive = settings?.maintenance_mode?.enabled || false;
  const maintenanceMessageToDisplay = settings?.maintenance_mode?.message || "Contests are temporarily paused for maintenance. Please check back soon!";
  
  
  // Removed WebSocket contract address logging for performance

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
  
  // **CRITICAL: Load data IMMEDIATELY - don't wait for WebSocket!**
  useEffect(() => {
    // Step 1: We're already showing cached data from state initialization
    console.log('[LandingPage] Initial load - using cached contests:', cachedContests.length);
    
    // Step 2: ALWAYS fetch fresh data via REST API immediately
    const fetchContestsViaRest = async () => {
      try {
        console.log('[LandingPage] Fetching fresh contests via REST API');
        const response = await ddApi.contests.getAll();
        const contests = Array.isArray(response) ? response : [];
        
        if (contests.length > 0 && isMounted.current) {
          // Update store
          useStore.getState().setContests(contests);
          
          // Update local state with fresh data
          const liveContests = contests.filter(isContestCurrentlyUnderway);
          const pendingContests = contests.filter(isContestJoinable);
          
          setActiveContests(liveContests);
          setOpenContests(pendingContests);
          lastRestFetchRef.current = new Date();
          
          console.log('[LandingPage] REST API loaded:', {
            total: contests.length,
            live: liveContests.length,
            pending: pendingContests.length
          });
        }
        
        // Clear any previous errors
        setError(null);
      } catch (error) {
        console.error('[LandingPage] REST API fetch failed:', error);
        // Only set error if we have no cached data to show
        if (cachedContests.length === 0) {
          setError('Failed to load contests');
        }
      } finally {
        // Only set loading false if we're not waiting for WebSocket
        if (!wsConnected || cachedContests.length > 0) {
          setLoading(false);
        }
      }
    };
    
    // Fetch immediately on mount
    fetchContestsViaRest();
    
    // Step 3: WebSocket will provide live updates when connected
  }, []); // Only run once on mount

  // **FALLBACK: REST API retry function for compatibility**
  const retryContestFetch = useCallback(async (attempt = 1) => {
    if (!isMounted.current) return;
    
    console.log(`[LandingPage] Fallback REST API fetch attempt ${attempt} (WebSocket: ${wsConnected ? 'connected' : 'disconnected'})`);
    
    try {
      setLoading(true);
      const response = await ddApi.contests.getAll(); 
      const contestsData = Array.isArray(response) ? response : ((response as any)?.contests || (response as any)?.data || []);
      
      if (isMounted.current && contestsData.length > 0) {
        console.log("[LandingPage] Fallback REST API data:", contestsData);
        
        const liveContests = contestsData.filter(isContestCurrentlyUnderway);
        const pendingContests = contestsData.filter(isContestJoinable);
        
        console.log("[LandingPage] Fallback - Live contests:", liveContests.length);
        console.log("[LandingPage] Fallback - Pending contests:", pendingContests.length);
        
        setActiveContests(liveContests);
        setOpenContests(pendingContests);
        setError(null);
        
        // Update Zustand store with fallback REST API data
        useStore.getState().setContests(contestsData);
        
        setContestDebugInfo(prev => ({
          ...prev,
          lastFetchAttempt: new Date().toISOString(),
          contestApiResponse: `REST API Fallback: ${JSON.stringify(response, null, 2).substring(0, 200)}...`,
          errorDetails: null
        }));
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error("[LandingPage] Fallback REST API failed:", err);
        setError("Failed to load contests. Please try again later.");
        setContestDebugInfo(prev => ({
          ...prev,
          lastFetchAttempt: new Date().toISOString(),
          errorDetails: err.message || String(err),
        }));
        
        if (attempt < 3) { // Retry up to 3 times
          console.log(`[LandingPage] Retrying fallback fetch, attempt ${attempt + 1}`);
          setTimeout(() => retryContestFetch(attempt + 1), 3000 * attempt); // Exponential backoff
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [wsConnected]);

  // Enhanced contest data loading strategy - FIXED: No more 10-second delays!
  useEffect(() => {
    // First, try to use cached contests from store
    const cachedContests = useStore.getState().contests;
    if (cachedContests && cachedContests.length > 0) {
      console.log('[LandingPage] Using cached contests data.');
      const cachedActive = cachedContests.filter(isContestCurrentlyUnderway);
      const cachedPending = cachedContests.filter(isContestJoinable);
      setActiveContests(cachedActive);
      setOpenContests(cachedPending);
      setLoading(false);
    }

    // FIXED: Load REST API immediately for instant display instead of waiting
    // WebSocket will provide live updates automatically via useContests hook
    console.log('[LandingPage] Loading contests via REST API immediately (no waiting!)');
    retryContestFetch();
  }, [retryContestFetch]);

  // Manual refresh function that always tries REST first for immediate results
  const handleManualRefresh = useCallback(async () => {
    console.log('[LandingPage] Manual refresh - fetching via REST API first');
    
    try {
      // Always fetch via REST first for immediate results
      const response = await ddApi.contests.getAll();
      const contests = Array.isArray(response) ? response : [];
      
      if (contests.length > 0 && isMounted.current) {
        // Update store
        useStore.getState().setContests(contests);
        
        // Update local state
        const liveContests = contests.filter(isContestCurrentlyUnderway);
        const pendingContests = contests.filter(isContestJoinable);
        
        setActiveContests(liveContests);
        setOpenContests(pendingContests);
        lastRestFetchRef.current = new Date();
        setError(null);
      }
      
      // Also trigger WebSocket refresh if connected for future updates
      if (wsConnected) {
        console.log('[LandingPage] Also refreshing via WebSocket for live updates');
        wsRefreshContests();
      }
    } catch (error) {
      console.error('[LandingPage] Manual refresh failed:', error);
      // If REST fails and WebSocket is connected, try WebSocket as fallback
      if (wsConnected) {
        wsRefreshContests();
      }
    }
  }, [wsConnected, wsRefreshContests]);

  const fallbackDateForTimers = useMemo(() => new Date(FALLBACK_RELEASE_DATE), []);

  // Check if countdown is complete
  useEffect(() => {
    const checkCountdownComplete = () => {
      const now = new Date();
      const timerExpired = fallbackDateForTimers.getTime() <= now.getTime();
      const hasRevealedAddress = !!(websocketContractAddress || websocketContractRevealed);
      
      // Countdown is complete if timer expired OR we have a revealed contract address
      // This allows buttons to work immediately when either condition is met
      setIsCountdownComplete(timerExpired || hasRevealedAddress);
    };

    checkCountdownComplete();
    const interval = setInterval(checkCountdownComplete, 1000);
    
    return () => clearInterval(interval);
  }, [fallbackDateForTimers, websocketContractAddress, websocketContractRevealed]);

  // Define dummy variants to satisfy linter, replace with actual definitions
  const landingPageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const childVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const secondaryVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const showCrownContest = false;

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
      <div className="flex flex-col min-h-screen relative" style={{ overflowX: 'clip' }}>


        {/* Landing Page Content Section */}
        <section className="relative flex-1 pb-20" style={{ zIndex: 10 }}>
          
          {/* Landing Page Container - responsive width for landscape mobile */}
          <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
            
            {/* Landing Page Content */}
            <div className="text-center space-y-2 md:space-y-4">
              
              {/* Title Section - Now featuring IntroLogo */}
              <div className="flex flex-col items-center justify-center mb-4 md:mb-8">
                
                
                
                {/* Enhanced Hero Section with IntroLogo and animated background */}
                <div className="relative w-full my-2 md:my-6">
                  
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
                      className="absolute top-1/4 -left-1/4 w-full h-full rounded-full blur-xl"
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
                      className="absolute bottom-1/3 -right-1/4 w-full h-full rounded-full blur-xl"
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

                {/* Enhanced tagline with secondary line */}
                <motion.div
                  className="mt-4 mb-3 md:mt-8 md:mb-6"
                  variants={childVariants}
                >

                {/* Hero tagline with enhanced styling */}
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <h2 className="text-2xl md:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block">
                      SIM CRYPTO TRADING BATTLES
                      {/* Animated underline */}
                      <motion.div 
                        className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 rounded-full"
                        initial={{ width: '0%', left: '50%' }}
                        animate={{ width: '100%', left: '0%' }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      />
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300/80 font-medium mt-4 md:mt-6">
                    Prove your skills. Win real Solana. No transactions required.
                  </p>
                </div>

                </motion.div>

                {/* CTAs - Now using the CtaSection component */}
                <CtaSection user={user} animationPhase={animationPhase} />

                {/* DUEL NOW Button - positioned between CTA and Crown Contest */}
                <FloatingDuelNowButton
                  enabled={true}
                />

                {/* Crown Contest Section - Extracted from contests */}
                {showCrownContest && !isMaintenanceModeActive && !error && (
                  (() => {
                    // Inline Crown Contest detection (same as contest browser)
                    const allAvailableContests = [...activeContests, ...openContests];
                    
                    // DEBUG: Log contest names being searched
                    console.log('[Crown Contest Debug] Searching in contests:', allAvailableContests.map(c => ({
                      id: c.id,
                      name: c.name,
                      status: c.status,
                      upperName: c.name.toUpperCase()
                    })));
                    
                    const crownContest = allAvailableContests.find(contest => {
                      const upperName = contest.name.toUpperCase();
                      const isMatch = upperName.includes('NUMERO UNO') || 
                             upperName.includes('NUMERO  UNO') || // double space
                             upperName.includes('NUMERO\tUNO') || // tab
                             upperName.includes('NUMEROUNO'); // no space
                      
                      console.log('[Crown Contest Debug] Checking contest:', contest.name, 'upperName:', upperName, 'isMatch:', isMatch);
                      return isMatch;
                    });
                    
                    console.log('[Crown Contest Debug] Found crown contest:', crownContest ? crownContest.name : 'NONE');

                    return crownContest ? (
                      <motion.div
                        className="relative w-full mt-6 md:mt-12 mb-6 md:mb-12"
                        variants={secondaryVariants}
                      >
                        <div className="w-full max-w-none sm:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
                          {(() => {
                            console.log('[Crown Contest Debug] RENDERING EnhancedContestSection with:', {
                              title: "Crown Contest",
                              type: crownContest.status,
                              featuredContest: crownContest.name,
                              loading: loading && activeContests.length === 0 && openContests.length === 0
                            });
                            return (
                              <EnhancedContestSection
                                title="Crown Contest"
                                type={crownContest.status}
                                contests={[]}
                                loading={loading && activeContests.length === 0 && openContests.length === 0}
                                featuredContest={crownContest}
                                featuredLabel="CROWN CONTEST"
                                isFeatureSection={true}
                              />
                            );
                          })()}
                        </div>
                      </motion.div>
                    ) : (
                      console.log('[Crown Contest Debug] NOT RENDERING - crownContest is null'),
                      null
                    );
                  })()
                )}

                {/* Contest sections - shown to all users */}
                <motion.div
                  variants={secondaryVariants}
                >
                  {isMaintenanceModeActive ? (
                    <div className="relative">
                      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
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
                      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
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
                              onClick={handleManualRefresh}
                              className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              Retry {wsConnected ? '(WebSocket)' : '(REST API)'}
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
                        
                        {/* Contest sections container */}
                        <div className="mb-4 md:mb-8">
                          {/* Crown Contest moved above Features section */}

                          {/* Show all contests in one unified section */}
                          {(() => {
                            const allContests = [...activeContests, ...openContests];
                            return allContests.length > 0 ? (
                              <ContestSection
                                title="Duels"
                                type="active"
                                contests={allContests}
                                loading={loading && activeContests.length === 0 && openContests.length === 0}
                              />
                            ) : null;
                          })()}

                          {/* No duels available */}
                          {activeContests.length === 0 &&
                           openContests.length === 0 &&
                           !loading && (
                              <div className="text-center py-16">
                                
                                {/* No duels available title */}
                                <h2 className="text-2xl font-bold mb-4 font-heading tracking-wide bg-gradient-to-r from-brand-400 to-purple-500 text-transparent bg-clip-text">
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

                {/* Enhanced Features section - shown to all users */}
                {FEATURE_FLAGS.SHOW_FEATURES_SECTION && (
                  <motion.div
                    className="relative w-full mt-6 md:mt-12"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: animationPhase > 0 ? 1 : 0,
                      transition: {
                        delay: 0.9,
                        duration: 1.2,
                      },
                    }}
                  >

                    {/* Features section container - responsive width for landscape mobile */}
                    <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <React.Suspense fallback={
                              <div className="flex items-center justify-center py-20">
                                <div className="text-gray-500 text-sm">Loading features...</div>
                              </div>
                            }>
                              <Features />
                            </React.Suspense>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                  </motion.div>
                )}

                {/* Template Section - Customizable boilerplate section */}
                {SHOW_TEMPLATE_SECTION_1 && (
                  <TemplateSection />
                )}

                {/* Template Section 2 - 2-column layout with links */}
                {SHOW_TEMPLATE_SECTION_2 && (
                  <TemplateSection2 />
                )}

                {/* Template Section 3 - Horizontal scrolling with filters */}
                {SHOW_TEMPLATE_SECTION_3 && (
                  <TemplateSection3 />
                )}
                
                </motion.div> 
                {/* Close the main landing-content container with variants */}

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* Enhanced Floating Action Buttons Stack */}
      <FloatingButtonStack
        tokenAddress={websocketContractAddress.REAL || FALLBACK_CA_FOR_BUTTONS}
        tokenSymbol={"DUEL"}
        enabled={forceShowFabs || (websocketContractRevealed && websocketContractAddress)}
        isCountdownComplete={isCountdownComplete}
      />

    </>
  );
};

export default LandingPage;