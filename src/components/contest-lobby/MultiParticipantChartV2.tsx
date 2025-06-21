import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';

interface LeaderboardChartParticipant {
  wallet_address: string;
  nickname: string;
  current_rank: number;
  history: Array<{
    timestamp: string;
    portfolio_value: number;
  }>;
}

interface MultiParticipantChartV2Props {
  contestId: string;
  participants: Array<{
    wallet_address: string;
    nickname: string;
    is_current_user?: boolean;
  }>;
  timeInterval?: '5m' | '15m' | '1h' | '4h' | '24h';
  maxParticipants?: number;
}

type ViewMode = 'absolute' | 'relative' | 'rank';

// Color palette for different participants
const PARTICIPANT_COLORS = [
  '#10b981', // green
  '#3b82f6', // blue  
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1', // indigo
];

export const MultiParticipantChartV2: React.FC<MultiParticipantChartV2Props> = ({
  contestId,
  participants,
  timeInterval = '1h',
  maxParticipants = 10
}) => {
  const { user } = useMigratedAuth();
  const [chartData, setChartData] = useState<LeaderboardChartParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('relative');
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '1d' | 'all'>('all');

  // Removed hoursBack - now calculated inline in useEffect

  // Fetch leaderboard chart data
  useEffect(() => {
    const fetchLeaderboardChart = async () => {
      if (!participants.length) return;

      setIsLoading(true);
      setError(null);

      try {
        // Map time interval to hours
        const intervalHours = {
          '5m': 1,
          '15m': 1,
          '1h': 6,
          '4h': 24,
          '24h': 24
        }[timeInterval] || 24;

        // Use portfolio analytics timeline endpoint - no auth required!
        const response = await fetch(
          `/api/portfolio-analytics/contests/${contestId}/performance/timeline?hours=${intervalHours}`,
          {
            credentials: 'same-origin' // Use session cookie
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const data = await response.json();
        console.log('[MultiParticipantChartV2] Timeline data:', data);
        
        // Transform the timeline data to match expected format
        const participantMap = new Map<string, LeaderboardChartParticipant>();
        
        // Get latest snapshot for current rankings
        const latestSnapshot = data.snapshots[data.snapshots.length - 1];
        const latestParticipants = latestSnapshot ? Object.entries(latestSnapshot.participants) : [];
        
        // Sort by value to determine ranks
        latestParticipants.sort((a, b) => (b[1] as any).value - (a[1] as any).value);
        
        // Process each participant
        latestParticipants.forEach(([walletAddress, participantData]: [string, any], index) => {
          const history = data.snapshots.map((snapshot: any) => ({
            timestamp: snapshot.timestamp,
            portfolio_value: snapshot.participants[walletAddress]?.value || 0
          }));
          
          participantMap.set(walletAddress, {
            wallet_address: walletAddress,
            nickname: participantData.username,
            current_rank: index + 1,
            history: history
          });
        });

        // Convert to array and limit to maxParticipants
        const chartParticipants = Array.from(participantMap.values())
          .slice(0, maxParticipants);
        
        console.log('[MultiParticipantChartV2] Transformed participants:', chartParticipants);
        setChartData(chartParticipants);
        
        // Auto-select current user and top 3 participants
        const autoSelected = new Set<string>();
        chartParticipants.forEach((participant, index) => {
          const isCurrentUser = participant.wallet_address === user?.wallet_address;
          if (isCurrentUser || index < 3) {
            autoSelected.add(participant.wallet_address);
          }
        });
        setSelectedParticipants(autoSelected);

      } catch (err) {
        console.error('Failed to fetch leaderboard chart:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardChart();
  }, [contestId, timeInterval, maxParticipants, user?.wallet_address, participants.length]);

  // Get initial values for relative calculations
  const initialValues = useMemo(() => {
    const values: Record<string, number> = {};
    chartData.forEach(participant => {
      if (participant.history.length > 0) {
        values[participant.wallet_address] = participant.history[0].portfolio_value;
      }
    });
    return values;
  }, [chartData]);

  // Calculate time-filtered data
  const timeFilteredData = useMemo(() => {
    if (!chartData.length) return [];
    
    const now = Date.now();
    const cutoffTime = timeRange === 'all' ? 0 : now - (
      timeRange === '1h' ? 3600000 :
      timeRange === '6h' ? 21600000 :
      86400000 // 1d
    );
    
    return chartData.map(participant => ({
      ...participant,
      history: participant.history.filter(point => 
        new Date(point.timestamp).getTime() >= cutoffTime
      )
    }));
  }, [chartData, timeRange]);

  // Combine all participant data into unified chart format
  const unifiedChartData = useMemo(() => {
    if (!timeFilteredData.length) return [];

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    timeFilteredData.forEach(participant => {
      participant.history.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });

    // Create unified data points
    return Array.from(allTimestamps)
      .sort()
      .map((timestamp, index) => {
        const dataPoint: any = { timestamp, index };
        
        // Calculate ranks at this timestamp
        const valuesAtTime: Array<{ wallet: string; value: number }> = [];
        
        timeFilteredData.forEach((participant) => {
          const point = participant.history.find(p => p.timestamp === timestamp);
          if (point) {
            valuesAtTime.push({ 
              wallet: participant.wallet_address, 
              value: point.portfolio_value 
            });
            
            // Store values based on view mode
            if (viewMode === 'absolute') {
              dataPoint[participant.wallet_address] = point.portfolio_value;
            } else if (viewMode === 'relative' && initialValues[participant.wallet_address]) {
              const percentChange = ((point.portfolio_value / initialValues[participant.wallet_address]) - 1) * 100;
              dataPoint[participant.wallet_address] = percentChange;
            }
          }
        });
        
        // Calculate ranks for rank view
        if (viewMode === 'rank') {
          valuesAtTime.sort((a, b) => b.value - a.value);
          valuesAtTime.forEach((item, rank) => {
            dataPoint[item.wallet] = rank + 1;
          });
        }

        return dataPoint;
      });
  }, [timeFilteredData, selectedParticipants, viewMode, initialValues]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    // Format based on interval
    if (timeInterval === '5m' || timeInterval === '15m') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (timeInterval === '1h' || timeInterval === '4h') {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        hour12: false
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatValue = (value: number) => {
    if (viewMode === 'relative') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    } else if (viewMode === 'rank') {
      return `#${Math.round(value)}`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get latest values for each participant
  const latestValues = useMemo(() => {
    const values: Record<string, { value: number; change: number; rank: number }> = {};
    
    if (unifiedChartData.length > 0) {
      const sortedParticipants = chartData
        .map(p => {
          const value = p.history[p.history.length - 1]?.portfolio_value || 0;
          const initialValue = initialValues[p.wallet_address] || value;
          const change = ((value / initialValue) - 1) * 100;
          return { wallet: p.wallet_address, value, change };
        })
        .sort((a, b) => b.value - a.value);
      
      sortedParticipants.forEach((p, index) => {
        values[p.wallet] = { 
          value: p.value, 
          change: p.change, 
          rank: index + 1 
        };
      });
    }
    
    return values;
  }, [chartData, unifiedChartData, initialValues]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sortedPayload = viewMode === 'rank' 
        ? payload.sort((a: any, b: any) => a.value - b.value)
        : payload.sort((a: any, b: any) => b.value - a.value);
        
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-200 rounded-lg p-4 shadow-xl">
          <p className="text-gray-300 text-sm mb-3 font-medium">{formatTimestamp(label)}</p>
          {sortedPayload.map((entry: any, index: number) => {
            const participant = chartData.find(p => p.wallet_address === entry.dataKey);
            const isCurrentUser = participant?.wallet_address === user?.wallet_address;
            const latestData = latestValues[entry.dataKey];
            const isLeader = viewMode === 'rank' ? entry.value === 1 : index === 0;
            
            return (
              <div key={entry.dataKey} className="flex items-center gap-3 py-1">
                {isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
                <div className="flex-1">
                  <p className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                    <span className="font-mono font-semibold">{formatValue(entry.value)}</span>
                    <span className="text-gray-400">
                      {participant?.nickname || entry.dataKey.slice(0, 8)}
                      {isCurrentUser && ' (You)'}
                    </span>
                  </p>
                  {viewMode === 'absolute' && latestData && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {latestData.change >= 0 ? '+' : ''}{latestData.change.toFixed(2)}% from start
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Generate performance summary - moved BEFORE conditional returns to fix hooks order
  const performanceSummary = useMemo(() => {
    if (!chartData.length || !latestValues) return null;
    
    const sortedByValue = Object.entries(latestValues)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 3);
    
    const userRank = user?.wallet_address ? latestValues[user.wallet_address]?.rank : null;
    const leader = sortedByValue[0];
    const leaderParticipant = chartData.find(p => p.wallet_address === leader[0]);
    
    return {
      leader: leaderParticipant,
      leaderValue: leader[1].value,
      leaderChange: leader[1].change,
      userRank,
      topThree: sortedByValue
    };
  }, [chartData, latestValues, user?.wallet_address]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-400">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Summary */}
      {performanceSummary && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-300/50 rounded-lg p-4 border border-dark-200"
        >
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-yellow-400 inline-flex items-center gap-1">
              <Crown className="w-4 h-4" />
              {performanceSummary.leader?.nickname || 'Leader'}
            </span>
            {' '}is leading with{' '}
            <span className="font-mono font-semibold text-white">
              ${performanceSummary.leaderValue.toLocaleString()}
            </span>
            {' '}
            <span className={`text-sm ${performanceSummary.leaderChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({performanceSummary.leaderChange >= 0 ? '+' : ''}{performanceSummary.leaderChange.toFixed(2)}%)
            </span>
            {performanceSummary.userRank && (
              <>
                {'. '}You are currently in{' '}
                <span className="font-semibold text-brand-400">
                  {performanceSummary.userRank === 1 ? '1st' : 
                   performanceSummary.userRank === 2 ? '2nd' :
                   performanceSummary.userRank === 3 ? '3rd' :
                   `${performanceSummary.userRank}th`} place
                </span>
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('absolute')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'absolute'
                ? 'bg-brand-500 text-white'
                : 'bg-dark-300 text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            Portfolio Value
          </button>
          <button
            onClick={() => setViewMode('relative')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'relative'
                ? 'bg-brand-500 text-white'
                : 'bg-dark-300 text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            % Change
          </button>
          <button
            onClick={() => setViewMode('rank')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'rank'
                ? 'bg-brand-500 text-white'
                : 'bg-dark-300 text-gray-400 hover:text-white hover:bg-dark-200'
            }`}
          >
            Rank Trend
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              timeRange === '1h'
                ? 'bg-dark-200 text-white'
                : 'bg-dark-300/50 text-gray-400 hover:text-white'
            }`}
          >
            1H
          </button>
          <button
            onClick={() => setTimeRange('6h')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              timeRange === '6h'
                ? 'bg-dark-200 text-white'
                : 'bg-dark-300/50 text-gray-400 hover:text-white'
            }`}
          >
            6H
          </button>
          <button
            onClick={() => setTimeRange('1d')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              timeRange === '1d'
                ? 'bg-dark-200 text-white'
                : 'bg-dark-300/50 text-gray-400 hover:text-white'
            }`}
          >
            1D
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              timeRange === 'all'
                ? 'bg-dark-200 text-white'
                : 'bg-dark-300/50 text-gray-400 hover:text-white'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      {/* Participant Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Select Participants</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allWallets = new Set(chartData.map(p => p.wallet_address));
                setSelectedParticipants(allWallets);
              }}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Select All
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => setSelectedParticipants(new Set())}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
        {chartData.map((participant, index) => {
          const isCurrentUser = participant.wallet_address === user?.wallet_address;
          const color = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
          
          return (
            <motion.button
              key={participant.wallet_address}
              onClick={() => {
                const newSelected = new Set(selectedParticipants);
                if (newSelected.has(participant.wallet_address)) {
                  newSelected.delete(participant.wallet_address);
                } else {
                  newSelected.add(participant.wallet_address);
                }
                setSelectedParticipants(newSelected);
              }}
              onMouseEnter={() => setHoveredParticipant(participant.wallet_address)}
              onMouseLeave={() => setHoveredParticipant(null)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-2 ${
                selectedParticipants.has(participant.wallet_address)
                  ? 'border-gray-400 bg-gray-400/20 text-white'
                  : 'border-gray-600 bg-transparent text-gray-400 hover:border-gray-400'
              } ${
                hoveredParticipant === participant.wallet_address ? 'ring-2 ring-gray-400/50' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <span 
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="flex items-center gap-1">
                #{participant.current_rank} {participant.nickname || participant.wallet_address.slice(0, 8)}
                {isCurrentUser && (
                  <span className="text-xs text-brand-400">(You)</span>
                )}
                {latestValues[participant.wallet_address] && (
                  <span className={`text-xs ${
                    latestValues[participant.wallet_address].change >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {latestValues[participant.wallet_address].change >= 0 ? 
                      <ChevronUp className="w-3 h-3 inline" /> : 
                      <ChevronDown className="w-3 h-3 inline" />
                    }
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
        </div>
      </div>

      {/* Chart */}
      <motion.div 
        className="h-96 w-full bg-dark-300/30 rounded-lg p-4 border border-dark-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unifiedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              stroke="#9CA3AF"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              fontSize={12}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Add reference line for rank view */}
            {viewMode === 'relative' && (
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            )}
            
            {/* Render lines for selected participants */}
            {chartData.map((participant, index) => {
              if (!selectedParticipants.has(participant.wallet_address)) return null;
              
              const isCurrentUser = participant.wallet_address === user?.wallet_address;
              const isHovered = hoveredParticipant === participant.wallet_address;
              const color = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
              const opacity = hoveredParticipant && !isHovered ? 0.3 : 1;
              
              return (
                <Line
                  key={participant.wallet_address}
                  type={viewMode === 'rank' ? 'stepAfter' : 'monotone'}
                  dataKey={participant.wallet_address}
                  stroke={color}
                  strokeWidth={isCurrentUser ? 3 : isHovered ? 2.5 : 2}
                  strokeOpacity={opacity}
                  dot={false}
                  activeDot={{ 
                    r: isHovered ? 6 : 4, 
                    fill: color,
                    stroke: '#1f2937',
                    strokeWidth: 2
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                  label={index === 0 ? false : false} // Disable default labels
                />
              );
            })}
            
            {/* End-of-line labels */}
            {selectedParticipants.size <= 6 && unifiedChartData.length > 0 && chartData.map((participant, index) => {
              if (!selectedParticipants.has(participant.wallet_address)) return null;
              
              const lastPoint = unifiedChartData[unifiedChartData.length - 1];
              const value = lastPoint[participant.wallet_address];
              const latestData = latestValues[participant.wallet_address];
              
              if (!value || !latestData) return null;
              
              const color = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
              const isCurrentUser = participant.wallet_address === user?.wallet_address;
              
              return (
                <g key={`label-${participant.wallet_address}`}>
                  <text
                    x="98%"
                    y={`${(latestData.rank - 1) * (80 / Math.min(selectedParticipants.size, 10)) + 20}%`}
                    fill={color}
                    fontSize={12}
                    fontWeight={isCurrentUser ? 'bold' : 'normal'}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="pointer-events-none"
                  >
                    {participant.nickname || participant.wallet_address.slice(0, 6)}
                    {isCurrentUser && ' (You)'}
                  </text>
                  <text
                    x="98%"
                    y={`${(latestData.rank - 1) * (80 / Math.min(selectedParticipants.size, 10)) + 25}%`}
                    fill={color}
                    fontSize={10}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="pointer-events-none opacity-70"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Chart Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">Active Lines</div>
          <div className="text-lg font-bold text-white">{selectedParticipants.size}</div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">Top Participants</div>
          <div className="text-lg font-bold text-white">{chartData.length}</div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">Data Points</div>
          <div className="text-lg font-bold text-white">{unifiedChartData.length}</div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">View Mode</div>
          <div className="text-lg font-bold text-white capitalize">{viewMode}</div>
        </div>
      </div>
    </div>
  );
};