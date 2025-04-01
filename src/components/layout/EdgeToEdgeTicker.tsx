// src/components/layout/EdgeToEdgeTicker.tsx

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UnifiedTicker } from './UnifiedTicker';
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import type { Contest } from '../../types';

interface EdgeToEdgeTickerProps {
  contests?: Contest[];
  loading?: boolean;
  isCompact?: boolean;
  maxTokens?: number;
}

/**
 * EdgeToEdgeTicker - A full-width enhanced version of UnifiedTicker
 * This component creates a visually enhanced ticker that spans edge-to-edge
 * across the screen with animations, gradients, and visual effects.
 * It manages its own data fetching and state independent of the Header.
 */
export const EdgeToEdgeTicker: React.FC<EdgeToEdgeTickerProps> = ({
  contests: initialContests,
  loading: initialLoading = true,
  isCompact = false,
  maxTokens = 15,
}) => {
  // Local state for contests and loading
  const [activeContests, setActiveContests] = useState<Contest[]>(initialContests || []);
  const [loading, setLoading] = useState(initialLoading);

  // Fetch contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await ddApi.contests.getAll();
        const contests = Array.isArray(response) ? response : [];
        
        // Only show live contests
        setActiveContests(contests.filter(isContestLive) || []);
      } catch (err) {
        console.error("EdgeToEdgeTicker: Failed to load contests:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContests();
    const interval = setInterval(fetchContests, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="sticky top-14 sm:top-16 z-40 w-full overflow-hidden">
      {/* Dark base layer with slightly increased opacity for better readability */}
      <div className="absolute inset-0 bg-dark-200/70 backdrop-blur-sm" />

      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-brand-500/20 to-brand-900/40"
        />
        
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-gradient-to-br from-cyber-900/40 via-cyber-500/20 to-cyber-900/40"
        />
        
        {/* Moving light beam effect */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ 
            repeat: Infinity, 
            duration: 5,
            ease: "linear",
          }}
          className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
        
        {/* Data particles for cyber feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(153,0,255,0.05),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,225,255,0.05),transparent_30%)]" />
      </div>

      {/* Animated scan effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] animate-scan-fast"
        />
        
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,225,255,0.05)_50%,transparent_100%)] animate-scan-fast"
        />
        
        <div 
          className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-cyber-scan" 
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* Glowing borders */}
      <motion.div 
        className="absolute inset-x-0 top-0"
        initial={{ boxShadow: "0 0 0px rgba(0, 0, 0, 0)" }}
        animate={{ 
          boxShadow: "0 1px 6px rgba(153, 51, 255, 0.2)"
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"
        />
      </motion.div>
      
      <motion.div 
        className="absolute inset-x-0 bottom-0"
        initial={{ boxShadow: "0 0 0px rgba(0, 0, 0, 0)" }}
        animate={{ 
          boxShadow: "0 -1px 6px rgba(153, 51, 255, 0.2)"
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"
        />
      </motion.div>

      {/* Content container */}
      <div
        className={`relative transition-all duration-200 ease-out ${
          isCompact ? "h-6" : "h-8"
        }`}
      >
        {/* Core UnifiedTicker component */}
        <UnifiedTicker 
          contests={activeContests}
          loading={loading}
          isCompact={isCompact}
          maxTokens={maxTokens}
        />
      </div>

      {/* We're using utilities.css for the animations */}
    </div>
  );
};

export default EdgeToEdgeTicker;