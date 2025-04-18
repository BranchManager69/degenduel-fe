// src/components/landing/features-list/FeatureList.tsx

/**
 * Advanced feature list component with interactive expandable cards
 * Displays platform features with rich animations and detailed content
 */

import React from "react";
import { motion } from "framer-motion";

import { FeatureCard } from "./FeatureCard";
import { ReflectionSystemAnimation } from "./animations/ReflectionSystemAnimation";

// Platform features with real descriptions and animations
const features = [
  {
    title: "Reflections System",
    description: "Half of all DegenDuel profits are returned to token holders through the reflections system with daily Solana rewards.",
    extendedDescription: 
      "Our unique reflections system ensures that the community benefits directly from platform success. Token holders who meet the minimum criteria receive daily Solana rewards automatically sent to their connected wallets.\n\nThe system tracks platform revenue in real-time and allocates 50% to the community rewards pool, which is then distributed proportionally based on token holdings. No staking or lock-up periods required - simply hold your tokens in a compatible wallet.",
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
    animation: <ReflectionSystemAnimation />
  },
  {
    title: "Trading Competitions",
    description: "Compete in high-stakes trading contests with equal starting capital where your strategy and execution determine success.",
    extendedDescription:
      "DegenDuel hosts regular trading competitions where all participants begin with identical portfolios and capital. Success depends entirely on your trading decisions over the competition period.\n\nCompetitions run for various durations from quick 1-hour sprints to multi-day tournaments. Both public contests and private invite-only events are available, with customizable parameters for entry fees, prize structures, and tradable assets.",
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
  },
  {
    title: "Real-Time Market Data",
    description: "Access live price feeds across tokens and competitions with minimal latency through our advanced WebSocket infrastructure.",
    extendedDescription: 
      "Our proprietary websocket infrastructure delivers millisecond-level price updates across all supported tokens and competitions. View real-time candlestick charts, order flow, and market sentiment indicators as they happen.\n\nThe unified data stream handles tens of thousands of concurrent users while maintaining consistent low latency. Performance metrics are transparent and visible in our real-time system status dashboard.",
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
  },
  {
    title: "Advanced Analytics",
    description: "Track performance with comprehensive metrics and visualizations to refine your trading strategies over time.",
    extendedDescription:
      "DegenDuel provides institutional-grade analytics for all users, regardless of portfolio size. Track your trading performance across competitions with detailed metrics including win rate, average ROI, drawdown statistics, and sentiment analysis.\n\nExport your historical data in multiple formats, create custom dashboards, and compare your performance against market benchmarks or other traders through our percentile ranking system.",
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
  },
  {
    title: "Degen Reputation System",
    description: "Build your profile and reputation through competitions, achievements, and community contribution for exclusive platform benefits.",
    extendedDescription: 
      "The Degen Reputation System tracks your progress and accomplishments across the platform. Earn achievement badges, ranking points, and reputation scores through competition performance, referrals, and community contributions.\n\nHigher reputation levels unlock exclusive benefits including fee discounts, early access to new features, private competitions, and enhanced profit-sharing tiers through the reflections system.",
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
  },
  {
    title: "Instant Settlement",
    description: "Competition winnings are automatically distributed to winners' wallets seconds after contest completion.",
    extendedDescription: 
      "Our proprietary settlement engine calculates final standings and processes all prize distributions immediately after competition end. Winners receive their rewards directly to their connected wallets with no manual claims required.\n\nTransaction verification and validation are handled through a decentralized dual-signature system for maximum security, while still maintaining near-instantaneous settlement times regardless of competition size or complexity.",
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
  },
];

// Upcoming features with "SOON" tag
const upcomingFeatures = [
  {
    title: "AI Trading Agents",
    description: "Deploy your own AI trading algorithms to compete in specialized contests against other traders' agents.",
    extendedDescription: 
      "The upcoming AI Trading Agent platform will allow you to create, test, and deploy custom trading algorithms in specialized competitions. Code your strategy in Python, JavaScript, or use our no-code builder to create sophisticated trading logic.\n\nTest your agents in historical market simulations before deploying them in live competitions against other traders' algorithms. The platform supports reinforcement learning, neural networks, and traditional algorithmic approaches with comprehensive documentation and templates.",
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
    isUpcoming: true
  },
  {
    title: "P2P Trading Duels",
    description: "Challenge specific traders to head-to-head battles with custom stakes and competition parameters.",
    extendedDescription: 
      "P2P Trading Duels will enable direct head-to-head competition between traders. Challenge anyone on the platform to a trading duel with customizable parameters including duration, starting capital, allowed tokens, and stake amount.\n\nSet special rules like maximum order size, allowed order types, or specific trading hours. Create public or private duels, with the option for spectators to watch the action unfold in real-time through our specialized duel visualization interface.",
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
    isUpcoming: true
  }
];

// Combine all features for rendering
const allFeatures = [...features, ...upcomingFeatures];

export const FeatureList: React.FC = () => {
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Item animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {allFeatures.map((feature) => (
        <motion.div key={feature.title} variants={itemVariants}>
          <FeatureCard {...feature} />
        </motion.div>
      ))}
    </motion.div>
  );
};
