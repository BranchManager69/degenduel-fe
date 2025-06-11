/**
 * Enhanced Multi-Participant Chart
 * 
 * @description Interactive chart showing all participants' performance on one graph
 * @author BranchManager
 * @created 2025-06-11
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Components
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

// Utils
import { formatCurrency } from '../../lib/utils';

interface ChartParticipant {
  wallet_address: string;
  nickname: string;
  color: string;
  visible: boolean;
  is_current_user?: boolean;
}

interface PerformanceDataPoint {
  timestamp: string;
  [walletAddress: string]: number | string;
}

interface MultiParticipantChartProps {
  contestId: string;
  participants: any[];
  currentUserWallet?: string;
  timeInterval?: '5m' | '15m' | '1h' | '4h' | '1d';
}

// Color palette for chart lines
const CHART_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export const MultiParticipantChartV2: React.FC<MultiParticipantChartProps> = ({
  contestId,
  participants,
  currentUserWallet,
  timeInterval = '15m'
}) => {
  // State
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState(timeInterval);
  const [chartParticipants, setChartParticipants] = useState<ChartParticipant[]>([]);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  
  // Initialize chart participants with colors
  useEffect(() => {
    const topParticipants = participants.slice(0, 10).map((p, index) => ({
      wallet_address: p.wallet_address,
      nickname: p.nickname,
      color: p.wallet_address === currentUserWallet ? '#10b981' : CHART_COLORS[index % CHART_COLORS.length],
      visible: true,
      is_current_user: p.wallet_address === currentUserWallet
    }));
    
    // Always include current user if not in top 10
    if (currentUserWallet && !topParticipants.find(p => p.wallet_address === currentUserWallet)) {
      const currentUser = participants.find(p => p.wallet_address === currentUserWallet);
      if (currentUser) {
        topParticipants.push({
          wallet_address: currentUser.wallet_address,
          nickname: currentUser.nickname,
          color: '#10b981',
          visible: true,
          is_current_user: true
        });
      }
    }
    
    setChartParticipants(topParticipants);
  }, [participants, currentUserWallet]);
  
  // Fetch performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Mock data for now - replace with actual API call
        // const response = await fetch(`/api/contests/${contestId}/performance/history?interval=${selectedInterval}`);
        
        // Generate mock time series data
        const now = Date.now();
        const intervalMs = {
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '4h': 4 * 60 * 60 * 1000,
          '1d': 24 * 60 * 60 * 1000
        }[selectedInterval];
        
        const dataPoints = 50;
        const mockData: PerformanceDataPoint[] = [];
        
        for (let i = 0; i < dataPoints; i++) {
          const timestamp = new Date(now - (dataPoints - i) * intervalMs).toISOString();
          const dataPoint: PerformanceDataPoint = { timestamp };
          
          chartParticipants.forEach(participant => {
            // Generate realistic performance curves
            const basePerformance = 1000;
            const volatility = Math.random() * 0.02;
            const trend = participant.is_current_user ? 0.002 : (Math.random() - 0.5) * 0.001;
            const previousValue = i === 0 ? basePerformance : (mockData[i - 1]?.[participant.wallet_address] as number || basePerformance);
            
            dataPoint[participant.wallet_address] = previousValue * (1 + trend + (Math.random() - 0.5) * volatility);
          });
          
          mockData.push(dataPoint);
        }
        
        setPerformanceData(mockData);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (chartParticipants.length > 0) {
      fetchPerformanceData();
    }
  }, [contestId, selectedInterval, chartParticipants]);
  
  // Toggle participant visibility
  const toggleParticipant = (walletAddress: string) => {
    setChartParticipants(prev => prev.map(p => 
      p.wallet_address === walletAddress ? { ...p, visible: !p.visible } : p
    ));
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const timestamp = new Date(label);
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-400 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-400 mb-2">
            {timestamp.toLocaleString()}
          </p>
          {payload
            .sort((a: any, b: any) => b.value - a.value)
            .map((entry: any) => {
              const participant = chartParticipants.find(p => p.wallet_address === entry.dataKey);
              if (!participant || !participant.visible) return null;
              
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-300">{participant.nickname}</span>
                  </span>
                  <span className="font-mono font-medium text-gray-100">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              );
            })}
        </div>
      );
    }
    return null;
  };
  
  // Format Y-axis
  const formatYAxis = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };
  
  // Format X-axis
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (selectedInterval === '5m' || selectedInterval === '15m') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (selectedInterval === '1h' || selectedInterval === '4h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-6">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-6">
        <div className="text-center text-red-400">{error}</div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-100">Performance Comparison</h2>
          
          {/* Time Interval Selector */}
          <div className="flex gap-1">
            {(['5m', '15m', '1h', '4h', '1d'] as const).map(interval => (
              <Button
                key={interval}
                size="sm"
                variant={selectedInterval === interval ? 'primary' : 'ghost'}
                onClick={() => setSelectedInterval(interval)}
                className="px-3 py-1"
              >
                {interval}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={performanceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#9CA3AF"
                tickFormatter={formatXAxis}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={formatYAxis}
                domain={['dataMin - 50', 'dataMax + 50']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={1000} stroke="#6B7280" strokeDasharray="3 3" />
              
              {chartParticipants.map(participant => (
                participant.visible && (
                  <Line
                    key={participant.wallet_address}
                    type="monotone"
                    dataKey={participant.wallet_address}
                    stroke={participant.color}
                    strokeWidth={participant.is_current_user || hoveredLine === participant.wallet_address ? 3 : 2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    onMouseEnter={() => setHoveredLine(participant.wallet_address)}
                    onMouseLeave={() => setHoveredLine(null)}
                    opacity={hoveredLine && hoveredLine !== participant.wallet_address ? 0.3 : 1}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {chartParticipants.map(participant => (
            <motion.button
              key={participant.wallet_address}
              onClick={() => toggleParticipant(participant.wallet_address)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                participant.visible 
                  ? 'bg-dark-300/50 hover:bg-dark-300/70' 
                  : 'bg-dark-400/30 opacity-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: participant.visible ? participant.color : '#4B5563' }}
              />
              <span className="text-sm text-gray-300 truncate">
                {participant.nickname}
              </span>
              {participant.is_current_user && (
                <Badge variant="success" className="ml-auto text-xs">You</Badge>
              )}
            </motion.button>
          ))}
        </div>
        
        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t border-dark-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Participants Shown</div>
              <div className="text-gray-200 font-medium">
                {chartParticipants.filter(p => p.visible).length} / {chartParticipants.length}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Time Range</div>
              <div className="text-gray-200 font-medium">
                {performanceData.length > 0 && (
                  <>
                    {new Date(performanceData[0].timestamp).toLocaleTimeString()} - 
                    {new Date(performanceData[performanceData.length - 1].timestamp).toLocaleTimeString()}
                  </>
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Your Rank</div>
              <div className="text-gray-200 font-medium">
                {participants.findIndex(p => p.wallet_address === currentUserWallet) + 1} / {participants.length}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Data Points</div>
              <div className="text-gray-200 font-medium">{performanceData.length}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};