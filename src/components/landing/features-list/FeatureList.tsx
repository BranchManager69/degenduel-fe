// src/components/landing/features-list/FeatureList.tsx

/**
 * Feature List component - CLEAN GRID VERSION
 * 
 * @description Simple grid layout displaying key features
 * 
 * @author BranchManager69
 * @version 4.0.0 - Clean Grid Implementation
 * @created 2025-01-01
 * @updated 2025-06-26 - Simplified from theater to clean grid
 */

import { motion } from "framer-motion";
import React from "react";
import { FeatureCard } from "./FeatureCard";

// Core features - Just the 4 key ones
const coreFeatures = [
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
    isUpcoming: false
  },

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
    isUpcoming: false
  },
  
  {
    title: "Degen Dividends",
    description: "All DegenDuel profits are directly airdropped to DUEL token holders via daily automatic Solana transfers to your wallet.",
    extendedDescription: 
      "Token holders receive daily Solana rewards automatically sent to their connected wallets. The system tracks platform revenue and redistributes 100% of profits to the DegenDuel community.\n\nDegen Dividends are based on average daily balance. Simply hold your DUEL in your registered wallet.",
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
    isUpcoming: false
  },
  
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
    isUpcoming: true
  }
];

export const FeatureList: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {coreFeatures.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <FeatureCard
              title={feature.title}
              description={feature.description}
              extendedDescription={feature.extendedDescription}
              icon={feature.icon}
              isUpcoming={feature.isUpcoming}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
