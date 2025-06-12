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
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { TokenSearchFixed } from "../../../components/common/TokenSearchFixed";
import { ContestChat } from "../../../components/contest-chat/ContestChat";
import { ParticipantsList } from "../../../components/contest-detail/ParticipantsList";
import { ContestTimer } from "../../../components/contest-lobby/ContestTimer";
import { LiveTradeActivity } from "../../../components/contest-lobby/LiveTradeActivity";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useContestParticipants } from "../../../hooks/websocket/topic-hooks/useContestParticipants";
import { useContestViewUpdates } from "../../../hooks/websocket/topic-hooks/useContestViewUpdates";
import { useWebSocket } from "../../../contexts/UnifiedWebSocketContext";
// Removed usePortfolio - implementing manual portfolio fetching
import { formatCurrency } from "../../../lib/utils";
import { ContestViewData, SearchToken } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";
import { useToast } from "../../../components/toast";

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

  // Log portfolio data to debug
  useEffect(() => {
    console.log('[TradingPanel] Portfolio prop received:', portfolio);
  }, [portfolio]);

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
          onSelectToken={setSelectedToken}
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
                onClick={() => setTradeType('BUY')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setTradeType('SELL')}
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

// Multi-Participant Chart Component  
const MultiParticipantChart: React.FC<{ contestId: string }> = ({ contestId }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<number>(24);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('dd_token');
        const headers: HeadersInit = {};
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(
          `/api/contests/${contestId}/leaderboard-chart?hours=${timeRange}&top=10`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        }
      } catch (error) {
        console.error('[MultiParticipantChart] Failed to fetch chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [contestId, timeRange]);

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Performance Chart</h3>
        <div className="flex gap-2">
          {[24, 48, 168].map((hours) => (
            <button
              key={hours}
              onClick={() => setTimeRange(hours)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === hours
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
              }`}
            >
              {hours === 24 ? '1D' : hours === 48 ? '2D' : '1W'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-dark-300/30 rounded-lg flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      ) : chartData ? (
        <div className="h-64 bg-dark-300/30 rounded-lg p-4">
          {chartData.data && chartData.data.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                Top {chartData.data.length} Participants Performance
              </div>
              {/* Simple performance bars */}
              {chartData.data.slice(0, 5).map((participant: any, index: number) => (
                <div key={participant.wallet} className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-400 truncate">
                    {participant.nickname || `Player ${index + 1}`}
                  </div>
                  <div className="flex-1 bg-dark-400 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-brand-500'
                      }`}
                      style={{ width: `${Math.max(10, (parseFloat(participant.performance) + 100) / 2)}%` }}
                    >
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-100">
                        {participant.performance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-2">
                Chart updates every 5 minutes
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No performance data yet</p>
          )}
        </div>
      ) : (
        <div className="h-64 bg-dark-300/30 rounded-lg flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
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
      ws.subscribe(['contest', 'contest-participants', 'portfolio', 'market-data']);
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
        {/* Header */}
        <div className="bg-dark-200/50 backdrop-blur-sm border-b border-dark-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Link to="/" className="hover:text-brand-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <Link to="/contests" className="hover:text-brand-400 transition-colors">Contests</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-300">{contest.name}</span>
            </div>
            
            {/* Contest Info */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                  {contest.name}
                  <Badge 
                    variant={contest.status === 'active' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {contest.status === 'active' ? 'LIVE' : contest.status.toUpperCase()}
                  </Badge>
                  {(contest as any).contest_code && (
                    <span className="text-xs text-gray-500 font-mono">
                      {(contest as any).contest_code}
                    </span>
                  )}
                </h1>
                
                {contest.description && (
                  <p className="text-sm text-gray-400 mt-1">{contest.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-400">
                    Prize Pool: <span className="text-brand-400 font-mono font-bold">
                      {formatCurrency(contest.prizePool || 0)}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    Entry Fee: <span className="text-gray-200 font-mono">
                      {formatCurrency(contest.entryFee || 0)}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    Participants: <span className="text-gray-200 font-bold">
                      {participants.length}
                      {contest.settings?.maxParticipants && (
                        <span className="text-gray-500">/{contest.settings.maxParticipants}</span>
                      )}
                    </span>
                  </span>
                  {userPerformance && (
                    <span className="text-gray-400">
                      Your Rank: <span className={`font-bold ${
                        userPerformance.rank && userPerformance.rank <= 3 ? 'text-yellow-400' : 'text-gray-200'
                      }`}>
                        #{userPerformance.rank || 'N/A'}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Timer */}
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">
                  {contest.status === 'active' ? 'Ends In' : 'Starts In'}
                </div>
                <ContestTimer 
                  endTime={new Date(
                    contest.status === 'active' 
                      ? (contest.endTime || Date.now() + 3600000)
                      : (contest.startTime || Date.now() + 3600000)
                  )}
                  showDate={false}
                />
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="mt-4 flex items-center gap-1">
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-dark-300/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.label}
                  {tab.count && (
                    <span className="ml-1 bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                  </div>
                  <div className="space-y-6">
                    {/* Prize Distribution Card */}
                    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Prize Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-400 flex items-center gap-1">
                            <span className="text-lg">🥇</span> 1st Place
                          </span>
                          <span className="font-mono font-bold text-yellow-400">
                            {formatCurrency(parseFloat(contest.prizePool || '0') * 0.5)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 flex items-center gap-1">
                            <span className="text-lg">🥈</span> 2nd Place
                          </span>
                          <span className="font-mono font-bold text-gray-300">
                            {formatCurrency(parseFloat(contest.prizePool || '0') * 0.3)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-orange-600 flex items-center gap-1">
                            <span className="text-lg">🥉</span> 3rd Place
                          </span>
                          <span className="font-mono font-bold text-orange-600">
                            {formatCurrency(parseFloat(contest.prizePool || '0') * 0.2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contest Stats Card */}
                    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
                      <h3 className="text-sm font-medium text-gray-400 mb-3">Contest Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Volume</span>
                          <span className="font-mono text-gray-200">
                            {formatCurrency(participants.length * parseFloat(contest.entryFee || '0'))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Performance</span>
                          <span className="font-mono text-gray-200">
                            {participants.length > 0 
                              ? (participants.reduce((acc, p) => acc + parseFloat(p.performance_percentage || '0'), 0) / participants.length).toFixed(2)
                              : '0.00'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration</span>
                          <span className="font-mono text-gray-200">
                            {contest.endTime && contest.startTime 
                              ? Math.round((new Date(contest.endTime).getTime() - new Date(contest.startTime).getTime()) / 3600000) + 'h'
                              : 'N/A'}
                          </span>
                        </div>
                        {contest.settings?.tokenTypesAllowed && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Allowed Tokens</span>
                            <span className="text-gray-200">
                              {contest.settings.tokenTypesAllowed.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
                    
                    {userPerformance && (
                      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Your Performance</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rank</span>
                            <span className={`font-mono font-bold ${
                              userPerformance.rank && userPerformance.rank <= 3 ? 'text-yellow-400' : 'text-gray-200'
                            }`}>
                              #{userPerformance.rank || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Portfolio Value</span>
                            <span className="font-mono font-bold text-gray-200">
                              {formatCurrency(parseFloat(userPerformance.portfolio_value || '0'))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">P&L</span>
                            <span className={`font-mono font-bold ${
                              parseFloat(userPerformance.performance_percentage || '0') >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              {userPerformance.performance_percentage || '0'}%
                            </span>
                          </div>
                          {userPerformance.prize_awarded && parseFloat(userPerformance.prize_awarded) > 0 && (
                            <div className="flex justify-between pt-2 border-t border-dark-300">
                              <span className="text-gray-400">Prize Won</span>
                              <span className="font-mono font-bold text-yellow-400">
                                {formatCurrency(parseFloat(userPerformance.prize_awarded))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Chart Tab */}
              {activeTab === 'chart' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <MultiParticipantChart contestId={contestIdFromParams!} />
                  </div>
                  <div>
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ParticipantsList 
                      participants={participants} 
                      contestStatus="live"
                    />
                  </div>
                  <div className="space-y-6">
                    {userPerformance && (
                      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Your Position</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-brand-400">
                            #{userPerformance.rank || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Current Rank</div>
                        </div>
                      </div>
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