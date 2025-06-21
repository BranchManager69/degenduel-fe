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
import {
  //Link, 
  useParams
} from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { TokenSearchFixed } from "../../../components/common/TokenSearchFixed";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { EnhancedPortfolioDisplay } from "../../../components/contest-lobby/EnhancedPortfolioDisplay";
import { Leaderboard } from "../../../components/contest-lobby/Leaderboard";
import { LiveTradeActivity } from "../../../components/contest-lobby/LiveTradeActivity";
import { MultiParticipantChartV2 } from "../../../components/contest-lobby/MultiParticipantChartV2";
//import { ShareContestButton } from "../../../components/contest-lobby/ShareContestButton";
import { ContestLobbyHeader } from "../../../components/contest-lobby/ContestLobbyHeader";
import { ContestStatsCard } from "../../../components/contest-lobby/ContestStatsCard";
import { PrizeDistributionCard } from "../../../components/contest-lobby/PrizeDistributionCard";
import { ReferralProgressCard } from "../../../components/contest-lobby/ReferralProgressCard";
import { UserPerformanceCard } from "../../../components/contest-lobby/UserPerformanceCard";
import { UserPositionCard } from "../../../components/contest-lobby/UserPositionCard";
import { Button } from "../../../components/ui/Button";
import { useWebSocket } from "../../../contexts/UnifiedWebSocketContext";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
// Removed usePortfolio - implementing manual portfolio fetching
import { useToast } from "../../../components/toast";
import { formatCurrency } from "../../../lib/utils";
import { ContestViewData, SearchToken } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Trading Panel Component
const TradingPanel: React.FC<{
  contestId: string;
  portfolio: any;
  onTradeComplete: () => void;
}> = ({ contestId, portfolio, onTradeComplete }) => {
  const { user } = useMigratedAuth();
  const toast = useToast();
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
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('dd_token');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Use the portfolio trades endpoint from backend docs
      const response = await fetch(`/api/portfolio/${contestId}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
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
        toast.success(`${tradeType} ${selectedToken.symbol} - ${weight}% of portfolio`);
        
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
      toast.error(error instanceof Error ? error.message : 'Trade failed');
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
              {portfolio.tokens.map((token: any) => (
                <div key={token.token_id || token.address} className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg">
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
                    <div className="font-medium text-gray-100">{token.weight}%</div>
                    <div className="text-xs text-gray-400">
                      Value: {formatCurrency(parseFloat(token.current_value || '0'))}
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

  const [contestViewData, setContestViewData] = useState<ContestViewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'trade' | 'chart' | 'leaderboard' | 'activity' | 'chat'>('trade');
  const [unreadMessages] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Mouse position tracking for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // WebSocket hooks
  const { contestViewData: wsUpdatedData } = useContestViewUpdates(contestIdFromParams || null, contestViewData);
  const { participants } = useContestParticipants(contestIdFromParams ? parseInt(contestIdFromParams) : null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [_portfolioLoading, setPortfolioLoading] = useState(false);
  
  // Fetch portfolio data
  const fetchPortfolio = useCallback(async () => {
    if (!contestIdFromParams || !user?.wallet_address) {
      console.log('[ContestLobbyV2] Cannot fetch portfolio - missing data:', {
        contestId: contestIdFromParams,
        userWallet: user?.wallet_address
      });
      return;
    }
    
    setPortfolioLoading(true);
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('dd_token');
      if (!authToken) {
        console.error('[ContestLobbyV2] No auth token found');
        return;
      }
      
      const response = await fetch(
        `/api/contests/${contestIdFromParams}/portfolio/${user.wallet_address}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ContestLobbyV2] Portfolio data fetched:', data);
        setPortfolio(data);
      } else {
        console.error('[ContestLobbyV2] Portfolio fetch failed:', response.status, response.statusText);
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
        // Use the lightweight /live endpoint that includes contest details
        const response = await fetch(`/api/contests/${contestId}/live`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[ContestLobbyV2] Contest live data:', data);
        
        // The /live endpoint returns data in the expected ContestViewData format
        const viewData: ContestViewData = {
          contest: data.contest,
          leaderboard: data.leaderboard || [],
          currentUserPerformance: data.leaderboard?.find((entry: any) => 
            entry.wallet_address === user?.wallet_address || entry.userId === user?.wallet_address
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

  // Get WebSocket instance
  const ws = useWebSocket();

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (!contestIdFromParams || !ws.isConnected) return;

    // Subscribe to relevant topics from the WebSocket inventory
    const subscribeToTopics = () => {
      // These topics are from the WebSocket inventory document
      ws.subscribe(['contest', 'contest-participants', 'portfolio', 'market_data']);
    };

    // Handle trade executed events (from WebSocket inventory line 266)
    const handleTradeExecuted = (message: any) => {
      if (message.contestId === parseInt(contestIdFromParams)) {
        console.log('[ContestLobbyV2] Trade executed:', message);
        // Refresh portfolio after trade
        refreshPortfolio();
      }
    };

    // Handle portfolio updates (from WebSocket inventory line 264)
    const handlePortfolioUpdate = (message: any) => {
      console.log('[ContestLobbyV2] Portfolio updated:', message);
      refreshPortfolio();
    };

    // Handle contest activity (from WebSocket inventory line 90)
    const handleContestActivity = (message: any) => {
      if (message.contestId === parseInt(contestIdFromParams)) {
        console.log('[ContestLobbyV2] Contest activity:', message);
        // Refresh contest view data
        const fetchData = async () => {
          setIsLoading(true);
          try {
            const response = await fetch(`/api/contests/${contestIdFromParams}/live`);
            if (response.ok) {
              const data = await response.json();
              const viewData: ContestViewData = {
                contest: data.contest,
                leaderboard: data.leaderboard || [],
                currentUserPerformance: data.leaderboard?.find((entry: any) => 
                  entry.wallet_address === user?.wallet_address
                ) || null
              };
              setContestViewData(viewData);
            }
          } catch (err) {
            console.error('[ContestLobbyV2] Error refreshing contest data:', err);
          } finally {
            setIsLoading(false);
          }
        };
        fetchData();
      }
    };

    // Register listeners for specific message types from the WebSocket inventory
    const unregisterTrade = ws.registerListener(
      `contest-trade-${contestIdFromParams}`,
      ['DATA'] as any[],
      (message) => {
        // Check for TRADE_EXECUTED messages
        if (message.type === 'TRADE_EXECUTED' || (message.type === 'DATA' && message.subtype === 'TRADE_EXECUTED')) {
          handleTradeExecuted(message);
        }
      },
      ['contest', 'portfolio']
    );

    const unregisterPortfolio = ws.registerListener(
      `contest-portfolio-${contestIdFromParams}`,
      ['DATA'] as any[],
      (message) => {
        // Check for PORTFOLIO_UPDATED messages
        if (message.type === 'PORTFOLIO_UPDATED' || (message.type === 'DATA' && message.subtype === 'PORTFOLIO_UPDATED')) {
          handlePortfolioUpdate(message);
        }
      },
      ['portfolio']
    );

    const unregisterContest = ws.registerListener(
      `contest-activity-${contestIdFromParams}`,
      ['DATA'] as any[],
      (message) => {
        // Check for contest activity
        if (message.type === 'CONTEST_ACTIVITY' || (message.type === 'DATA' && message.data?.type === 'CONTEST_ACTIVITY')) {
          handleContestActivity(message.data || message);
        }
      },
      ['contest']
    );

    // Subscribe to topics
    subscribeToTopics();

    // Cleanup
    return () => {
      unregisterTrade();
      unregisterPortfolio();
      unregisterContest();
    };
  }, [contestIdFromParams, ws.isConnected, ws.subscribe, ws.registerListener, refreshPortfolio, user?.wallet_address]);

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

  // Calculate user's current performance
  const userPerformance = useMemo(() => {
    if (!user || !participants.length) return null;
    
    const userParticipant = participants.find(p => p.wallet_address === user.wallet_address);
    return userParticipant || null;
  }, [user, participants]);


  // Tab definitions
  const tabs = [
    { id: 'trade', label: 'Trade', count: null },
    { id: 'chart', label: 'Multi-Chart', count: null },
    { id: 'leaderboard', label: 'Leaderboard', count: participants.length },
    { id: 'activity', label: 'Activity', count: null },
    { id: 'chat', label: 'Chat', count: unreadMessages > 0 ? unreadMessages : null }
  ];

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
      <div className="min-h-screen bg-dark-100">
        {/* Debug Test Button */}
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => {
              console.log('[DEBUG] Test button clicked!');
              alert('Button works! Check console for debug info.');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            TEST CLICK
          </button>
        </div>
        
        {/* Beautiful Header with Parallax Effect */}
        <ContestLobbyHeader
          contest={contest}
          participants={participants}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TradingPanel
                      contestId={contestIdFromParams!}
                      portfolio={portfolio}
                      onTradeComplete={refreshPortfolio}
                    />
                    
                    {/* Enhanced Portfolio Display */}
                    {user && (
                      <div className="mt-6">
                        <EnhancedPortfolioDisplay
                          contestId={contestIdFromParams!}
                          walletAddress={user.wallet_address}
                          nickname={user.nickname || 'You'}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    {/* Prize Distribution Card */}
                    <PrizeDistributionCard prizePool={contest.prizePool || '0'} />
                    
                    {/* Contest Stats Card */}
                    <ContestStatsCard contest={contest} participants={participants} />
                    
                    {/* Referral Progress Card */}
                    <ReferralProgressCard className="mb-6" />
                    
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
                    
                    {userPerformance && (
                      <UserPerformanceCard userPerformance={{
                        rank: userPerformance.rank,
                        portfolio_value: userPerformance.portfolio_value,
                        performance_percentage: userPerformance.performance_percentage,
                        prize_awarded: userPerformance.prize_awarded || undefined
                      }} />
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Chart Tab */}
              {activeTab === 'chart' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <MultiParticipantChartV2 
                      contestId={contestIdFromParams!}
                      participants={participants}
                      timeInterval="1h"
                      maxParticipants={10}
                    />
                  </div>
                  <div>
                    <Leaderboard 
                      entries={participants.map((p, index) => ({
                        rank: p.rank || index + 1,
                        username: p.nickname || `Player ${index + 1}`,
                        profilePictureUrl: p.profile_image_url || null,
                        performancePercentage: p.performance_percentage || '0',
                        portfolioValue: p.portfolio_value || '0',
                        isCurrentUser: user?.wallet_address === p.wallet_address,
                        isAiAgent: p.is_ai_agent || false
                      }))}
                      showSparklines={true}
                      className="h-full"
                    />
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Leaderboard 
                      entries={participants.map((p, index) => ({
                        rank: p.rank || index + 1,
                        username: p.nickname || `Player ${index + 1}`,
                        profilePictureUrl: p.profile_image_url || null,
                        performancePercentage: p.performance_percentage || '0',
                        portfolioValue: p.portfolio_value || '0',
                        isCurrentUser: user?.wallet_address === p.wallet_address,
                        isAiAgent: p.is_ai_agent || false
                      }))}
                      showSparklines={true}
                      className="h-full"
                    />
                  </div>
                  <div className="space-y-6">
                    {userPerformance && (
                      <UserPositionCard 
                        rank={userPerformance.rank}
                        performancePercentage={userPerformance.performance_percentage}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <LiveTradeActivity contestId={contestIdFromParams!} maxTrades={50} />
                  </div>
                  <div className="space-y-6">
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <ContestChat contestId={contestIdFromParams!} />
                  </div>
                  <div>
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
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