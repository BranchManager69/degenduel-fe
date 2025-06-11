// src/components/landing/cta-section/CtaSection.tsx

/**
 * CTA Section Component
 * @description This component renders the secondary call-to-action buttons for the landing page,
 *              including secondary links and a conditional whale room button.
 *              Primary DUEL NOW action is handled by FloatingDuelNowButton.
 *
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-05-05
 * @updated 2025-01-20
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
// Hooks and Types
import { useWhaleStatus } from '../../../hooks/data/useWhaleStatus';
import { User } from '../../../types';

// Define WhaleRoomButton component (encapsulated within CtaSection)
const WhaleRoomButton: React.FC<{ user: User | null }> = ({ user }) => {
  // FIXED: Pass authentication state to useWhaleStatus hook
  const { 
    isWhale, 
    isLoading, 
    error, 
    whaleStatus,
    currentBalance,
    progressPercentage 
  } = useWhaleStatus({ 
    isAuthenticated: !!user?.wallet_address,
    userId: user?.wallet_address 
  });

  // Don't show if user is not authenticated
  if (!user?.wallet_address) {
    return null;
  }

  // Don't show if still loading whale status
  if (isLoading) {
    return (
      <div className="w-full max-w-md flex justify-center py-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  // Don't show if there's an error or user is not a whale
  if (error || !isWhale) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      
      {/* Conditional WHALE ROOM button - only shown to verified whales */}
      <RouterLink to="/whale-room" className="w-full">
        
        {/* Button */}
        <button 
          className="w-full relative group overflow-hidden"
          aria-label={`Access the exclusive Whale Room - ${whaleStatus?.tier_name} tier`}
          title={`Balance: ${currentBalance.toLocaleString()} DUEL (${progressPercentage.toFixed(1)}%)`}
        >
          {/* Gradient background */}
          <div className="relative clip-edges bg-gradient-to-r from-purple-500 to-indigo-600 p-[1px] transition-all duration-300 group-hover:from-purple-400 group-hover:to-indigo-500 shadow-md shadow-purple-900/20">
            
            {/* Button Content */}
            <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              {/* Button Content */}
              <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                
                {/* Whale Room Button with tier info */}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-purple-200 flex items-center">
                  
                  {/* Professional tier indicator */}
                  <span className="mr-3 text-purple-400 group-hover:text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>

                  {/* Button Text with tier */}
                  <span className="flex flex-col items-start">
                    <span className="text-lg font-bold">WHALE ROOM</span>
                    <span className="text-xs text-purple-300/80 font-medium uppercase tracking-wider">
                      {whaleStatus?.tier_name}
                    </span>
                  </span>

                </span>

                {/* Arrow icon */}
                <svg
                  className="w-5 h-5 text-purple-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
                  fill="none" 
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {/* Arrow path */}
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
      
    </div>
  );
};

// Define props the new component will need
interface CtaSectionProps {
  /** The currently authenticated user object, or null if not logged in. */
  user: User | null;
  /** The current animation phase number from the parent LandingPage. */
  animationPhase: number;
}

// CTA Section Component
export const CtaSection: React.FC<CtaSectionProps> = ({ user, animationPhase }) => {
  // You might need other state or logic here depending on complexity
  return (
    <motion.div
      className="mt-4 mb-2 md:mt-8 md:mb-4 flex flex-col items-center justify-center gap-3 md:gap-6 px-4 sm:px-0 max-w-full"
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
      {/* Secondary buttons row - two buttons side by side */}
      <div className="flex flex-row w-full max-w-md gap-4 justify-between">
        {/* GAMEPLAY button */}
        <RouterLink to="/how-it-works" className="w-full sm:w-[48%]">
          <button 
            className="w-full relative group overflow-hidden"
            aria-label="Learn gameplay instructions"
          >
            <div className="relative clip-edges bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500 shadow-md shadow-blue-900/20">
              <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                  <span className="bg-gradient-to-r from-blue-300 to-cyan-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-blue-200">
                    GAMEPLAY
                  </span>
                  <svg
                    className="w-5 h-5 text-blue-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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

        {/* FAQ button */}
        <RouterLink to="/faq" className="w-full sm:w-[48%]">
          <button 
            className="w-full relative group overflow-hidden"
            aria-label="Frequently asked questions"
          >
            <div className="relative clip-edges bg-gradient-to-r from-purple-500 to-pink-600 p-[1px] transition-all duration-300 group-hover:from-purple-400 group-hover:to-pink-500 shadow-md shadow-purple-900/20">
              <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                  <span className="bg-gradient-to-r from-purple-300 to-pink-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-purple-200">
                    FAQ
                  </span>
                  <svg
                    className="w-5 h-5 text-purple-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
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
      </div>

      {/* Conditional WHALE ROOM button - properly implemented with hook */}
      <WhaleRoomButton user={user} />

    </motion.div>
  );
};

// (optional) default export
export default CtaSection; 
