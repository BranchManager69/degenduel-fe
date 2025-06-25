import { motion } from 'framer-motion';
import { Crown, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { formatCurrency } from '../../lib/utils';

interface CleanChartParticipant {
  wallet_address: string;
  nickname: string;
  current_rank: number;
  history: Array<{
    timestamp: string;
    portfolio_value: number;
  }>;
  performance_percentage: string;
  is_current_user?: boolean;
}

interface CleanChartProps {
  contestId: string;
  participants: Array<{
    wallet_address: string;
    nickname: string;
    is_current_user?: boolean;
    performance_percentage?: string;
    portfolio_value?: string;
  }>;
  maxVisible?: number; // Max lines to show (default: 5)
}

type ViewMode = 'percentage' | 'value' | 'rank';

// Refined color palette - fewer, more distinct colors
const COLORS = {
  primary: '#10b981',    // Current user - green
  leader: '#f59e0b',     // Leader - gold
  podium: ['#e5e7eb', '#cd7f32'], // 2nd: silver, 3rd: bronze
  others: ['#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444'] // Others
};

export const CleanChart: React.FC<CleanChartProps> = ({
  contestId: _contestId,
  participants = [],
  maxVisible = 5
}) => {
  const { user } = useMigratedAuth();
  const [chartData, setChartData] = useState<CleanChartParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('percentage');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '1d' | 'all'>('all');

  // Smart participant selection - always show:
  // 1. Current user (if participating)
  // 2. Top 3 performers
  // 3. Fill remaining slots with next best
  const visibleParticipants = useMemo(() => {
    if (!participants || !participants.length) return [];
    
    const sorted = [...participants].sort((a, b) => 
      parseFloat(b.performance_percentage || '0') - parseFloat(a.performance_percentage || '0')
    );
    
    const selected = new Set<string>();
    const result: typeof participants = [];
    
    // Always include current user first
    const currentUser = sorted.find(p => p.is_current_user);
    if (currentUser) {
      selected.add(currentUser.wallet_address);
      result.push(currentUser);
    }
    
    // Add top performers (avoiding duplicates)
    for (const participant of sorted) {
      if (result.length >= maxVisible) break;
      if (!selected.has(participant.wallet_address)) {
        selected.add(participant.wallet_address);
        result.push(participant);
      }
    }
    
    return result;
  }, [participants, maxVisible, user?.wallet_address]);

  // Get color for participant
  const getParticipantColor = (participant: typeof participants[0], index: number) => {
    if (participant.is_current_user) return COLORS.primary;
    
    const rank = index + 1;
    if (rank === 1) return COLORS.leader;
    if (rank === 2) return COLORS.podium[0];
    if (rank === 3) return COLORS.podium[1];
    
    return COLORS.others[(index - 3) % COLORS.others.length];
  };

  // Mock chart data (in real app, this would fetch from API)
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '1d' ? 24 : 72;
      
      return visibleParticipants.map((participant, index) => ({
        wallet_address: participant.wallet_address,
        nickname: participant.nickname,
        current_rank: index + 1,
        performance_percentage: participant.performance_percentage || '0',
        is_current_user: participant.is_current_user,
        history: Array.from({ length: hours }, (_, i) => {
          const baseValue = 10000;
          const performance = parseFloat(participant.performance_percentage || '0') / 100;
          const volatility = Math.sin(i * 0.3) * 0.02 + Math.random() * 0.01 - 0.005;
          
          return {
            timestamp: new Date(now - (hours - i - 1) * 60 * 60 * 1000).toISOString(),
            portfolio_value: baseValue * (1 + performance + volatility)
          };
        })
      }));
    };

    setIsLoading(true);
    setTimeout(() => {
      setChartData(generateMockData());
      setIsLoading(false);
    }, 500);
  }, [visibleParticipants, timeRange]);

  // Calculate chart data based on view mode
  const processedChartData = useMemo(() => {
    if (!chartData.length) return [];

    // Get all timestamps
    const timestamps = new Set<string>();
    chartData.forEach(p => p.history.forEach(h => timestamps.add(h.timestamp)));

    return Array.from(timestamps).sort().map(timestamp => {
      const point: any = { timestamp };
      
      chartData.forEach(participant => {
        const dataPoint = participant.history.find(h => h.timestamp === timestamp);
        if (dataPoint) {
          if (viewMode === 'percentage') {
            const initial = participant.history[0]?.portfolio_value || 10000;
            point[participant.wallet_address] = ((dataPoint.portfolio_value / initial) - 1) * 100;
          } else if (viewMode === 'value') {
            point[participant.wallet_address] = dataPoint.portfolio_value;
          } else {
            // Rank mode would need more complex calculation
            point[participant.wallet_address] = dataPoint.portfolio_value;
          }
        }
      });
      
      return point;
    });
  }, [chartData, viewMode]);

  // Simplified controls
  const ViewToggle = () => (
    <div className="flex items-center bg-dark-300/30 rounded-lg p-1">
      {[
        { key: 'percentage', label: '% Change', icon: TrendingUp },
        { key: 'value', label: 'Portfolio', icon: TrendingUp }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setViewMode(key as ViewMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === key
              ? 'bg-brand-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );

  const TimeToggle = () => (
    <div className="flex items-center bg-dark-300/30 rounded-lg p-1">
      {['1h', '6h', '1d', 'all'].map(period => (
        <button
          key={period}
          onClick={() => setTimeRange(period as any)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            timeRange === period
              ? 'bg-dark-200 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {period.toUpperCase()}
        </button>
      ))}
    </div>
  );

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const sorted = payload.sort((a: any, b: any) => b.value - a.value);
    
    return (
      <div className="bg-dark-400/95 backdrop-blur-sm border border-dark-200 rounded-lg p-4 shadow-2xl">
        <p className="text-gray-300 text-sm mb-3 font-medium">
          {new Date(label).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })}
        </p>
        <div className="space-y-2">
          {sorted.map((entry: any, index: number) => {
            const participant = chartData.find(p => p.wallet_address === entry.dataKey);
            const isLeader = index === 0;
            const isCurrentUser = participant?.is_current_user;
            
            return (
              <div key={entry.dataKey} className="flex items-center gap-3">
                {isLeader && <Crown className="w-4 h-4 text-yellow-400" />}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {participant?.nickname}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-brand-500 px-1.5 py-0.5 rounded-full">YOU</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: entry.color }}>
                    {viewMode === 'percentage' 
                      ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`
                      : formatCurrency(entry.value)
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Participant legend - compact
  const ParticipantLegend = () => (
    <div className="flex flex-wrap gap-2">
      {chartData.map((participant, index) => {
        const color = getParticipantColor(participant, index);
        const performance = parseFloat(participant.performance_percentage);
        
        return (
          <div
            key={participant.wallet_address}
            className="flex items-center gap-2 bg-dark-300/30 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-medium text-gray-200">
                #{participant.current_rank} {participant.nickname}
                {participant.is_current_user && (
                  <span className="ml-1 text-xs text-brand-400">(You)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {performance >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs font-medium ${
                performance >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {performance >= 0 ? '+' : ''}{performance.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

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

  return (
    <div className="space-y-6">
      {/* Clean header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Performance Chart</h3>
          <p className="text-sm text-gray-400">
            Showing {chartData.length} top performers • Updates every 30s
          </p>
        </div>
        <div className="flex gap-3">
          <ViewToggle />
          <TimeToggle />
        </div>
      </div>

      {/* Chart with better proportions */}
      <motion.div 
        className="h-80 w-full bg-dark-300/20 rounded-xl border border-dark-200/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                });
              }}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (viewMode === 'percentage') {
                  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                }
                return `$${(value / 1000).toFixed(1)}k`;
              }}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {viewMode === 'percentage' && (
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" opacity={0.8} />
            )}
            
            {chartData.map((participant, index) => {
              const color = getParticipantColor(participant, index);
              
              return (
                <Line
                  key={participant.wallet_address}
                  type="monotone"
                  dataKey={participant.wallet_address}
                  stroke={color}
                  strokeWidth={participant.is_current_user ? 3 : 2}
                  dot={false}
                  activeDot={{ 
                    r: 5, 
                    fill: color,
                    stroke: '#1f2937',
                    strokeWidth: 2
                  }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Compact participant legend */}
      <ParticipantLegend />
      
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-dark-300/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{chartData.length}</div>
          <div className="text-xs text-gray-400">Shown</div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{participants.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {chartData.filter(p => parseFloat(p.performance_percentage) > 0).length}
          </div>
          <div className="text-xs text-gray-400">Profitable</div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {timeRange.toUpperCase()}
          </div>
          <div className="text-xs text-gray-400">Period</div>
        </div>
      </div>
    </div>
  );
}; 