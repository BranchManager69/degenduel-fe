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
import { TokenSearchFixed } from "../../../components/common/TokenSearchFixed";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { FocusedParticipantsList } from "../../../components/contest-detail/FocusedParticipantsList";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { EnhancedPortfolioDisplay } from "../../../components/contest-lobby/EnhancedPortfolioDisplay";
import { LiveTradeActivity } from "../../../components/contest-lobby/LiveTradeActivity";
import { MultiParticipantChartV2 } from "../../../components/contest-lobby/MultiParticipantChartV2";

import { ContestLobbyHeader } from "../../../components/contest-lobby/ContestLobbyHeader";
import { UserPerformanceCard } from "../../../components/contest-lobby/UserPerformanceCard";
import { Button } from "../../../components/ui/Button";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestLobbyWebSocket } from "../../../hooks/websocket/topic-hooks/useContestLobbyWebSocket";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
// Removed usePortfolio - implementing manual portfolio fetching
import { PrizeStructure } from "../../../components/contest-detail/PrizeStructure";
import { useCustomToast } from "../../../components/toast";
import { formatCurrency } from "../../../lib/utils";
import { ContestViewData, SearchToken } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Under Construction Overlay Component
const UnderConstructionOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative">
      {/* Content (dimmed) */}
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Construction Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
        <div className="text-center p-8 max-w-md">
          {/* Animated Construction Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl mb-6"
          >
            🚧
          </motion.div>
          
          {/* Construction Banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-xl mb-4 shadow-2xl border-4 border-black transform -rotate-1">
            <div className="flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>UNDER CONSTRUCTION</span>
              <span>⚠️</span>
            </div>
          </div>
          
          {/* Striped Warning Pattern */}
          <div className="bg-gradient-to-r from-yellow-400 via-black to-yellow-400 h-3 mb-4 rounded-full opacity-80"
               style={{
                 backgroundImage: `repeating-linear-gradient(
                   45deg,
                   #fbbf24 0px,
                   #fbbf24 10px,
                   #000000 10px,
                   #000000 20px
                 )`
               }}>
          </div>
          
          {/* Message */}
          <div className="text-gray-300 text-sm">
            In-contest trading is coming soon.
            <br />
            Enjoy DFS-style portfolio contests, live now.
          </div>
          
          {/* Animated Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Trading Panel Component
const TradingPanel: React.FC<{
  contestId: string;
  portfolio: any;
  onTradeComplete: () => void;
}> = ({ contestId, portfolio, onTradeComplete }) => {
  const { user } = useMigratedAuth();
  const { addToast } = useCustomToast();
  const [selectedToken, setSelectedToken] = useState<SearchToken | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [weight, setWeight] = useState<number>(10);
  const [isTrading, setIsTrading] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('[TradingPanel] Component mounted with:', {
      user,
      contestId,
      portfolio,
      authToken: localStorage.getItem('authToken'),
      dd_token: localStorage.getItem('dd_token')
    });
  }, [user, contestId, portfolio]);

  const executeTrade = async () => {
    if (!selectedToken || !user) return;
    
    setIsTrading(true);
    try {
      // Use the portfolio trades endpoint with session cookie auth
      const response = await fetch(`/api/portfolio/${contestId}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Use session cookie like submitPortfolio
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          token_id: selectedToken.id,
          type: tradeType.toUpperCase(),
          new_weight: weight
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[TradingPanel] Trade executed:', result);
        
        // Success feedback
        addToast('success', `${tradeType} ${selectedToken.symbol} - ${weight}% of portfolio`);
        
        // Reset and refresh
        onTradeComplete();
        setSelectedToken(null);
        setWeight(10);
      } else {
        const error = await response.text();
        throw new Error(error || 'Trade execution failed');
      }
    } catch (error) {
      console.error('[TradingPanel] Trade failed:', error);
      addToast('error', error instanceof Error ? error.message : 'Trade failed');
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Portfolio */}
      {portfolio ? (
        portfolio.tokens && portfolio.tokens.length > 0 ? (
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Current Portfolio</h3>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              {showPortfolio ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showPortfolio && (
            <div className="space-y-3">
              {portfolio.tokens.map((token: any, index: number) => (
                <div key={token.token_id || token.address || token.symbol || index} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {token.image_url && (
                      <img src={token.image_url} alt={token.symbol} className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium text-gray-100">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-100">{token.weight || token.percentage}%</div>
                    <div className="text-xs text-gray-400">
                      Value: {formatCurrency(parseFloat(token.current_value || token.value || '0'))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-dark-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Portfolio Value</span>
                  <span className="font-mono font-bold text-gray-100">
                    {formatCurrency(parseFloat(portfolio.total_value || '0'))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Current Portfolio</h3>
          <div className="text-center py-8 text-gray-400">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-lg">No portfolio yet</p>
            <p className="text-sm mt-2">Start trading to build your portfolio!</p>
          </div>
        </div>
      )
    ) : (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Current Portfolio</h3>
        <div className="text-center py-8 text-gray-400">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-300 rounded w-1/2 mx-auto mb-3"></div>
            <div className="h-4 bg-dark-300 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    )}
      
      {/* Trading Interface */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Trade Tokens</h3>
      
      {/* Token Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Token
        </label>
        <TokenSearchFixed
          onSelectToken={(token) => {
            console.log('[TradingPanel] Token selected:', token);
            setSelectedToken(token);
          }}
          placeholder="Search tokens..."
        />
      </div>

      {selectedToken && (
        <>
          {/* Trade Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Action
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('[TradingPanel] BUY button clicked');
                  setTradeType('BUY');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => {
                  console.log('[TradingPanel] SELL button clicked');
                  setTradeType('SELL');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tradeType === 'SELL'
                    ? 'bg-red-500 text-white'
                    : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Weight Slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Portfolio Weight: {weight}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={executeTrade}
            disabled={isTrading}
            className="w-full"
          >
            {isTrading ? 'Executing...' : `${tradeType} ${selectedToken.symbol}`}
          </Button>
        </>
      )}
      </div>
    </div>
  );
};


// Main Contest Lobby V2 Component
export const ContestLobbyV2: React.FC = () => {
  const { id: contestIdFromParams } = useParams<{ id: string }>();
  const { user } = useMigratedAuth();
  
  console.log('[ContestLobbyV2] Component mounted with contestId:', contestIdFromParams, 'user:', user);

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'activity'>('leaderboard');
  
  // Chart hover state - for coordinating between ParticipantsList and MultiParticipantChart
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  
  // Switch away from Trade tab if user logs out
  useEffect(() => {
    if (!user && activeTab === 'trade') {
      setActiveTab('leaderboard');
    }
  }, [user, activeTab]);
  //const [unreadMessages] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Mouse position tracking for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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
            prizeAwarded: entry.prize_awarded || null
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

  // Mouse move handler for parallax effect (desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target) return;
    
    // Get card dimensions and position
    const rect = target.getBoundingClientRect();
    
    // Calculate mouse position relative to card center (values from -0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Update mouse position state
    setMousePosition({ x, y });
  };
  
  // Mouse enter/leave handlers
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset to center position when not hovering
    setMousePosition({ x: 0, y: 0 });
  };

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
      prize_awarded: null
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
  
  // Calculate user's current performance
  const userPerformance = useMemo(() => {
    if (!user || !effectiveParticipants.length) return null;
    
    const userParticipant = effectiveParticipants.find(p => p.wallet_address === user.wallet_address);
    return userParticipant || null;
  }, [user, effectiveParticipants]);


  // Tab definitions - hide Trade tab when logged out
  const tabs = user ? [
    { id: 'leaderboard', label: 'Leaderboard', count: effectiveParticipants.length },
    { id: 'trade', label: 'Trade', count: null },
    { id: 'activity', label: 'Activity', count: null }
  ] : [
    { id: 'leaderboard', label: 'Leaderboard', count: effectiveParticipants.length },
    { id: 'activity', label: 'Activity', count: null }
  ];
  
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

  return (
    <SilentErrorBoundary>
      <div className="min-h-screen">
        
        {/* Beautiful Header with Parallax Effect */}
        <ContestLobbyHeader
          contest={contest}
          participants={effectiveParticipants}
          mousePosition={mousePosition}
          isHovering={isHovering}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Content Section */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            
            {/* Beautiful Tab Navigation with Premium Effects */}
            <div className="mt-8 flex items-center gap-2 p-1 bg-dark-300/30 backdrop-blur-sm rounded-lg border border-dark-200">
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 group ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active tab background with gradient */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-br from-brand-500/30 to-brand-600/30 rounded-md border border-brand-500/40"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/10 to-brand-400/0 animate-data-stream-responsive" />
                    </motion.div>
                  )}
                  
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-500/0 to-brand-600/0 group-hover:from-brand-500/10 group-hover:to-brand-600/10 transition-all duration-300" />
                  
                  <span className="relative z-10">{tab.label}</span>
                  
                  {tab.count && (
                    <span className={`relative z-10 text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all ${
                      activeTab === tab.id 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-dark-400/50 text-gray-400 group-hover:bg-brand-500/20 group-hover:text-brand-300'
                    }`}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              ref={contentRef}
            >
              {/* Trade Tab */}
              {activeTab === 'trade' && (
                <div className="space-y-6">
                  {user ? (
                    <>
                      {/* 1. Your Performance Card - PIZZAZZ! */}
                      {userPerformance && (
                        <UserPerformanceCard userPerformance={{
                          rank: userPerformance.rank,
                          portfolio_value: userPerformance.portfolio_value,
                          performance_percentage: userPerformance.performance_percentage,
                          prize_awarded: userPerformance.prize_awarded || undefined
                        }} />
                      )}
                      
                      {/* 2. Under Construction Trading Panel */}
                      <UnderConstructionOverlay>
                        <div className="space-y-6">
                          <TradingPanel
                            contestId={contestIdFromParams!}
                            portfolio={portfolio}
                            onTradeComplete={refreshPortfolio}
                          />
                          
                          {/* Enhanced Portfolio Display */}
                          <EnhancedPortfolioDisplay
                            contestId={contestIdFromParams!}
                            walletAddress={user.wallet_address}
                            nickname={user.nickname || 'You'}
                          />
                        </div>
                      </UnderConstructionOverlay>
                      
                      {/* 3. Prize Structure - WAY BETTER! */}
                      <PrizeStructure
                        prizePool={parseFloat(contest.prizePool || '0')}
                        entryFee={parseFloat(contest.entryFee || '0')}
                        maxParticipants={contest.settings?.maxParticipants || 0}
                        currentParticipants={contest.participantCount || 0}
                        contestType={contest.settings?.difficulty || ''}
                      />
                      
                      {/* 4. Participants List with Live Prizes */}
                      <ParticipantsList 
                        participants={effectiveParticipants} 
                        contestStatus="live"
                        prizePool={parseFloat(contest.prizePool || '0')}
                        contestId={contestIdFromParams!}
                        onParticipantHover={setHoveredParticipant}
                        hoveredParticipant={hoveredParticipant}
                      />
                    </>
                  ) : (
                    /* Spectator Mode - Show Participants List */
                    <ParticipantsList 
                      participants={effectiveParticipants} 
                      contestStatus="live"
                      contestId={contestIdFromParams!}
                      onParticipantHover={setHoveredParticipant}
                      hoveredParticipant={hoveredParticipant}
                    />
                  )}
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  {/* Focused Participants View - New innovative interface */}
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
                    <FocusedParticipantsList 
                      participants={effectiveParticipants}
                      contestStatus="live"
                      prizePool={parseFloat(contest.prizePool || '0')}
                      contestId={contestIdFromParams!}
                    />
                  </div>
                  
                  {/* Main Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <MultiParticipantChartV2 
                        contestId={contestIdFromParams!}
                        participants={effectiveParticipants}
                        timeInterval="1h"
                        maxParticipants={effectiveParticipants.length}
                        hoveredParticipant={hoveredParticipant}
                      />
                    </div>
                    <div className="space-y-6">
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
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  {/* Contest Chat */}
                  <ContestChat contestId={contestIdFromParams!} />
                  
                  {/* Activity Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <LiveTradeActivity contestId={contestIdFromParams!} maxTrades={50} />
                    </div>
                    <div className="space-y-6">
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
                </div>
              )}


            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SilentErrorBoundary>
  );
};

export default ContestLobbyV2;