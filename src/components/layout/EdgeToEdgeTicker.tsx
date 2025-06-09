// src/components/layout/EdgeToEdgeTicker.tsx

/**
 * EdgeToEdgeTicker 
 * 
 * @description A full-width enhanced version of UnifiedTicker
 *
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-02-14
 * @updated 2025-05-25
 */

import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useScrollHeader } from '../../hooks/ui/useScrollHeader';
import { useContests } from '../../hooks/websocket/topic-hooks/useContests';
import {
  isContestJoinable,
} from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from '../../store/useStore';
import type { Contest } from '../../types';
import { UnifiedTicker } from './UnifiedTicker';

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
export const EdgeToEdgeTicker: React.FC<EdgeToEdgeTickerProps> = (props) => {
  const {
    contests: initialContests,
    loading: initialLoading = true,
    isCompact: compactOverrideProp,
    maxTokens = 15,
  } = props;

  // Use header scroll state to sync with header compact mode by default
  const { isCompact: isCompactFromHook } = useScrollHeader(50);

  // Determine the final compact state.
  // If compactOverrideProp is explicitly provided (true or false), use it.
  // Otherwise, fall back to the hook-derived value.
  const finalIsCompact = typeof compactOverrideProp === 'boolean'
    ? compactOverrideProp
    : isCompactFromHook;
    
  // DEBUG: Log compact state per page
  useEffect(() => {
    console.log(`[EdgeToEdgeTicker] Page: ${window.location.pathname}, isCompact: ${finalIsCompact}, compactOverrideProp: ${compactOverrideProp}, isCompactFromHook: ${isCompactFromHook}`);
  }, [finalIsCompact, compactOverrideProp, isCompactFromHook]);

  // Get cached contests immediately for instant display
  const cachedContests = useMemo(() => {
    return useStore.getState().contests || [];
  }, []);

  // **Use WebSocket-based contest data for live updates**
  const {
    upcomingContests: wsUpcomingContests,
    lastUpdate: wsLastUpdate
  } = useContests();

  // Local state for contests and loading - initialize with cached joinable contests
  const [joinableContests, setJoinableContests] = useState<Contest[]>(() => {
    if (initialContests) {
      return initialContests.filter(isContestJoinable);
    }
    return cachedContests.filter(isContestJoinable);
  });
  
  // Smart loading - only show loading if no cached data AND WebSocket is loading
  const [loading, setLoading] = useState(() => {
    return initialLoading && cachedContests.length === 0 && joinableContests.length === 0;
  });
  
  const isMountedRef = useRef(true);
  const lastRestFetchRef = useRef<Date | null>(null);

  // **IMMEDIATE REST API fetch for fresh data**
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchContestsViaRest = async () => {
      try {
        console.log('[EdgeToEdgeTicker] Fetching fresh contests via REST API');
        const response = await ddApi.contests.getAll();
        const contests = Array.isArray(response) ? response : [];
        
        if (contests.length > 0 && isMountedRef.current) {
          // Update store
          useStore.getState().setContests(contests);
          
          // Update local state with fresh joinable contests
          const joinable = contests.filter(isContestJoinable);
          setJoinableContests(joinable);
          lastRestFetchRef.current = new Date();
          
          console.log('[EdgeToEdgeTicker] REST API loaded:', {
            total: contests.length,
            joinable: joinable.length
          });
        }
      } catch (error) {
        console.error('[EdgeToEdgeTicker] REST API fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch immediately on mount
    fetchContestsViaRest();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update with WebSocket data when available and newer than REST
  useEffect(() => {
    if (wsUpcomingContests && wsUpcomingContests.length > 0) {
      const shouldUpdate = !lastRestFetchRef.current || 
        (wsLastUpdate && wsLastUpdate > lastRestFetchRef.current);
      
      if (shouldUpdate) {
        console.log('[EdgeToEdgeTicker] Using WebSocket upcoming contests:', wsUpcomingContests.length);
        
        // The useContests hook already handles conversion - just use the data
        // Convert from useContests format back to main Contest format
        const convertedContests = wsUpcomingContests.map(wsContest => ({
          id: parseInt((wsContest as any).contest_id || (wsContest as any).id) || 0,
          name: wsContest.name,
          description: wsContest.description || '',
          entry_fee: (wsContest as any).entry_fee?.toString() || '0',
          prize_pool: wsContest.prize_pool?.toString() || '0',
          start_time: wsContest.start_time,
          end_time: wsContest.end_time,
          allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          participant_count: (wsContest as any).entry_count || 0,
          status: wsContest.status === 'registration' ? 'pending' as const : 
                 wsContest.status === 'active' ? 'active' as const :
                 wsContest.status === 'ended' ? 'completed' as const : 'cancelled' as const,
          settings: {
            difficulty: (wsContest as any).difficulty || 'guppy',
            maxParticipants: null,
            minParticipants: 2,
            tokenTypesAllowed: [],
            startingPortfolioValue: '1000'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          min_participants: 2,
          max_participants: 100,
          is_participating: (wsContest as any).joined || false,
          contest_code: (wsContest as any).contest_id || (wsContest as any).id || '',
          image_url: undefined,
          participants: []
        })) as Contest[];

        const joinable = convertedContests.filter(isContestJoinable);
        setJoinableContests(joinable);
        
        // Update store
        useStore.getState().setContests(convertedContests);
        setLoading(false);
      }
    }
  }, [wsUpcomingContests, wsLastUpdate]);

  // Dynamically adjust top position based on header compact state
  const topPosition = finalIsCompact ? 'top-12 sm:top-14' : 'top-14 sm:top-16';

  return (
    <div className={`sticky ${topPosition} z-40 w-full overflow-hidden transition-[top] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
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
        className={`relative transition-[height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${       
          finalIsCompact ? 'h-10' : 'h-12 sm:h-12' // Adjusted non-compact height
        }`}
      >
        {/* Core UnifiedTicker component - passes through all DUEL announcement logic */}
        <UnifiedTicker 
          contests={joinableContests}
          loading={loading}
          isCompact={finalIsCompact}
          maxTokens={maxTokens}
        />
      </div>

      {/* We're using utilities.css for the animations */}
    </div>
  );
};

export default EdgeToEdgeTicker;