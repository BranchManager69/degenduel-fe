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
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { usePortfolio } from "../../../hooks/websocket/topic-hooks/usePortfolio";
import { formatCurrency } from "../../../lib/utils";
import { ContestViewData, SearchToken } from "../../../types";
import { resetToDefaultMeta, setupContestOGMeta } from "../../../utils/ogImageUtils";

// Trading Panel Component
const TradingPanel: React.FC<{
  contestId: string;
  portfolio: any;
  onTradeComplete: () => void;
}> = ({ contestId, onTradeComplete }) => {
  const [selectedToken, setSelectedToken] = useState<SearchToken | null>(null);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [weight, setWeight] = useState<number>(10);
  const [isTrading, setIsTrading] = useState(false);

  const executeTrade = async () => {
    if (!selectedToken) return;
    
    setIsTrading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: selectedToken.id,
          type: tradeType,
          new_weight: weight
        })
      });

      if (response.ok) {
        onTradeComplete();
        setSelectedToken(null);
        setWeight(10);
      }
    } catch (error) {
      console.error('Trade failed:', error);
    } finally {
      setIsTrading(false);
    }
  };

  return (
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
  );
};

// Multi-Participant Chart Component  
const MultiParticipantChart: React.FC<{ contestId: string }> = ({ contestId }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<number>(24);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          `/api/contests/${contestId}/leaderboard-chart?hours=${timeRange}&top=10`
        );
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
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

      {chartData ? (
        <div className="h-64 bg-dark-300/30 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Chart visualization coming soon...</p>
        </div>
      ) : (
        <div className="h-64 bg-dark-300/30 rounded-lg flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

// Helper function to transform LeaderboardEntry to Participant format
const transformLeaderboardToParticipant = (entry: any): any => ({
  wallet_address: entry.wallet_address || entry.userId,
  nickname: entry.nickname || entry.username,
  profile_image_url: entry.profile_image_url || entry.profilePictureUrl,
  rank: entry.rank,
  portfolio_value: entry.portfolio_value || entry.portfolioValue,
  performance_percentage: entry.performance_percentage || entry.performancePercentage,
  prize_awarded: entry.prize_awarded || entry.prizeAwarded,
  is_current_user: entry.is_current_user || entry.isCurrentUser,
  is_ai_agent: entry.is_ai_agent || entry.isAiAgent,
  is_banned: false
});

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
  const { portfolio, refreshPortfolio } = usePortfolio(contestIdFromParams);

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
        const response = await fetch(`/api/contests/${contestId}/participants`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[ContestLobbyV2] Participants data:', data);
        
        // Transform data to match expected format
        if (data && typeof data === 'object') {
          const transformedData: ContestViewData = {
            contest: data.contest || { id: parseInt(contestId), name: 'Contest', status: 'active' },
            leaderboard: (data.participants || []).map(transformLeaderboardToParticipant),
            currentUserPerformance: data.user_data || null
          };
          
          setContestViewData(transformedData);
        }
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
                </h1>
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-400">
                    Prize Pool: <span className="text-brand-400 font-mono font-bold">
                      {formatCurrency(contest.prizePool || 0)}
                    </span>
                  </span>
                  <span className="text-gray-400">
                    Participants: <span className="text-gray-200 font-bold">
                      {participants.length}
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
                  endTime={new Date(contest.endTime || Date.now() + 3600000)}
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
                    <ParticipantsList 
                      participants={participants.slice(0, 10)} 
                      contestStatus="live"
                    />
                    {userPerformance && (
                      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Your Performance</h3>
                        <div className="space-y-2">
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