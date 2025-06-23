// src/components/landing/features-list/FeatureList.tsx

/**
 * Feature List component - FEATURE THEATER VERSION
 * 
 * @description Interactive showcase displaying features one at a time with navigation
 * 
 * @author BranchManager69
 * @version 3.0.0 - Feature Theater Implementation
 * @created 2025-01-01
 * @updated 2025-06-04 - Converted from grid to interactive theater
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FEATURE_FLAGS } from "../../../config/config";
import { FeatureCard } from "./FeatureCard";

// Feature animations
// CURRENT FEATURES:
import { InstantSettlementAnimation } from "./animations/InstantSettlementAnimation"; // 4 - Instant SOL Settlement
import { RealTimeMarketDataAnimation } from "./animations/RealTimeMarketDataAnimation"; // 3 - Real-Time On-Chain Data
import { ReflectionSystemAnimation } from "./animations/ReflectionSystemAnimation"; // 2 - Degen Dividends
import { TradingCompetitionsAnimation } from "./animations/TradingCompetitionsAnimation"; // 1 - Trading Contests
// import { OneVsOneDuelsAnimation } from "./animations/OneVsOneDuelsAnimation";          // 5 - 1v1 Duels
// FUTURE FEATURES:
import { AdvancedAnalyticsAnimation } from "./animations/AdvancedAnalyticsAnimation"; // 6 - Advanced Analytics
// import { BringYourOwnAgentAnimation } from "./animations/BringYourOwnAgentAnimation";  // 7 - Bring Your Own Agent
import { DegenReputationAnimation } from "./animations/DegenReputationAnimation"; // 8 - Degen Reputation

// DegenDuel features - Descriptions and animations
const currentFeatures = [
  // 1 - Trading Contests
  {
    title: "Trading Contests",
    description: "Compete in high-stakes trading contests with equal starting capital. Your strategy and execution determine success.",
    extendedDescription:
      "All participants start with identical portfolios and capital. Success depends entirely on your trading strategy and execution over the competition period.\n\nDurations range from 1-hour sprints to multi-day tournaments. Choose public contests or create private invite-only events with custom entry fees and prize structures.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15C15.5 15 18.5 12 18.5 8V4.5H5.5V8C5.5 12 8.5 15 12 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8.5 20.5H15.5M12 15V20.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5.5 4.5H18.5M8 2V4.5M16 2V4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    animation: <TradingCompetitionsAnimation />,
    isUpcoming: false
  },

  // 2 - 1v1 Duels
  {
    title: "1v1 Duels",
    description: "Challenge anyone to head-to-head trading battles with custom stakes and competition parameters.",
    extendedDescription: 
      "Challenge anyone to head-to-head trading battles. Set custom stakes and competition parameters for your private duels.\n\nPerfect for settling debates about who's the better trader. Send invite links directly to opponents and prove your skills in direct competition.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M16 8L20 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 8L4 12L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4L10 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    //animation: <OneVsOneDuelsAnimation />, // (needs to be generated 5/23/25)
    isUpcoming: true
  },
  
  // 3 - Degen Dividends
  {
    title: "Degen Dividends",
    description: "All DegenDuel profits (that's 10% of contest entry fees) are directly airdropped to DUEL token holders via daily automatic Solana transfers to your wallet. Airdrop amounts will be directly proportional to the amount held proportional to the total amount held by registered members (subject to change).",
    extendedDescription: 
      "Token holders receive daily Solana rewards automatically sent to their connected wallets. The system tracks platform revenue and redistributes 100% of profits to the DegenDuel community.\n\nDegen Dividends are based on average daily balance (many small snapshots are taken throughout the day at random intervals). Simply hold your DUEL in your registered wallet.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L4 7L12 11L20 7L12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 12L12 16L20 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 17L12 21L20 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    animation: <ReflectionSystemAnimation />,
    isUpcoming: false
  },
  
  // 4 - Real-Time On-Chain Data
  {
    title: "Real-Time On-Chain Data",
    description: "Live price feeds across all tokens and competitions with millisecond latency through advanced WebSocket infrastructure.",
    extendedDescription: 
      "Millisecond-level price updates across all supported tokens and competitions. View real-time candlestick charts, order flow, and market sentiment indicators as they happen.\n\nThe unified data stream handles thousands of concurrent users while maintaining consistent low latency. Performance metrics are visible in our real-time system status dashboard.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.5 12H5M19 12H21.5M12 2.5V5M12 19V21.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 10L10 12L12 9L16 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    animation: <RealTimeMarketDataAnimation />,
    isUpcoming: false
  },
  
  // 5 - Bring Your Own Agent
  {
    title: "Bring Your Own Agent",
    description: "Deploy custom AI trading agents to compete in specialized contests using ElizaOS, Virtuals, and other frameworks.",
    extendedDescription: 
      "Create, test, and deploy custom trading agents from open-source frameworks like ElizaOS and Virtuals in specialized competitions. Bring your own strategy for sophisticated trading logic.\n\nTest your agents in historical market simulations before deploying them in live competitions against other traders' algorithms.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 14V10L12 14L16 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 10H6M18 10H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    //animation: <BringYourOwnAgentAnimation />, // (needs to be generated 5/23/25)
    isUpcoming: true
  },

  // 6 - Degen Reputation
  {
    title: "Degen Reputation",
    description: "Build your Degen Rep through competitions and achievements to unlock exclusive platform benefits.",
    extendedDescription: 
      "Track your progress and accomplishments across the platform. Earn achievement badges, ranking points, and reputation scores through competition performance, referrals, and community contributions.\n\nHigher reputation levels unlock exclusive benefits including fee discounts, early access to new features, private competitions, and enhanced profit-sharing tiers.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 16L6 10L3 10L3 16L6 16Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 16L13.5 4L10.5 4L10.5 16L13.5 16Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 16L21 7L18 7L18 16L21 16Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 20L21 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    animation: <DegenReputationAnimation />,
    isUpcoming: true
  },

  // 7 - Advanced Analytics
  {
    title: "Advanced Analytics",
    description: "AI-powered analytics help improve your trading performance with comprehensive metrics and visualizations.",
    extendedDescription:
      "Track your trading performance across competitions with detailed metrics including win rate, average ROI, drawdown statistics, and sentiment analysis.\n\nExport historical data in multiple formats, create custom dashboards, and compare your performance against market benchmarks or other traders through percentile rankings.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 21H4C3.44772 21 3 20.5523 3 20V3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7 14L11 10L14 13L18 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    animation: <AdvancedAnalyticsAnimation />,
    isUpcoming: true
  },

  // 8 - Instant SOL Settlement
  {
    title: "Instant SOL Settlement",
    description: "Contest winnings are automatically distributed to winners' wallets seconds after competition ends.",
    extendedDescription: 
      "Final standings are calculated and prize distributions processed immediately after competition end. Winners receive rewards directly to their connected wallets with no manual claims required.\n\nTransaction verification uses a dual-signature system for maximum security while maintaining near-instantaneous settlement times regardless of competition size.",
    icon: (
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 3L5 13H12L11 21L19 11H12L13 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    animation: <InstantSettlementAnimation />,
    isUpcoming: false
  },

];

// Upcoming features with "SOON" tag
const upcomingFeatures: typeof currentFeatures = [];

// Hook for reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

export const FeatureList: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Memoize the combined features array for better performance
  const allFeatures = useMemo(() => [
    ...currentFeatures,
    ...upcomingFeatures
  ], []);

  const currentFeature = allFeatures[currentFeatureIndex];

  // Navigation functions
  const nextFeature = useCallback(() => {
    setCurrentFeatureIndex((prev) => (prev + 1) % allFeatures.length);
  }, [allFeatures.length]);

  const prevFeature = useCallback(() => {
    setCurrentFeatureIndex((prev) => (prev - 1 + allFeatures.length) % allFeatures.length);
  }, [allFeatures.length]);

  const goToFeature = useCallback((index: number) => {
    setCurrentFeatureIndex(index);
    setAutoPlay(false); // Stop autoplay when user manually navigates
  }, []);

  // Auto-advance features every 8 seconds
  useEffect(() => {
    if (!autoPlay || prefersReducedMotion) return;
    
    const interval = setInterval(nextFeature, 8000);
    return () => clearInterval(interval);
  }, [autoPlay, nextFeature, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevFeature();
        setAutoPlay(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextFeature();
        setAutoPlay(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextFeature, prevFeature]);

  // Animation variants for feature theater
  const theaterVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    }),
  };

  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    nextFeature();
    setAutoPlay(false);
  };

  const handlePrev = () => {
    setDirection(-1);
    prevFeature();
    setAutoPlay(false);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentFeatureIndex ? 1 : -1);
    goToFeature(index);
  };

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Feature Theater Container - 2 Column Layout on Desktop */}
      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        
                 {/* Left Column: Main Feature Theater - Match Sidebar Height */}
         <div className="lg:col-span-2">
           <div className="relative min-h-[300px] max-h-[70vh] lg:min-h-[600px] lg:max-h-none xl:min-h-[700px] overflow-hidden rounded-2xl bg-gradient-to-br from-dark-200/50 to-dark-300/30 backdrop-blur-sm border border-dark-300/20">
            
            {/* Navigation Arrows - Desktop */}
            <div className="hidden md:block">
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-dark-300/80 hover:bg-dark-300 transition-all duration-200 text-brand-400 hover:text-brand-300 backdrop-blur-sm border border-brand-400/20"
                aria-label="Previous feature"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-dark-300/80 hover:bg-dark-300 transition-all duration-200 text-brand-400 hover:text-brand-300 backdrop-blur-sm border border-brand-400/20"
                aria-label="Next feature"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Feature Card Showcase - Scrollable on mobile */}
            <div className="relative h-full p-4 md:p-6 overflow-y-auto lg:overflow-y-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentFeatureIndex}
                  custom={direction}
                  variants={theaterVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="h-full"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe < -10000) {
                      handleNext();
                    } else if (swipe > 10000) {
                      handlePrev();
                    }
                  }}
                >
                  <FeatureCard
                    title={currentFeature.title}
                    description={currentFeature.description}
                    extendedDescription={currentFeature.extendedDescription}
                    icon={currentFeature.icon}
                    animation={FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? currentFeature.animation : undefined}
                    isUpcoming={currentFeature.isUpcoming}
                    className="h-full border-none bg-transparent shadow-none"
                    isShowcase={true}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            {autoPlay && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-400/30">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-400 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  key={currentFeatureIndex}
                />
              </div>
            )}
          </div>

          {/* Navigation Dots - Mobile Only */}
          <div className="flex justify-center items-center mt-4 gap-3 lg:hidden">
            {allFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`relative transition-all duration-300 ${
                  index === currentFeatureIndex
                    ? 'w-12 h-3 bg-gradient-to-r from-brand-400 to-purple-500'
                    : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                } rounded-full`}
                aria-label={`Go to feature ${index + 1}: ${allFeatures[index].title}`}
              >
                {index === currentFeatureIndex && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-brand-400 to-purple-500 rounded-full"
                    layoutId="activeFeature"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Feature Counter - Mobile Only */}
          <div className="text-center mt-3 text-sm text-gray-400 lg:hidden">
            <span className="text-brand-400 font-bold">{currentFeatureIndex + 1}</span>
            {' / '}
            <span>{allFeatures.length}</span>
            {autoPlay && (
              <span className="ml-3 text-xs">
                <button
                  onClick={() => setAutoPlay(false)}
                  className="text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Auto-play ON (click to pause)
                </button>
              </span>
            )}
            {!autoPlay && (
              <span className="ml-3 text-xs">
                <button
                  onClick={() => setAutoPlay(true)}
                  className="text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Auto-play OFF (click to resume)
                </button>
              </span>
            )}
          </div>

          {/* Mobile Swipe Hint */}
          <div className="block lg:hidden text-center mt-2 text-xs text-gray-500">
            Swipe left or right to explore features
          </div>
        </div>

        {/* Right Column: Feature Navigation Sidebar - Desktop Only */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-dark-200/30 to-dark-300/20 backdrop-blur-sm border border-dark-300/20 rounded-2xl p-6">
              
              {/* Sidebar Header */}
              <div className="mb-6">
                <h3 className="text-xl font-russo-one text-white mb-2">All Features</h3>
                <p className="text-sm text-gray-400">Click to jump to any feature</p>
              </div>

              {/* Feature List Navigation */}
              <div className="space-y-3">
                {allFeatures.map((feature, index) => (
                  <motion.button
                    key={feature.title}
                    onClick={() => handleDotClick(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                      index === currentFeatureIndex
                        ? 'bg-gradient-to-r from-brand-400/20 to-purple-500/20 border-l-4 border-brand-400'
                        : 'bg-dark-300/30 hover:bg-dark-300/50 border-l-4 border-transparent'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${
                        index === currentFeatureIndex ? 'bg-brand-400/30' : 'bg-dark-400/50'
                      }`}>
                        <div className="text-sm">
                          {feature.icon}
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className={`font-semibold text-sm ${
                          index === currentFeatureIndex ? 'text-white' : 'text-gray-300'
                        }`}>
                          {feature.title}
                        </h4>
                        {feature.isUpcoming && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600/70 text-blue-100 text-xs font-bold uppercase tracking-wide rounded-sm">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Controls Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    <span className="text-brand-400 font-bold">{currentFeatureIndex + 1}</span>
                    {' / '}
                    <span>{allFeatures.length}</span>
                  </span>
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      autoPlay 
                        ? 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                  >
                    {autoPlay ? 'Auto ✓' : 'Manual'}
                  </button>
                </div>
                
                {/* Keyboard shortcuts hint */}
                <div className="mt-3 text-xs text-gray-500">
                  Use ← → keys to navigate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
