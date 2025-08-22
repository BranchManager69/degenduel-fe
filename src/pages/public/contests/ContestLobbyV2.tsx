// src/pages/public/contests/ContestLobbyV2.tsx

/**
 * Contest Lobby V2 - The Ultimate In-Game Experience
 * 
 * @description Complete contest experience with trading, real-time charts, and chat
 * @author BranchManager
 * @version 2.0.0
 * @created 2025-06-11
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
// Removed unused import: TokenSearchFixed
// Removed unused import: ContestChat
import { FocusedParticipantsList } from "../../../components/contest-detail/FocusedParticipantsList";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
// Removed unused imports: EnhancedPortfolioDisplay, LiveTradeActivity
import { MultiParticipantChartV2 } from "../../../components/contest-lobby/MultiParticipantChartV2";

import { ContestDetailHeaderNew } from "../../../components/contest-detail/ContestDetailHeaderNew";
// Removed unused import: UserPerformanceCard
import { Button } from "../../../components/ui/Button";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestLobbyWebSocket } from "../../../hooks/websocket/topic-hooks/useContestLobbyWebSocket";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
// Removed unused imports
// Removed unused import: useCustomToast
// Removed unused import: formatCurrency
import { ContestViewData } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Removed UnderConstructionOverlay component - no longer needed

// Removed Trading Panel Component - no longer needed

// Main Contest Lobby V2 Component
export const ContestLobbyV2: React.FC = () => {
  const { id: contestIdFromParams } = useParams<{ id: string }>();
  const { user } = useMigratedAuth();
  
  console.log('[ContestLobbyV2] Component mounted with contestId:', contestIdFromParams, 'user:', user);

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Removed activeTab state - no longer needed
  
  // Chart hover state - for coordinating between ParticipantsList and MultiParticipantChart
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  
  // View mode state for leaderboard tab (removed - not used with new header)
  
  // Removed tab switching logic - no longer using tabs
  //const [unreadMessages] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Mouse position tracking removed - handled by new header component

  // WebSocket hooks
  const { contestViewData: wsUpdatedData } = useContestViewUpdates(contestIdFromParams || null, contestViewData);
  const { participants } = useContestParticipants(contestIdFromParams ? parseInt(contestIdFromParams) : null);
  
  // Debug participants
  useEffect(() => {
    console.log('[ContestLobbyV2] Participants from WebSocket hook:', participants);
    console.log('[ContestLobbyV2] Participants length:', participants.length);
    console.log('[ContestLobbyV2] Contest view data leaderboard:', contestViewData?.leaderboard);
  }, [participants, contestViewData]);

  const [portfolio, setPortfolio] = useState<any>(null);
  const [_portfolioLoading, setPortfolioLoading] = useState(false);
  const [allParticipantsData, setAllParticipantsData] = useState<any[]>([]);
  
  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!contestIdFromParams) {
      console.log('[ContestLobbyV2] Cannot fetch portfolio - missing contestId:', {
        contestId: contestIdFromParams
      });
      return;
    }
    
    setPortfolioLoading(true);
    try {
      // Fetch both portfolio analytics and enhanced participant data with profile images
      const [portfolioResponse, participantsResponse] = await Promise.all([
        fetch(`/api/portfolio-analytics/contests/${contestIdFromParams}/performance/detailed`, {
          credentials: 'same-origin'
        }),
        fetch(`/api/contests/${contestIdFromParams}/participants`, {
          credentials: 'same-origin'
        })
      ]);
      
      console.log('[ContestLobbyV2] Fetching portfolio analytics from:', `/api/portfolio-analytics/contests/${contestIdFromParams}/performance/detailed`);
      
      if (portfolioResponse.ok) {
        const data = await portfolioResponse.json();
        console.log('[ContestLobbyV2] Portfolio analytics data fetched:', data);
        
        // Get enhanced participant data with profile images
        let enhancedParticipantsData: any[] = [];
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          enhancedParticipantsData = participantsData.contest_participants || participantsData.participants || [];
          console.log('[ContestLobbyV2] Enhanced participants with profile images:', enhancedParticipantsData);
        }
        
        // Merge portfolio analytics with profile image data
        const mergedParticipants = (data.participants || []).map((portfolioParticipant: any) => {
          const enhancedData = enhancedParticipantsData.find(
            (enhanced: any) => enhanced.wallet_address === portfolioParticipant.wallet_address
          );
          
          return {
            ...portfolioParticipant,
            profile_image_url: enhancedData?.profile_image_url || null,
            nickname: enhancedData?.nickname || enhancedData?.users?.nickname || portfolioParticipant.username || `Player ${portfolioParticipant.rank || 0}`
          };
        });
        
        console.log('[ContestLobbyV2] Merged participants with profile images:', mergedParticipants);
        setAllParticipantsData(mergedParticipants);
        
        // Find the current user's portfolio from the response
        const userPortfolio = user ? mergedParticipants.find(
          (p: any) => p.wallet_address === user.wallet_address
        ) : null;
        
        if (userPortfolio) {
          // Transform the data to match the expected format
          const portfolioData = {
            wallet_address: userPortfolio.wallet_address,
            total_value: userPortfolio.total_value_sol?.toString() || '0',
            tokens: (userPortfolio.holdings || []).map((holding: any) => ({
              symbol: holding.symbol,
              name: holding.name,
              weight: holding.weight,
              percentage: holding.weight, // alias for weight
              quantity: holding.quantity?.toString() || '0',
              current_value: holding.value_sol?.toString() || '0',
              value: holding.value_sol?.toString() || '0', // alias
              value_usd: holding.value_usd?.toString() || '0'
            })),
            performance_percentage: userPortfolio.pnl_percent?.toString() || '0',
            pnl_sol: userPortfolio.pnl_sol?.toString() || '0',
            initial_value: userPortfolio.initial_value_sol?.toString() || '0',
            // Find rank from participants array
            rank: user ? mergedParticipants.findIndex((p: any) => p.wallet_address === user.wallet_address) + 1 : 0
          };
          console.log('[ContestLobbyV2] User portfolio found:', portfolioData);
          setPortfolio(portfolioData);
        } else {
          console.log('[ContestLobbyV2] No portfolio found for user');
          setPortfolio(null);
        }
      } else {
        console.error('[ContestLobbyV2] Portfolio fetch failed:', portfolioResponse.status, portfolioResponse.statusText);
        const errorText = await portfolioResponse.text();
        console.error('[ContestLobbyV2] Error response:', errorText);
      }
    } catch (error) {
      console.error('[ContestLobbyV2] Failed to fetch portfolio:', error);
    } finally {
      setPortfolioLoading(false);
    }
  }, [contestIdFromParams, user?.wallet_address]);
  
  // Fetch portfolio on mount and when user changes
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);
  
  // Refresh portfolio data when WebSocket updates come in
  useEffect(() => {
    if (participants.length > 0 || wsUpdatedData) {
      console.log('[ContestLobbyV2] WebSocket update detected, refreshing portfolio data');
      fetchPortfolio();
    }
  }, [participants.length, wsUpdatedData, fetchPortfolio]);
  
  const refreshPortfolio = useCallback(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Initial data fetch via REST
  useEffect(() => {
    const contestId = contestIdFromParams ?? null;
    if (!contestId) {
      setError("Contest ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchContestView = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch static contest details and dynamic leaderboard data in parallel
        const [contestResponse, liveResponse] = await Promise.all([
          fetch(`/api/contests/${contestId}`),
          fetch(`/api/contests/${contestId}/live`)
        ]);
        
        if (!contestResponse.ok || !liveResponse.ok) {
          throw new Error(`Failed to load contest data`);
        }
        
        const contestData = await contestResponse.json();
        const liveData = await liveResponse.json();
        
        console.log('[ContestLobbyV2] Contest details:', contestData);
        console.log('[ContestLobbyV2] Live data:', liveData);
        
        // Transform contest details from full endpoint
        const transformedContest = {
          id: contestData.id.toString(),
          name: contestData.name,
          description: contestData.description || '',
          status: contestData.status === 'active' ? 'active' as const : contestData.status,
          startTime: contestData.start_time,
          endTime: contestData.end_time,
          entryFee: contestData.entry_fee || '0',
          prizePool: contestData.prize_pool,
          totalPrizePool: contestData.current_prize_pool || contestData.prize_pool,
          currency: contestData.currency || 'SOL',
          participantCount: liveData.contest.participant_count || contestData.participant_count,
          image_url: contestData.image_url, // Add the contest image
          settings: {
            difficulty: contestData.settings?.difficulty || 'guppy',
            maxParticipants: contestData.max_participants || null,
            minParticipants: contestData.min_participants || 1,
            tokenTypesAllowed: contestData.settings?.tokenTypesAllowed || ['SPL'],
            startingPortfolioValue: contestData.settings?.startingPortfolioValue || '10000'
          },
          isCurrentUserParticipating: !!liveData.leaderboard?.find((entry: any) => 
            entry.wallet_address === user?.wallet_address
          )
        };
        
        // Transform leaderboard entries from live endpoint
        const transformedLeaderboard = (liveData.leaderboard || []).map((entry: any) => ({
          rank: entry.rank,
          userId: entry.wallet_address,
          username: entry.nickname || entry.username || `Player ${entry.rank}`,
          profilePictureUrl: entry.profile_image_url,
          portfolioValue: entry.portfolio_value,
          performancePercentage: entry.performance_percentage,
          isCurrentUser: entry.wallet_address === user?.wallet_address,
          isAiAgent: entry.is_ai_agent || false,
          prizeAwarded: entry.prize_awarded || null
        }));
        
        const viewData: ContestViewData = {
          contest: transformedContest,
          leaderboard: transformedLeaderboard,
          currentUserPerformance: transformedLeaderboard.find((entry: any) => 
            entry.userId === user?.wallet_address
          ) || null
        };
        
        setContestViewData(viewData);
      } catch (err) {
        console.error('[ContestLobbyV2] Error fetching contest data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contest data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContestView();
  }, [contestIdFromParams]);

  // Update contest data from WebSocket
  useEffect(() => {
    if (wsUpdatedData) {
      setContestViewData(wsUpdatedData);
    }
  }, [wsUpdatedData]);

  // Handle contest activity updates
  const handleContestActivity = useCallback(async () => {
    if (!contestIdFromParams) return;
    
    // Refresh contest view data (only need live data for updates)
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestIdFromParams}/live`);
      if (response.ok) {
        const liveData = await response.json();
        
        // Keep existing contest details, just update dynamic fields
        setContestViewData(prev => {
          if (!prev) return prev;
          
          // Update participant count from live data
          const updatedContest = {
            ...prev.contest,
            participantCount: liveData.contest.participant_count
          };
          
          // Transform leaderboard entries
          const transformedLeaderboard = (liveData.leaderboard || []).map((entry: any) => ({
            rank: entry.rank,
            userId: entry.wallet_address,
            username: entry.nickname || entry.username || `Player ${entry.rank}`,
            profilePictureUrl: entry.profile_image_url,
            portfolioValue: entry.portfolio_value,
            performancePercentage: entry.performance_percentage,
            isCurrentUser: entry.wallet_address === user?.wallet_address,
            isAiAgent: entry.is_ai_agent || false,
            prizeAwarded: entry.prize_awarded || null,
            role: entry.role || "user", // Add role field
            is_admin: entry.is_admin || false,
            is_superadmin: entry.is_superadmin || false
          }));
          
          return {
            contest: updatedContest,
            leaderboard: transformedLeaderboard,
            currentUserPerformance: transformedLeaderboard.find((entry: any) => 
              entry.userId === user?.wallet_address
            ) || null
          };
        });
      }
    } catch (err) {
      console.error('[ContestLobbyV2] Error refreshing contest data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contestIdFromParams, user?.wallet_address]);

  // Set up WebSocket listeners using the custom hook
  useContestLobbyWebSocket({
    contestId: contestIdFromParams ?? null,
    onTradeExecuted: refreshPortfolio,
    onPortfolioUpdate: refreshPortfolio,
    onContestActivity: handleContestActivity,
    userWalletAddress: user?.wallet_address
  });

  // Mouse handlers removed - handled by new header component

  // Setup OG meta tags - use useMemo to prevent infinite re-renders
  const contestForMeta = useMemo(() => contestViewData?.contest, [contestViewData?.contest?.id, contestViewData?.contest?.name]);
  const participantCount = useMemo(() => participants.length, [participants.length]);
  
  useEffect(() => {
    if (contestForMeta) {
      setupContestOGMeta(
        contestForMeta.id.toString(), 
        contestForMeta.name,
        `Live contest with ${participantCount} participants`
      );
      return resetToDefaultMeta;
    }
  }, [contestForMeta, participantCount]);

  // Transform participants data for leaderboard
  const transformedParticipants = useMemo(() => {
    console.log('[ContestLobbyV2] Creating transformed participants from:', allParticipantsData);
    
    if (!allParticipantsData.length) {
      console.log('[ContestLobbyV2] No participants data to transform');
      return [];
    }
    
    // First sort by performance percentage (highest to lowest)
    const sortedData = [...allParticipantsData].sort((a, b) => {
      const aPerf = parseFloat(a.pnl_percent?.toString() || '0');
      const bPerf = parseFloat(b.pnl_percent?.toString() || '0');
      return bPerf - aPerf; // Descending order (highest performance first)
    });
    
    const transformed = sortedData.map((p, index) => ({
      wallet_address: p.wallet_address,
      nickname: p.nickname || p.username || `Player ${index + 1}`,
      username: p.nickname || p.username || `Player ${index + 1}`,
      profile_image_url: p.profile_image_url || null, // Now includes profile images from merged data
      portfolio_value: p.total_value_sol?.toString() || '0',
      performance_percentage: p.pnl_percent?.toString() || '0',
      rank: index + 1, // Now properly ranked by performance
      is_ai_agent: false,
      is_current_user: user?.wallet_address === p.wallet_address,
      prize_awarded: null,
      role: p.role || "user", // Add role field
      is_admin: p.is_admin || false,
      is_superadmin: p.is_superadmin || false
    }));
    
    console.log('[ContestLobbyV2] Transformed and sorted participants:', transformed);
    return transformed;
  }, [allParticipantsData, user?.wallet_address]);
  
  // Always use properly sorted participants 
  const effectiveParticipants = useMemo(() => {
    const sourceData = participants.length > 0 ? participants : transformedParticipants;
    
    console.log('[DEBUG] Before sorting - sourceData:', sourceData.slice(0, 3));
    console.log('[DEBUG] Using participants from WebSocket:', participants.length > 0);
    
    // Always sort by performance percentage regardless of data source
    const sorted = [...sourceData].sort((a, b) => {
      const aPerf = parseFloat(a.performance_percentage?.toString() || '0');
      const bPerf = parseFloat(b.performance_percentage?.toString() || '0');
      console.log(`[DEBUG] Comparing ${a.nickname} (${aPerf}%) vs ${b.nickname} (${bPerf}%)`);
      return bPerf - aPerf; // Highest performance first
    }).map((p, index) => ({
      ...p,
      rank: index + 1 // Update ranks after sorting
    }));
    
    console.log('[DEBUG] After sorting - top 3:', sorted.slice(0, 3));
    return sorted;
  }, [participants, transformedParticipants]);
  
  // Removed userPerformance calculation - not needed


  // Removed tab definitions - no longer using tabs
  
  // Debug effective participants
  useEffect(() => {
    if (effectiveParticipants.length > 0) {
      console.log('[ContestLobbyV2] Participants loaded! Count:', effectiveParticipants.length);
      console.log('[ContestLobbyV2] First 3 participants:', effectiveParticipants.slice(0, 3));
    }
  }, [effectiveParticipants]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Contest</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!contestViewData?.contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Contest not found</p>
      </div>
    );
  }

  const contest = contestViewData.contest;
  
  // Transform contest to match ContestDetailHeaderNew expectations
  const contestForHeader = contest ? {
    id: parseInt(contest.id),
    name: contest.name,
    description: contest.description,
    status: contest.status,
    start_time: contest.startTime,
    end_time: contest.endTime,
    entry_fee: contest.entryFee,
    prize_pool: contest.prizePool,
    total_prize_pool: contest.totalPrizePool,
    participant_count: contest.participantCount,
    max_participants: contest.settings.maxParticipants || 0,
    min_participants: contest.settings.minParticipants || 2,
    // Add missing required Contest fields
    allowed_buckets: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contest_code: `contest_${contest.id}`,
    image_url: (contestViewData.contest as any).image_url, // Add the missing image_url
    settings: {
      ...contest.settings,
      max_participants: contest.settings.maxParticipants || 0,
      payout_structure: (contestViewData.contest.settings as any)?.payout_structure
    },
    wallet_address: (contestViewData.contest as any).wallet_address,
    cancellation_reason: (contestViewData.contest as any).cancellation_reason
  } : null;
  
  // Determine display status
  const getDisplayStatus = () => {
    if (!contest) return 'pending';
    if (contest.status === 'cancelled') return 'cancelled';
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    const hasStarted = now >= startTime;
    const hasEnded = now >= endTime;
    if (hasEnded) return 'completed';
    if (hasStarted) return 'active';
    return 'pending';
  };
  
  const displayStatus = getDisplayStatus() as 'active' | 'pending' | 'completed' | 'cancelled';
  const hasPortfolio = !!portfolio && portfolio.tokens && portfolio.tokens.length > 0;
  const isParticipating = contest?.isCurrentUserParticipating || hasPortfolio;

  return (
    <SilentErrorBoundary>
      <div className="flex flex-col min-h-screen">
        {/* Breadcrumb navigation */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="flex items-center text-sm text-gray-400">
              <a href="/" className="hover:text-brand-400 transition-colors">
                Home
              </a>
              <span className="mx-2">›</span>
              <a href="/contests" className="hover:text-brand-400 transition-colors">
                Contests
              </a>
              <span className="mx-2">›</span>
              <span className="text-gray-300">{contest?.name || 'Contest'}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Beautiful Header with Parallax Effect */}
            {contestForHeader && (
              <ContestDetailHeaderNew
                contest={contestForHeader}
                displayStatus={displayStatus}
                isAuthenticated={!!user}
                hasPortfolio={hasPortfolio}
                isParticipating={isParticipating}
                portfolioTransactions={null} // Not needed for live page
                onActionButtonClick={() => {
                  // No action button on live page
                }}
                getActionButtonLabel={() => ''}
                handleCountdownComplete={() => {
                  // Refresh data when countdown completes
                  window.location.reload();
                }}
                error={error}
                showActionButton={false} // Hide action button on live page
              />
            )}
            
          </div>
        </div>
        
        {/* Main Content - Leaderboard Only */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div ref={contentRef}>
            {/* Leaderboard Content */}
                <div className="space-y-6">
                  <AnimatePresence mode="wait">
                    {false ? ( // Default to list mode since toggle was removed
                      <motion.div
                        key="carousel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Focused Participants View - Carousel Mode */}
                        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
                          <FocusedParticipantsList 
                            participants={effectiveParticipants}
                            contestStatus="live"
                            prizePool={parseFloat(contest.prizePool || '0')}
                            contestId={contestIdFromParams!}
                            onParticipantHover={setHoveredParticipant}
                            hoveredParticipant={hoveredParticipant}
                          />
                        </div>
                        
                        {/* Chart below carousel */}
                        <div className="mt-6">
                          <MultiParticipantChartV2 
                            contestId={contestIdFromParams!}
                            contestStatus={contest.status === 'active' ? 'active' : 
                                         contest.status === 'pending' ? 'upcoming' : 
                                         contest.status === 'completed' ? 'completed' : 'cancelled'}
                            participants={effectiveParticipants}
                            timeInterval="1h"
                            maxParticipants={effectiveParticipants.length}
                            hoveredParticipant={hoveredParticipant}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Main Grid Layout - List Mode */}
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                          <div className="lg:col-span-7">
                            <MultiParticipantChartV2 
                              contestId={contestIdFromParams!}
                              contestStatus={contest.status === 'active' ? 'active' : 
                                           contest.status === 'pending' ? 'upcoming' : 
                                           contest.status === 'completed' ? 'completed' : 'cancelled'}
                              participants={effectiveParticipants}
                              timeInterval="1h"
                              maxParticipants={effectiveParticipants.length}
                              hoveredParticipant={hoveredParticipant}
                            />
                          </div>
                          <div className="lg:col-span-3 space-y-6">
                            <ParticipantsList 
                              participants={effectiveParticipants} 
                              contestStatus="live"
                              prizePool={parseFloat(contest.prizePool || '0')}
                              contestId={contestIdFromParams!}
                              onParticipantHover={setHoveredParticipant}
                              hoveredParticipant={hoveredParticipant}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
          </div>
        </div>
      </div>
    </SilentErrorBoundary>
  );
};

export default ContestLobbyV2;