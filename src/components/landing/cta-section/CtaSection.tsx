// src/components/landing/cta-section/CtaSection.tsx

/**
 * CTA Section Component
 * @description This component renders the main call-to-action buttons for the landing page,
 *              including primary action, secondary links, and a conditional whale room button.
 *
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-05
 * @updated 2025-05-05
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
// Hooks and Types
import { useWallet } from '../../../hooks/websocket/topic-hooks/useWallet';
import { User } from '../../../types';

// Define WhaleRoomButton component (encapsulated within CtaSection)
const WhaleRoomButton = ({ walletAddress }: { walletAddress: string }) => {
  const {
    balance,
    isLoading,
  } = useWallet(walletAddress);
  
  // Whale criteria check: 
  //   1. SOL balance > 10 SOL, or
  //   2. Any token with USD value > $5,000, or
  //   3. Total portfolio value > $10,000 
  const isWhale = React.useMemo(() => {
    if (!balance || isLoading) return false;
    
    // Check SOL balance criteria (>10 SOL)
    if (balance.sol_balance > 10) return true;
    
    // Check for any high-value tokens (>$5,000)
    const hasHighValueToken = balance.tokens.some(token => 
      token.value_usd && token.value_usd > 5000
    );
    
    if (hasHighValueToken) return true;
    
    // Calculate total portfolio value
    const totalValue = balance.tokens.reduce((sum, token) => 
      sum + (token.value_usd || 0), 
      0
    );
    
    // Add SOL value (approximating $150 per SOL)
    const portfolioValueWithSol = totalValue + (balance.sol_balance * 150);
    
    // Check portfolio value criteria (>$10,000) 
    return portfolioValueWithSol > 10000;
  }, [balance, isLoading]);
  
  // If user meets whale criteria, show button to access the exclusive Whale Room
  if (!isWhale) return null;
  
  // If user does not meet whale criteria, do not show the button
  return (
    <div className="w-full max-w-md">
      
      {/* Conditional WHALE ROOM button - only shown to users with significant token/SOL balances */}
      <RouterLink to="/whale-room" className="w-full">
        
        {/* Button */}
        <button 
          className="w-full relative group overflow-hidden"
          aria-label="Access the exclusive Whale Room"
        >
          {/* Gradient background */}
          <div className="relative clip-edges bg-gradient-to-r from-purple-500 to-indigo-600 p-[1px] transition-all duration-300 group-hover:from-purple-400 group-hover:to-indigo-500 shadow-md shadow-purple-900/20">
            
            {/* Button Content */}
            <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
              
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              {/* Button Content */}
              <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                
                {/* Whale Room Button */}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-purple-200 flex items-center">
                  
                  {/* Icon */}
                  <span className="mr-2">
                    💎
                  </span>

                  {/* Button Text */}
                  <span>
                    WHALE ROOM
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
      className="mt-8 mb-10 flex flex-col items-center justify-center gap-6 px-4 sm:px-0 max-w-full"
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
      {/* Primary action button - larger and with pulse animation */}
      {user ? (
        <RouterLink to="/contests" className="w-full max-w-md">
          <button 
            className="w-full relative group overflow-hidden"
            aria-label="Find a duel to join"
          >
            <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[2px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500 shadow-lg shadow-emerald-900/20 animate-pulse-subtle">
              <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-10 py-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-between space-x-6 text-2xl font-cyber">
                  <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                    FIND DUEL
                  </span>
                  <svg
                    className="w-7 h-7 text-emerald-400 group-hover:text-white transform group-hover:translate-x-2 transition-all"
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
      ) : (
        <RouterLink to="/login" className="w-full max-w-md">
          <button 
            className="w-full relative group overflow-hidden"
            aria-label="Connect your wallet to start"
          >
            <div className="relative clip-edges bg-gradient-to-r from-brand-500 to-brand-600 p-[2px] transition-all duration-300 group-hover:from-brand-400 group-hover:to-brand-500 shadow-lg shadow-brand-900/20 animate-pulse-subtle">
              <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-10 py-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-between space-x-6 text-2xl font-cyber">
                  <span className="bg-gradient-to-r from-brand-300 to-brand-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-brand-200">
                    CONNECT
                  </span>
                  <svg
                    className="w-7 h-7 text-brand-400 group-hover:text-white transform group-hover:translate-x-2 transition-all"
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
      )}

      {/* Secondary buttons row - two buttons side by side with same color */}
      <div className="flex flex-col sm:flex-row w-full max-w-md gap-4 justify-between">
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

        {/* FAQ button - now using same blue/cyan color scheme as GAMEPLAY */}
        <RouterLink to="/faq" className="w-full sm:w-[48%]">
          <button 
            className="w-full relative group overflow-hidden"
            aria-label="View frequently asked questions"
          >
            <div className="relative clip-edges bg-gradient-to-r from-blue-500 to-cyan-600 p-[1px] transition-all duration-300 group-hover:from-blue-400 group-hover:to-cyan-500 shadow-md shadow-blue-900/20">
              <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-5 py-3">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <div className="relative flex items-center justify-between space-x-3 text-lg font-cyber">
                  <span className="bg-gradient-to-r from-blue-300 to-cyan-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-blue-200">
                    FAQ
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
      </div>

      {/* Conditional WHALE ROOM button - only shown to users with significant token/SOL balances */}
      {user && (
        <WhaleRoomButton walletAddress={user.wallet_address} />
      )}

    </motion.div>
  );
};

// (optional) default export
export default CtaSection; 
