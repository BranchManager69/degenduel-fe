// src/components/landing/features-list/FeatureList.tsx

/**
 * Feature List component
 * 
 * @description Displays current and future features of DegenDuel with descriptions and rich animations.
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-01-01
 * @updated 2025-05-09
 */

import { motion } from "framer-motion";
import React from "react";

import { FeatureCard } from "./FeatureCard";

// Feature animations
import { AdvancedAnalyticsAnimation } from "./animations/AdvancedAnalyticsAnimation";
import { InstantSettlementAnimation } from "./animations/InstantSettlementAnimation";
import { RealTimeMarketDataAnimation } from "./animations/RealTimeMarketDataAnimation";
import { ReflectionSystemAnimation } from "./animations/ReflectionSystemAnimation";
import { TradingCompetitionsAnimation } from "./animations/TradingCompetitionsAnimation";
// Need animation for 1v1 Challenges
// Need animation for Bring Your Own Agent
import { DegenReputationAnimation } from "./animations/DegenReputationAnimation";

// DegenDuel features - Descriptions and animations
const currentFeatures = [
  // 1 - Trading Contests
  {
    title: "Trading Contests",
    description: "Compete in high-stakes trading contests with equal starting capital where your strategy and execution determine success.",
    extendedDescription:
      "DegenDuel hosts Duels, regular trading contests where all participants begin with identical portfolios and capital. Success depends entirely on your trading decisions over the competition period.\n\nCompetitions run for various durations from quick 1-hour sprints to multi-day tournaments. Both public contests and private invite-only events are available, with customizable parameters for entry fees, prize structures, and tradable assets.",
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
  
  // 2 - Degen Dividends
  {
    title: "Degen Dividends",
    description: "Half of all DegenDuel profits are returned to token holders through the reflections system with daily Solana rewards.",
    extendedDescription: 
      "DegenDuel's unique reflections system ensures that the community benefits directly from platform success. Token holders who meet the minimum criteria receive daily Solana rewards automatically sent to their connected wallets.\n\nThe system tracks platform revenue in real-time and allocates 50% to the community rewards pool, which is then distributed proportionally based on token holdings. No staking or lock-up periods required - simply hold your tokens in a compatible wallet.",
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
    animation: <RealTimeMarketDataAnimation />,
    isUpcoming: false
  },
  
  // 4 - Instant SOL Settlement
  {
    title: "Instant SOL Settlement",
    description: "Duel winnings are automatically distributed to winners' wallets seconds after contest completion.",
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
    animation: <InstantSettlementAnimation />,
    isUpcoming: false
  },

  // 5 - AI Trading Agents
  {
    title: "AI Trading Agents",
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
    animation: <AdvancedAnalyticsAnimation />,
    isUpcoming: false
  },
];

// Upcoming features with "SOON" tag
const upcomingFeatures = [
  // 6 - 1v1 Challenges
  {
    title: "1v1 Challenges",
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
  },
  
  // 7 - Bring Your Own Agent
  {
    title: "Bring Your Own Agent",
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
  
  // 8 - Rep System
  {
    title: "Rep System",
    description: "Build your profile and reputation through competitions, achievements, and community contribution for exclusive platform benefits.",
    extendedDescription: 
      "DegenDuel's Rep System tracks your progress and accomplishments across the platform. Earn achievement badges, ranking points, and reputation scores through competition performance, referrals, and community contributions.\n\nHigher reputation levels unlock exclusive benefits including fee discounts, early access to new features, private competitions, and enhanced profit-sharing tiers through the reflections system.",
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

  // 9 - (Make something up)
  // (Make something up)
];

// Combine current and upcoming features for rendering
const allFeatures = [...currentFeatures, ...upcomingFeatures];

// Feature list JSX
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
