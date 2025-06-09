import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  timestamp: string;
  portfolio_value: string;
  rank_at_time?: number;
}

interface ParticipantChartData {
  wallet_address: string;
  nickname: string;
  data: ChartDataPoint[];
  color: string;
  is_current_user?: boolean;
}

interface MultiParticipantChartProps {
  contestId: string;
  participants: Array<{
    wallet_address: string;
    nickname: string;
    is_current_user?: boolean;
  }>;
  timeInterval?: '5m' | '15m' | '1h' | '4h' | '1d';
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

export const MultiParticipantChart: React.FC<MultiParticipantChartProps> = ({
  contestId,
  participants,
  timeInterval = '15m'
}) => {
  const [chartData, setChartData] = useState<ParticipantChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  // Fetch chart data for all participants
  useEffect(() => {
    const fetchAllChartData = async () => {
      if (!participants.length) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch chart data for each participant
        const promises = participants.map(async (participant, index) => {
          const response = await fetch(
            `/api/contests/${contestId}/portfolio/${participant.wallet_address}/chart?interval=${timeInterval}`
          );
          
          if (!response.ok) {
            console.warn(`Failed to fetch chart for ${participant.nickname}: ${response.status}`);
            return null;
          }

          const data = await response.json();
          
          return {
            wallet_address: participant.wallet_address,
            nickname: participant.nickname,
            data: data.chart_data || [],
            color: PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length],
            is_current_user: participant.is_current_user
          };
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(result => result !== null) as ParticipantChartData[];
        
        setChartData(validResults);
        
        // Auto-select current user and top 3 participants
        const autoSelected = new Set<string>();
        validResults.forEach((participant, index) => {
          if (participant.is_current_user || index < 3) {
            autoSelected.add(participant.wallet_address);
          }
        });
        setSelectedParticipants(autoSelected);

      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllChartData();
  }, [contestId, participants, timeInterval]);

  // Combine all participant data into unified chart format
  const unifiedChartData = useMemo(() => {
    if (!chartData.length) return [];

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    chartData.forEach(participant => {
      participant.data.forEach(point => {
        allTimestamps.add(point.timestamp);
      });
    });

    // Create unified data points
    return Array.from(allTimestamps)
      .sort()
      .map(timestamp => {
        const dataPoint: any = { timestamp };
        
        chartData.forEach(participant => {
          if (selectedParticipants.has(participant.wallet_address)) {
            const point = participant.data.find(p => p.timestamp === timestamp);
            if (point) {
              dataPoint[participant.wallet_address] = parseFloat(point.portfolio_value);
            }
          }
        });

        return dataPoint;
      });
  }, [chartData, selectedParticipants]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatValue = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-200 rounded-lg p-3">
          <p className="text-gray-300 text-sm mb-2">{formatTimestamp(label)}</p>
          {payload.map((entry: any) => {
            const participant = chartData.find(p => p.wallet_address === entry.dataKey);
            return (
              <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
                {participant?.nickname}: {formatValue(entry.value)}
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
        <div className="text-gray-400">Loading performance data...</div>
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
    <div className="space-y-4">
      {/* Participant Selection */}
      <div className="flex flex-wrap gap-2">
        {chartData.map((participant) => (
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
              style={{ backgroundColor: participant.color }}
            />
            {participant.nickname}
            {participant.is_current_user && (
              <span className="ml-1 text-xs text-brand-400">(You)</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unifiedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTimestamp}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Render lines for selected participants */}
            {chartData.map((participant) => {
              if (!selectedParticipants.has(participant.wallet_address)) return null;
              
              return (
                <Line
                  key={participant.wallet_address}
                  type="monotone"
                  dataKey={participant.wallet_address}
                  stroke={participant.color}
                  strokeWidth={participant.is_current_user ? 3 : 2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: participant.color,
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
          <div className="text-xs text-gray-400">Total Participants</div>
          <div className="text-lg font-bold text-white">{chartData.length}</div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">Data Points</div>
          <div className="text-lg font-bold text-white">{unifiedChartData.length}</div>
        </div>
        <div className="bg-dark-300/50 rounded-lg p-3">
          <div className="text-xs text-gray-400">Interval</div>
          <div className="text-lg font-bold text-white">{timeInterval}</div>
        </div>
      </div>
    </div>
  );
};