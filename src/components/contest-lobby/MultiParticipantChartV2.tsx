import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
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

  // Calculate hours back based on interval
  const hoursBack = useMemo(() => {
    switch (timeInterval) {
      case '5m': return 6;    // 6 hours of 5-minute data
      case '15m': return 24;  // 24 hours of 15-minute data
      case '1h': return 48;   // 48 hours of hourly data
      case '4h': return 96;   // 96 hours of 4-hour data
      case '24h': return 168; // 7 days of daily data
      default: return 24;
    }
  }, [timeInterval]);

  // Fetch leaderboard chart data
  useEffect(() => {
    const fetchLeaderboardChart = async () => {
      if (!participants.length) return;

      setIsLoading(true);
      setError(null);

      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error('Authentication required');
        }

        const response = await fetch(
          `/api/contests/${contestId}/leaderboard-chart?hours=${hoursBack}&top=${maxParticipants}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.leaderboard_chart) {
          throw new Error('Invalid response format');
        }

        // Store the chart data
        setChartData(data.leaderboard_chart.participants || []);
        
        // Auto-select current user and top 3 participants
        const autoSelected = new Set<string>();
        data.leaderboard_chart.participants.forEach((participant: LeaderboardChartParticipant, index: number) => {
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
  }, [contestId, hoursBack, maxParticipants, user?.wallet_address]);

  // Combine all participant data into unified chart format
  const unifiedChartData = useMemo(() => {
    if (!chartData.length) return [];

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    chartData.forEach(participant => {
      participant.history.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });

    // Create unified data points
    return Array.from(allTimestamps)
      .sort()
      .map(timestamp => {
        const dataPoint: any = { timestamp };
        
        chartData.forEach((participant) => {
          if (selectedParticipants.has(participant.wallet_address)) {
            const point = participant.history.find(p => p.timestamp === timestamp);
            if (point) {
              dataPoint[participant.wallet_address] = point.portfolio_value;
            }
          }
        });

        return dataPoint;
      });
  }, [chartData, selectedParticipants]);

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
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-200 rounded-lg p-3">
          <p className="text-gray-300 text-sm mb-2">{formatTimestamp(label)}</p>
          {payload
            .sort((a: any, b: any) => b.value - a.value) // Sort by value descending
            .map((entry: any) => {
              const participant = chartData.find(p => p.wallet_address === entry.dataKey);
              const isCurrentUser = participant?.wallet_address === user?.wallet_address;
              return (
                <p key={entry.dataKey} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
                  <span className="font-mono">{formatValue(entry.value)}</span>
                  <span className="text-gray-400">
                    {participant?.nickname || entry.dataKey.slice(0, 8)}
                    {isCurrentUser && ' (You)'}
                  </span>
                </p>
              );
            })}
        </div>
      );
    }
    return null;
  };

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
      {/* Participant Selection */}
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
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                selectedParticipants.has(participant.wallet_address)
                  ? 'border-gray-400 bg-gray-400/20 text-white'
                  : 'border-gray-600 bg-transparent text-gray-400 hover:border-gray-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              #{participant.current_rank} {participant.nickname || participant.wallet_address.slice(0, 8)}
              {isCurrentUser && (
                <span className="ml-1 text-xs text-brand-400">(You)</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
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
            
            {/* Render lines for selected participants */}
            {chartData.map((participant, index) => {
              if (!selectedParticipants.has(participant.wallet_address)) return null;
              
              const isCurrentUser = participant.wallet_address === user?.wallet_address;
              const color = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
              
              return (
                <Line
                  key={participant.wallet_address}
                  type="monotone"
                  dataKey={participant.wallet_address}
                  stroke={color}
                  strokeWidth={isCurrentUser ? 3 : 2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: color,
                    stroke: '#1f2937',
                    strokeWidth: 2
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

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
          <div className="text-xs text-gray-400">Time Range</div>
          <div className="text-lg font-bold text-white">{hoursBack}h</div>
        </div>
      </div>
    </div>
  );
};