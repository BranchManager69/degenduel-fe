import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Crown } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../lib/utils';

// Detect if we're in Storybook environment
const isStorybook = typeof window !== 'undefined' && 
  (window.location.port === '6007' || window.location.port === '6006' || window.location.pathname.includes('storybook'));

// Conditional imports for hooks (only in non-Storybook environments)
let useMigratedAuth: any = null;
let useContestLobbyWebSocket: any = null;

if (!isStorybook) {
  try {
    const authModule = require('../../hooks/auth/useMigratedAuth');
    const wsModule = require('../../hooks/websocket/topic-hooks/useContestLobbyWebSocket');
    useMigratedAuth = authModule.useMigratedAuth;
    useContestLobbyWebSocket = wsModule.useContestLobbyWebSocket;
  } catch (error) {
    // Error will be logged inside component
  }
}

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
    performance_percentage?: string;
    portfolio_value?: string;
  }>;
  timeInterval?: '5m' | '15m' | '1h' | '4h' | '24h';
  maxParticipants?: number;
  hoveredParticipant?: string | null;
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
  participants = [],
  timeInterval = '1h',
  maxParticipants = 10,
  hoveredParticipant = null
}) => {
  // Use mock data in Storybook, real data in app
  const { user } = isStorybook 
    ? { user: { wallet_address: 'mock-wallet-123', nickname: 'StoryUser' } }
    : (useMigratedAuth ? useMigratedAuth() : { user: null });

  // Debug environment detection
  useEffect(() => {
    if (isStorybook) {
      //console.log('[MultiParticipantChartV2] Running in Storybook environment');
    } else if (!useMigratedAuth || !useContestLobbyWebSocket) {
      //console.log('[MultiParticipantChartV2] Running in isolated environment - some hooks not available');
    } else {
      //console.log('[MultiParticipantChartV2] Running in full app environment');
    }
  }, []);
  const [chartData, setChartData] = useState<LeaderboardChartParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('relative');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '1d' | 'all'>('all');
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [refreshKey] = useState(0);
  
  // Zoom and pan state
  const [zoomDomain, setZoomDomain] = useState<{
    x: [number, number] | null;
    y: [number, number] | null;
  }>({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Zoom helper functions
  const resetZoom = () => {
    setZoomDomain({ x: null, y: null });
  };

  const getDataBounds = () => {
    if (!unifiedChartData || !unifiedChartData.length) return null;
    
    const xMin = 0;
    const xMax = unifiedChartData.length - 1;
    
    // Calculate Y bounds based on current view mode and visible participants
    let yMin = Infinity;
    let yMax = -Infinity;
    
    unifiedChartData.forEach(point => {
      chartData.forEach(participant => {
        if (selectedParticipants.has(participant.wallet_address)) {
          const value = point[participant.wallet_address];
          if (typeof value === 'number' && !isNaN(value)) {
            yMin = Math.min(yMin, value);
            yMax = Math.max(yMax, value);
          }
        }
      });
    });
    
    // Add padding to Y bounds
    const yPadding = (yMax - yMin) * 0.1;
    
    return {
      x: [xMin, xMax] as [number, number],
      y: [yMin - yPadding, yMax + yPadding] as [number, number]
    };
  };

  // Mouse event handlers for zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const bounds = getDataBounds();
    if (!bounds) return;
    
    const currentX = zoomDomain.x || bounds.x;
    const currentY = zoomDomain.y || bounds.y;
    
    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8; // Zoom out/in
    
    // Get mouse position relative to chart
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;
    
    // Calculate new zoom bounds
    const xRange = currentX[1] - currentX[0];
    const yRange = currentY[1] - currentY[0];
    
    const newXRange = xRange * zoomFactor;
    const newYRange = yRange * zoomFactor;
    
    const xCenter = currentX[0] + xRange * mouseX;
    const yCenter = currentY[0] + yRange * (1 - mouseY); // Flip Y
    
    const newX: [number, number] = [
      Math.max(bounds.x[0], xCenter - newXRange * mouseX),
      Math.min(bounds.x[1], xCenter + newXRange * (1 - mouseX))
    ];
    
    const newY: [number, number] = [
      Math.max(bounds.y[0], yCenter - newYRange * (1 - mouseY)),
      Math.min(bounds.y[1], yCenter + newYRange * mouseY)
    ];
    
    setZoomDomain({ x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const bounds = getDataBounds();
    if (!bounds) return;
    
    const currentX = zoomDomain.x || bounds.x;
    const currentY = zoomDomain.y || bounds.y;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;
    
    const xRange = currentX[1] - currentX[0];
    const yRange = currentY[1] - currentY[0];
    
    const newX: [number, number] = [
      Math.max(bounds.x[0], currentX[0] - deltaX * xRange),
      Math.min(bounds.x[1], currentX[1] - deltaX * xRange)
    ];
    
    const newY: [number, number] = [
      Math.max(bounds.y[0], currentY[0] + deltaY * yRange),
      Math.min(bounds.y[1], currentY[1] + deltaY * yRange)
    ];
    
    setZoomDomain({ x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDoubleClick = () => {
    resetZoom();
  };

  // Reset zoom when view mode changes
  useEffect(() => {
    resetZoom();
  }, [viewMode]);

  // WebSocket disabled for now to get chart working
  useEffect(() => {
    //console.log('[MultiParticipantChartV2] contestId:', contestId, 'type:', typeof contestId);
    //console.log('[MultiParticipantChartV2] WebSocket temporarily disabled for Storybook compatibility');
  }, [contestId]);

  // Removed hoursBack - now calculated inline in useEffect

  // Fetch leaderboard chart data
  useEffect(() => {
    const fetchLeaderboardChart = async () => {
      if (!participants || !participants.length) return;

      setIsLoading(true);
      setError(null);

      try {
        // In Storybook, use mock data
        if (isStorybook) {
          //console.log('[MultiParticipantChartV2] Using mock data for Storybook');
          
          // Generate mock historical data
          const now = Date.now();
          const hours = 24;
          const chartParticipants = participants.slice(0, maxParticipants).map((p, index) => ({
            wallet_address: p.wallet_address,
            nickname: p.nickname || `Player ${index + 1}`,
            current_rank: index + 1,
            history: Array.from({ length: hours }, (_, i) => ({
              timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
              portfolio_value: 10000 + Math.sin(i * 0.5 + index) * 1000 + Math.random() * 500
            }))
          }));
          
          setChartData(chartParticipants);
          
          // Auto-select ALL participants
          const autoSelected = new Set<string>();
          chartParticipants.forEach((participant) => {
            autoSelected.add(participant.wallet_address);
          });
          setSelectedParticipants(autoSelected);
          setIsLoading(false);
          return;
        }

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
        //console.log('[MultiParticipantChartV2] Timeline data:', data);
        
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
        
        //console.log('[MultiParticipantChartV2] Transformed participants:', chartParticipants);
        setChartData(chartParticipants);
        
        // Auto-select ALL participants
        const autoSelected = new Set<string>();
        chartParticipants.forEach((participant) => {
          autoSelected.add(participant.wallet_address);
        });
        setSelectedParticipants(autoSelected);

      } catch (err) {
        //console.error('Failed to fetch leaderboard chart:', err);
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardChart();
  }, [contestId, timeInterval, maxParticipants, user?.wallet_address, participants?.length, refreshKey]);

  // Get initial values for relative calculations
  const initialValues = useMemo(() => {
    const values: Record<string, number> = {};
    if (chartData && chartData.length) {
      chartData.forEach(participant => {
        if (participant?.history?.length > 0) {
          values[participant.wallet_address] = participant.history[0].portfolio_value;
        }
      });
    }
    return values;
  }, [chartData]);

  // Calculate time-filtered data
  const timeFilteredData = useMemo(() => {
    if (!chartData || !chartData.length) return [];
    
    const now = Date.now();
    const cutoffTime = timeRange === 'all' ? 0 : now - (
      timeRange === '1h' ? 3600000 :
      timeRange === '6h' ? 21600000 :
      86400000 // 1d
    );
    
    return chartData.map(participant => ({
      ...participant,
      history: (participant?.history || []).filter(point => 
        new Date(point.timestamp).getTime() >= cutoffTime
      )
    }));
  }, [chartData, timeRange]);

  // Combine all participant data into unified chart format
  const unifiedChartData = useMemo(() => {
    if (!timeFilteredData || !timeFilteredData.length) return [];

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    timeFilteredData.forEach(participant => {
      if (participant?.history) {
        participant.history.forEach(point => {
          allTimestamps.add(point.timestamp);
        });
      }
    });

    // Create unified data points
    return Array.from(allTimestamps)
      .sort()
      .map((timestamp, index) => {
        const dataPoint: any = { timestamp, index };
        
        // Calculate ranks at this timestamp
        const valuesAtTime: Array<{ wallet: string; value: number }> = [];
        
        timeFilteredData.forEach((participant) => {
          if (participant?.history) {
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
    
    // Clean 12-hour time format for live trading
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatValue = (value: number) => {
    if (viewMode === 'relative') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    } else if (viewMode === 'rank') {
      return `#${Math.round(value)}`;
    }
    
    // Compact currency formatting for better readability
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Get latest values for each participant
  const latestValues = useMemo(() => {
    const values: Record<string, { value: number; change: number; rank: number }> = {};
    
    if (unifiedChartData && unifiedChartData.length > 0 && chartData && chartData.length > 0) {
      const sortedParticipants = chartData
        .map(p => {
          const value = p?.history?.[p.history.length - 1]?.portfolio_value || 0;
          const initialValue = initialValues[p.wallet_address] || value;
          const change = initialValue > 0 ? ((value / initialValue) - 1) * 100 : 0;
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
    if (!chartData || !chartData.length || !latestValues || !participants || !participants.length) return null;
    
    const sortedByValue = Object.entries(latestValues)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 3);
    
    if (!sortedByValue.length) return null;
    
    const userRank = user?.wallet_address ? latestValues[user.wallet_address]?.rank : null;
    const leader = sortedByValue[0];
    const leaderParticipant = chartData.find(p => p.wallet_address === leader[0]);
    
    // Find the leader in the participants array to get backend performance_percentage
    const leaderParticipantData = participants.find(p => p.wallet_address === leader[0]);
    const leaderPerformance = parseFloat(leaderParticipantData?.performance_percentage || '0');
    
    return {
      leader: leaderParticipant,
      leaderValue: parseFloat(leaderParticipantData?.portfolio_value || '0'), // Use backend-provided value
      leaderChange: leaderPerformance, // Use backend-provided percentage
      userRank,
      topThree: sortedByValue
    };
  }, [chartData, latestValues, user?.wallet_address, participants]);

  if (isLoading && !chartData.length) {
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
              {formatCurrency(performanceSummary.leaderValue)}
            </span>
            {' '}
            <span className={`text-sm ${performanceSummary.leaderChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({performanceSummary.leaderChange >= 0 ? '+' : ''}{performanceSummary.leaderChange.toFixed(2)}%)
            </span>
            {performanceSummary.userRank && (
              <>
                {'. '}You are currently in{' '}
                <span className="font-semibold text-brand-400">
                  {(() => {
                    const rank = performanceSummary.userRank;
                    const lastDigit = rank % 10;
                    const lastTwoDigits = rank % 100;
                    
                    // Special cases for 11th, 12th, 13th
                    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
                      return `${rank}th`;
                    }
                    
                    // Regular cases
                    switch (lastDigit) {
                      case 1: return `${rank}st`;
                      case 2: return `${rank}nd`;
                      case 3: return `${rank}rd`;
                      default: return `${rank}th`;
                    }
                  })()} place
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

      {/* Chart */}
      <motion.div 
        className={`h-96 w-full bg-dark-300/30 rounded-lg p-4 border border-dark-200 relative ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Zoom controls */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <button
            onClick={() => {
              const bounds = getDataBounds();
              if (!bounds) return;
              const currentX = zoomDomain.x || bounds.x;
              const currentY = zoomDomain.y || bounds.y;
              const newX: [number, number] = [
                currentX[0] + (currentX[1] - currentX[0]) * 0.1,
                currentX[1] - (currentX[1] - currentX[0]) * 0.1
              ];
              const newY: [number, number] = [
                currentY[0] + (currentY[1] - currentY[0]) * 0.1,
                currentY[1] - (currentY[1] - currentY[0]) * 0.1
              ];
              setZoomDomain({ x: newX, y: newY });
            }}
            className="w-8 h-8 bg-dark-400/80 hover:bg-dark-300/80 text-white rounded text-sm font-bold transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              const bounds = getDataBounds();
              if (!bounds) return;
              const currentX = zoomDomain.x || bounds.x;
              const currentY = zoomDomain.y || bounds.y;
              const newX: [number, number] = [
                Math.max(bounds.x[0], currentX[0] - (currentX[1] - currentX[0]) * 0.1),
                Math.min(bounds.x[1], currentX[1] + (currentX[1] - currentX[0]) * 0.1)
              ];
              const newY: [number, number] = [
                Math.max(bounds.y[0], currentY[0] - (currentY[1] - currentY[0]) * 0.1),
                Math.min(bounds.y[1], currentY[1] + (currentY[1] - currentY[0]) * 0.1)
              ];
              setZoomDomain({ x: newX, y: newY });
            }}
            className="w-8 h-8 bg-dark-400/80 hover:bg-dark-300/80 text-white rounded text-sm font-bold transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="w-8 h-8 bg-dark-400/80 hover:bg-dark-300/80 text-white rounded text-xs font-bold transition-colors"
            title="Reset Zoom"
          >
            ⌂
          </button>
        </div>

        {/* Real-time update indicator */}
        {isLoading && chartData.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Updating...
          </div>
        )}
        
        {/* Pan instructions */}
        {(zoomDomain.x || zoomDomain.y) && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-dark-400/80 px-2 py-1 rounded">
            Drag to pan • Double-click to reset
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unifiedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
            <XAxis 
              dataKey="index"
              domain={zoomDomain.x || ['dataMin', 'dataMax']}
              type="number"
              scale="linear"
              tickFormatter={(value) => {
                const dataPoint = unifiedChartData[Math.round(value)];
                return dataPoint ? formatTimestamp(dataPoint.timestamp) : '';
              }}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              domain={zoomDomain.y || ['dataMin', 'dataMax']}
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={60}
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
              
              // Hover logic: If someone is hovered, fade others. If no one hovered, show all normally
              const shouldFade = hoveredParticipant && !isHovered;
              const opacity = shouldFade ? 0.15 : 1;
              const strokeWidth = isCurrentUser ? 3 : isHovered ? 3 : 2;
              
              return (
                <Line
                  key={participant.wallet_address}
                  type={viewMode === 'rank' ? 'stepAfter' : 'monotone'}
                  dataKey={participant.wallet_address}
                  stroke={shouldFade ? '#6b7280' : color} // Gray out faded lines
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  dot={false}
                  activeDot={{ 
                    r: isHovered ? 8 : 4, 
                    fill: shouldFade ? '#6b7280' : color,
                    stroke: '#1f2937',
                    strokeWidth: 2
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
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

      {/* Participant Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-300">Select Participants</h3>
            <button
              onClick={() => setShowParticipantSelector(!showParticipantSelector)}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              {showParticipantSelector ? (
                <>Hide <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show Individual <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
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
        {showParticipantSelector && (
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
              // Hover is now controlled by parent component via ParticipantsList
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
        )}
      </div>

    </div>
  );
};