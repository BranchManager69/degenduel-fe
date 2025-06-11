// src/components/landing/features-list/FeatureList.tsx

/**
 * Feature List component
 * 
 * @description Displays current and future features of DegenDuel with descriptions and rich animations.
 * 
 * @author BranchManager69
 * @version 2.1.1
 * @created 2025-01-01
 * @updated 2025-05-23
 */

import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
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
    description: "Half of all platform profits go to token holders through daily Solana rewards sent automatically to your wallet.",
    extendedDescription: 
      "Token holders receive daily Solana rewards automatically sent to their connected wallets. The system tracks platform revenue in real-time and distributes 50% to the community.\n\nRewards are distributed proportionally based on token holdings. No staking or lock-up periods required - simply hold your tokens in a compatible wallet.",
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
  
  // 3 - Real-Time On-Chain Data
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
  
  // 4 - Bring Your Own Agent
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

  // 5 - Degen Reputation
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

  // 6 - Advanced Analytics
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

  // 7 - Instant SOL Settlement
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

  // Memoize the combined features array for better performance
  const allFeatures = useMemo(() => [
    ...currentFeatures,
    ...upcomingFeatures
  ], []);

  // Animation variants for staggered entrance - only when motion is allowed
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 30,
      scale: prefersReducedMotion ? 1 : 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Features grid with responsive layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {allFeatures.map((feature) => (
          <motion.div
            key={feature.title}
            variants={cardVariants}
            className="h-full"
          >
            <FeatureCard
              title={feature.title}
              description={feature.description}
              extendedDescription={feature.extendedDescription}
              icon={feature.icon}
              animation={FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? feature.animation : undefined}
              isUpcoming={feature.isUpcoming}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>


    </motion.div>
  );
};
