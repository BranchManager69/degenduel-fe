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

if (!isStorybook) {
  try {
    const authModule = require('../../hooks/auth/useMigratedAuth');
    useMigratedAuth = authModule.useMigratedAuth;
  } catch (error) {
    // Silently fail - component will use fallback auth
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
  contestStatus?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants: Array<{
    wallet_address: string;
    nickname: string;
    is_current_user?: boolean;
    performance_percentage?: string;
    portfolio_value?: string;
    equipped_skin?: {
      id: string;
      name: string;
      rarity: 'basic' | 'rare' | 'special' | 'admin';
      design: {
        color?: string;
        gradient?: string[];
        pattern?: string;
        width?: number;
        glow?: boolean;
        animation?: string;
        image?: string;
        opacity?: number;
      };
    } | null;
    line_design?: {
      color?: string;
      gradient?: string[];
      pattern?: string;
      width?: number;
      glow?: boolean;
      animation?: string;
      image?: string;
      opacity?: number;
    } | null;
  }>;
  timeInterval?: '5m' | '15m' | '1h' | '4h' | '24h';
  maxParticipants?: number;
  hoveredParticipant?: string | null;
}



// Color palette for different participants (fallback when no custom design)
// These match the BASIC tier skins from the skin system
const PARTICIPANT_COLORS = [
  '#FF4444', // Classic Red
  '#4A90E2', // Ocean Blue
  '#47D147', // Money Green
  '#2C2C2C', // Shadow
  '#CCCCCC', // Ghost (with opacity consideration)
  '#FF4444', // Classic Red (repeat for more participants)
  '#4A90E2', // Ocean Blue (repeat)
  '#47D147', // Money Green (repeat)
  '#2C2C2C', // Shadow (repeat)
  '#CCCCCC', // Ghost (repeat)
];

// Get line style based on participant's equipped skin or legacy line_design
const getLineStyle = (participant: any, index: number, shouldFade: boolean) => {
  const defaultColor = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  
  // Priority system: equipped_skin > line_design > default
  const lineDesign = participant.equipped_skin?.design || participant.line_design;
  
  if (!lineDesign) {
    // Apply basic skin properties to match the skin system
    const isGhostColor = defaultColor === '#CCCCCC';
    return {
      stroke: shouldFade ? '#6b7280' : defaultColor,
      strokeWidth: 2,
      strokeDasharray: undefined,
      filter: undefined,
      className: undefined,
      strokeOpacity: isGhostColor ? 0.7 : 1, // Ghost skin has 0.7 opacity
    };
  }
  
  // Base styles - handle gradient
  let strokeColor;
  if (shouldFade) {
    strokeColor = '#6b7280';
  } else if (lineDesign.gradient && lineDesign.gradient.length >= 2) {
    strokeColor = `url(#gradient-${participant.wallet_address})`;
  } else {
    strokeColor = lineDesign.color || defaultColor;
  }
  
  const styles: any = {
    stroke: strokeColor,
    strokeWidth: lineDesign.width || 2,
    strokeOpacity: lineDesign.opacity || 1,
  };
  
  // Pattern support
  if (lineDesign.pattern === 'dashed') {
    styles.strokeDasharray = '8 4';
  } else if (lineDesign.pattern === 'dotted') {
    styles.strokeDasharray = '2 2';
  } else if (lineDesign.pattern === 'wave') {
    styles.strokeDasharray = '10 5 5 5';
  } else if (lineDesign.pattern === 'matrix') {
    styles.strokeDasharray = '4 2 1 2';
    styles.className = 'matrix-line';
  } else if (lineDesign.pattern === 'lightning') {
    styles.strokeDasharray = '15 5 5 5 10 5';
    styles.className = 'lightning-line';
  } else if (lineDesign.pattern === 'crown') {
    styles.strokeDasharray = '10 2 2 2 10';
    styles.className = 'crown-line';
  } else if (lineDesign.pattern === 'code') {
    styles.strokeDasharray = '8 3 3 3 8 3';
    styles.className = 'code-line';
  }
  
  // Glow effect - enhanced for special skins
  if (lineDesign.glow && !shouldFade) {
    const glowIntensity = lineDesign.width >= 4 ? '12px' : '8px';
    styles.filter = `drop-shadow(0 0 ${glowIntensity} currentColor)`;
  }
  
  // Animation classes
  if (lineDesign.animation && !shouldFade) {
    styles.className = (styles.className || '') + ' ' + `animate-${lineDesign.animation}`;
  }
  
  return styles;
};

export const MultiParticipantChartV2: React.FC<MultiParticipantChartV2Props> = ({
  contestId,
  contestStatus = 'active',
  participants = [],
  timeInterval = '1h',
  maxParticipants = 10,
  hoveredParticipant = null
}) => {
  // Use mock data in Storybook, real data in app
  const { user } = isStorybook 
    ? { user: { wallet_address: 'mock-wallet-123', nickname: 'StoryUser' } }
    : (useMigratedAuth ? useMigratedAuth() : { user: null });

  // Helper function to auto-select all participants
  const autoSelectAllParticipants = (participants: LeaderboardChartParticipant[]) => {
    const selected = new Set<string>();
    participants.forEach(p => selected.add(p.wallet_address));
    setSelectedParticipants(selected);
  };


  const [chartData, setChartData] = useState<LeaderboardChartParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Fetch leaderboard chart data
  useEffect(() => {
    const fetchLeaderboardChart = async () => {
      if (!participants || !participants.length) return;
      
      // Don't fetch data for upcoming or cancelled contests
      if (contestStatus === 'upcoming' || contestStatus === 'cancelled') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // In Storybook, use mock data
        if (isStorybook) {
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
          autoSelectAllParticipants(chartParticipants);
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
        
        setChartData(chartParticipants);
        autoSelectAllParticipants(chartParticipants);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardChart();
  }, [contestId, contestStatus, timeInterval, maxParticipants, user?.wallet_address, participants?.length]);

  // Auto-refresh chart data every 30 seconds
  useEffect(() => {
    // Only set up auto-refresh for active or completed contests
    if (contestStatus !== 'active' && contestStatus !== 'completed') {
      return;
    }

    console.log('[MultiParticipantChartV2] Setting up 30-second auto-refresh');
    
    // Initial fetch has already happened from the effect above
    // Set up interval for subsequent fetches
    const refreshInterval = setInterval(() => {
      console.log('[MultiParticipantChartV2] Auto-refreshing chart data...');
      
      const fetchUpdatedData = async () => {
        if (!participants || !participants.length) return;
        
        setIsAutoRefreshing(true);
        
        try {
          const intervalHours = {
            '5m': 1,
            '15m': 1,
            '1h': 6,
            '4h': 24,
            '24h': 24
          }[timeInterval] || 24;

          const response = await fetch(
            `/api/portfolio-analytics/contests/${contestId}/performance/timeline?hours=${intervalHours}`,
            {
              credentials: 'same-origin'
            }
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch chart data: ${response.status}`);
          }

          const data = await response.json();
          
          // Transform the timeline data
          const participantMap = new Map<string, LeaderboardChartParticipant>();
          const latestSnapshot = data.snapshots[data.snapshots.length - 1];
          const latestParticipants = latestSnapshot ? Object.entries(latestSnapshot.participants) : [];
          
          latestParticipants.sort((a, b) => (b[1] as any).value - (a[1] as any).value);
          
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

          const chartParticipants = Array.from(participantMap.values())
            .slice(0, maxParticipants);
          
          setChartData(chartParticipants);
          // Don't auto-select on refresh to preserve user's selection
          if (selectedParticipants.size === 0) {
            autoSelectAllParticipants(chartParticipants);
          }
        } catch (err) {
          console.error('[MultiParticipantChartV2] Auto-refresh failed:', err);
          // Don't update error state on auto-refresh failures to avoid disrupting the UI
        } finally {
          setIsAutoRefreshing(false);
        }
      };
      
      fetchUpdatedData();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => {
      console.log('[MultiParticipantChartV2] Clearing auto-refresh interval');
      clearInterval(refreshInterval);
    };
  }, [contestId, contestStatus, timeInterval, maxParticipants, participants?.length, selectedParticipants.size]);

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

  // Use all chart data (no time filtering)
  const timeFilteredData = useMemo(() => {
    return chartData || [];
  }, [chartData]);

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
              
              // Always use relative (percentage change) mode
              if (initialValues[participant.wallet_address]) {
                const percentChange = ((point.portfolio_value / initialValues[participant.wallet_address]) - 1) * 100;
                dataPoint[participant.wallet_address] = percentChange;
              }
            }
          }
        });
        
        // Note: Only using percentage change mode, no rank calculation needed

        return dataPoint;
      });
  }, [timeFilteredData, selectedParticipants, initialValues]);

  // Calculate contest duration and smart tick settings
  const contestDurationInfo = useMemo(() => {
    if (!unifiedChartData || unifiedChartData.length < 2) {
      return { durationMinutes: 60, tickCount: 6, tickInterval: 1, explicitTicks: [] };
    }
    
    const firstTimestamp = new Date(unifiedChartData[0].timestamp).getTime();
    const lastTimestamp = new Date(unifiedChartData[unifiedChartData.length - 1].timestamp).getTime();
    const durationMinutes = (lastTimestamp - firstTimestamp) / (1000 * 60);
    
    // Smart tick settings based on contest duration
    let tickCount, tickInterval;
    
    if (durationMinutes <= 5) {
      // 5-minute contest: one tick every minute (6 ticks)
      tickCount = 6;
      tickInterval = 1;
    } else if (durationMinutes <= 15) {
      // 15-minute contest: every 3-4 minutes (5 ticks)
      tickCount = 5;
      tickInterval = 3;
    } else if (durationMinutes <= 30) {
      // 30-minute contest: every 5 minutes (7 ticks)
      tickCount = 7;
      tickInterval = 5;
    } else if (durationMinutes <= 60) {
      // 1-hour contest: every 10 minutes (7 ticks)
      tickCount = 7;
      tickInterval = 10;
    } else {
      // 3-hour contest: every 30 minutes (7 ticks)
      tickCount = 7;
      tickInterval = 30;
    }
    
    // Generate explicit tick positions based on minute boundaries for short contests
    const explicitTicks: number[] = [];
    
    if (durationMinutes <= 5) {
      // For 5-minute contests, find data points closest to each minute boundary
      const startTime = new Date(unifiedChartData[0].timestamp).getTime();
      
      // Always include start
      explicitTicks.push(0);
      
      // Find points closest to each minute boundary
      for (let minute = 1; minute < Math.ceil(durationMinutes); minute++) {
        const targetTime = startTime + (minute * 60 * 1000);
        let closestIndex = 0;
        let closestDiff = Infinity;
        
        unifiedChartData.forEach((point, index) => {
          const pointTime = new Date(point.timestamp).getTime();
          const diff = Math.abs(pointTime - targetTime);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = index;
          }
        });
        
        explicitTicks.push(closestIndex);
      }
      
      // Always include end
      explicitTicks.push(unifiedChartData.length - 1);
      
      // Remove duplicates and sort
      const uniqueTicks = [...new Set(explicitTicks)].sort((a, b) => a - b);
      return { durationMinutes, tickCount: uniqueTicks.length, tickInterval, explicitTicks: uniqueTicks };
    } else {
      // For longer contests, use evenly spaced ticks
      const totalDataPoints = unifiedChartData.length;
      
      // Always include start (0)
      explicitTicks.push(0);
      
      // Add middle ticks evenly spaced
      for (let i = 1; i < tickCount - 1; i++) {
        const position = Math.round((i / (tickCount - 1)) * (totalDataPoints - 1));
        explicitTicks.push(position);
      }
      
      // Always include end (last index)
      if (totalDataPoints > 1) {
        explicitTicks.push(totalDataPoints - 1);
      }
    }
    
    return { durationMinutes, tickCount, tickInterval, explicitTicks };
  }, [unifiedChartData]);

  const formatTimestamp = (timestamp: string, index?: number) => {
    const date = new Date(timestamp);
    const { durationMinutes } = contestDurationInfo;
    
    // Special labels for start and end
    if (index === 0 && unifiedChartData.length > 1) {
      return 'Start';
    }
    if (index === unifiedChartData.length - 1 && unifiedChartData.length > 1) {
      return 'Now';
    }
    
    // For very short contests, use compact format
    if (durationMinutes <= 5) {
      // Ultra compact for 5-minute contests: just "14:30" or "2:42"
      const hours = date.getHours(); // No padding for hours
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else {
      // All other contests: clean AM/PM format without seconds
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      return `${hours}:${minutes} ${ampm}`;
    }
  };

  // Calculate smart Y-axis range (zero-centered for game context)
  const yAxisInfo = useMemo(() => {
    if (!unifiedChartData || !unifiedChartData.length || !selectedParticipants.size) {
      return { domain: [-5, 5], tickInterval: 1, precision: 1 };
    }
    
    // Find min/max values from all selected participants
    let minValue = 0;
    let maxValue = 0;
    
    unifiedChartData.forEach(point => {
      selectedParticipants.forEach(walletAddress => {
        const value = point[walletAddress];
        if (typeof value === 'number' && !isNaN(value)) {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });
    
    // Get maximum absolute value for symmetric range around 0%
    const maxAbsValue = Math.max(Math.abs(minValue), Math.abs(maxValue));
    
    // Apply smart minimum range (never too tight)
    const minimumRange = 1; // At least ±1%
    const dataRange = Math.max(maxAbsValue, minimumRange);
    
    // Add padding (20% of range) but keep it meaningful
    const padding = Math.max(dataRange * 0.2, 0.5);
    const finalRange = dataRange + padding;
    
    // Smart grid spacing based on range
    let tickInterval, precision;
    if (finalRange <= 2) {
      tickInterval = 0.5;
      precision = 1;
    } else if (finalRange <= 5) {
      tickInterval = 1;
      precision = 1;
    } else if (finalRange <= 15) {
      tickInterval = 2;
      precision = 1;
    } else if (finalRange <= 30) {
      tickInterval = 5;
      precision = 0;
    } else {
      tickInterval = 10;
      precision = 0;
    }
    
    return {
      domain: [-finalRange, finalRange],
      tickInterval,
      precision
    };
  }, [unifiedChartData, selectedParticipants]);

  const formatValue = (value: number) => {
    // Adaptive precision based on Y-axis range
    const precision = yAxisInfo.precision;
    return `${value >= 0 ? '+' : ''}${value.toFixed(precision)}%`;
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
      // Sort by percentage change (highest to lowest)
      const sortedPayload = payload.sort((a: any, b: any) => b.value - a.value);
        
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-200 rounded-lg p-4 shadow-xl">
          <p className="text-gray-300 text-sm mb-3 font-medium">{formatTimestamp(label)}</p>
          {sortedPayload.map((entry: any, index: number) => {
            const participant = chartData.find(p => p.wallet_address === entry.dataKey);
            const isCurrentUser = participant?.wallet_address === user?.wallet_address;
            const isLeader = index === 0; // Top performer at this timestamp
            
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

      {/* Chart Title */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-300">
          {contestStatus === 'upcoming' ? 'Performance Preview' :
           contestStatus === 'completed' ? 'Final Performance' :
           contestStatus === 'cancelled' ? 'Contest Cancelled' :
           'Performance Timeline'}
        </h3>
        <span className="text-xs text-gray-500">% Change from Start</span>
        {contestDurationInfo.durationMinutes > 0 && (
          <span className="text-xs text-gray-600">
            • {contestDurationInfo.durationMinutes < 60 
              ? `${Math.round(contestDurationInfo.durationMinutes)}m` 
              : `${Math.round(contestDurationInfo.durationMinutes / 60 * 10) / 10}h`
            } contest
          </span>
        )}
        {/* Status indicator */}
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          contestStatus === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
          contestStatus === 'active' ? 'bg-green-500/20 text-green-400' :
          contestStatus === 'completed' ? 'bg-gray-500/20 text-gray-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {contestStatus === 'upcoming' ? 'Upcoming' :
           contestStatus === 'active' ? 'Live' :
           contestStatus === 'completed' ? 'Finished' :
           'Cancelled'}
        </span>
      </div>

      {/* Chart */}
      <motion.div 
        className={`h-96 w-full rounded-lg p-4 border relative ${
          contestStatus === 'cancelled' ? 'bg-red-500/10 border-red-500/30' :
          contestStatus === 'upcoming' ? 'bg-blue-500/10 border-blue-500/30' :
          contestStatus === 'completed' ? 'bg-gray-500/10 border-gray-500/30' :
          'bg-dark-300/30 border-dark-200'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Contest State Overlays */}
        {contestStatus === 'upcoming' && (
          <div className="absolute inset-0 bg-dark-400/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-4xl mb-3">⏳</div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Contest Starting Soon</h3>
              <p className="text-sm text-gray-400">Performance data will appear once the contest begins</p>
            </div>
          </div>
        )}
        
        {contestStatus === 'cancelled' && (
          <div className="absolute inset-0 bg-dark-400/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-4xl mb-3">❌</div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Contest Cancelled</h3>
              <p className="text-sm text-gray-400">This contest has been cancelled and no data is available</p>
            </div>
          </div>
        )}

        {/* Real-time update indicator with auto-refresh status */}
        {(contestStatus === 'active' || contestStatus === 'completed') && (
          <div className="absolute top-2 right-2 flex items-center gap-3 text-xs text-gray-400 z-10">
            {/* Auto-refresh indicator */}
            {isAutoRefreshing ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span>Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>
                  {contestStatus === 'active' ? 'Live' : 'Final'} • Auto-refresh: 30s
                </span>
              </div>
            )}
            
            {/* Manual refresh button */}
            <button
              onClick={() => {
                console.log('[MultiParticipantChartV2] Manual refresh triggered');
                if (isAutoRefreshing) return; // Prevent multiple simultaneous refreshes
                
                setIsAutoRefreshing(true);
                
                const manualRefresh = async () => {
                  try {
                    const intervalHours = {
                      '5m': 1,
                      '15m': 1,
                      '1h': 6,
                      '4h': 24,
                      '24h': 24
                    }[timeInterval] || 24;

                    const response = await fetch(
                      `/api/portfolio-analytics/contests/${contestId}/performance/timeline?hours=${intervalHours}`,
                      { credentials: 'same-origin' }
                    );
                    
                    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

                    const data = await response.json();
                    const participantMap = new Map<string, LeaderboardChartParticipant>();
                    const latestSnapshot = data.snapshots[data.snapshots.length - 1];
                    const latestParticipants = latestSnapshot ? Object.entries(latestSnapshot.participants) : [];
                    
                    latestParticipants.sort((a, b) => (b[1] as any).value - (a[1] as any).value);
                    
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

                    const chartParticipants = Array.from(participantMap.values()).slice(0, maxParticipants);
                    setChartData(chartParticipants);
                    if (selectedParticipants.size === 0) {
                      autoSelectAllParticipants(chartParticipants);
                    }
                  } catch (err) {
                    console.error('[MultiParticipantChartV2] Manual refresh failed:', err);
                  } finally {
                    setIsAutoRefreshing(false);
                  }
                };
                
                manualRefresh();
              }}
              className={`p-1 rounded transition-colors ${isAutoRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dark-200'}`}
              disabled={isAutoRefreshing}
              title="Refresh now"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unifiedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {/* SVG Definitions for gradients */}
            <defs>
              {participants.map((participant) => {
                // Priority system: equipped_skin > line_design > none
                const lineDesign = participant.equipped_skin?.design || participant.line_design;
                if (lineDesign?.gradient && lineDesign.gradient.length >= 2) {
                  return (
                    <linearGradient key={participant.wallet_address} id={`gradient-${participant.wallet_address}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      {lineDesign.gradient!.map((color, i) => (
                        <stop 
                          key={i} 
                          offset={`${(i / (lineDesign.gradient!.length - 1)) * 100}%`} 
                          stopColor={color} 
                        />
                      ))}
                    </linearGradient>
                  );
                }
                return null;
              })}
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
              horizontalPoints={(() => {
                // Generate horizontal grid lines at meaningful intervals
                const points = [];
                const [min, max] = yAxisInfo.domain;
                for (let i = Math.ceil(min / yAxisInfo.tickInterval) * yAxisInfo.tickInterval; i <= max; i += yAxisInfo.tickInterval) {
                  if (i !== 0) points.push(i); // Skip 0% since we have special line
                }
                return points;
              })()}
            />
            <XAxis 
              dataKey="index"
              domain={['dataMin', 'dataMax']}
              type="number"
              scale="linear"
              ticks={contestDurationInfo.explicitTicks}
              tickFormatter={(value) => {
                const index = Math.round(value);
                const dataPoint = unifiedChartData[index];
                return dataPoint ? formatTimestamp(dataPoint.timestamp, index) : '';
              }}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              minTickGap={contestDurationInfo.durationMinutes <= 5 ? 50 : 30}
            />
            <YAxis 
              domain={yAxisInfo.domain}
              tickFormatter={formatValue}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={65}
              interval={0}
              tickCount={Math.ceil((yAxisInfo.domain[1] - yAxisInfo.domain[0]) / yAxisInfo.tickInterval) + 1}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Zero line - where everyone starts */}
            <ReferenceLine 
              y={0} 
              stroke="#6b7280" 
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            
            {/* Render lines for selected participants */}
            {chartData.map((participant, index) => {
              if (!selectedParticipants.has(participant.wallet_address)) return null;
              
              // Find the original participant data with line_design
              const originalParticipant = participants.find(p => p.wallet_address === participant.wallet_address);
              
              const isCurrentUser = participant.wallet_address === user?.wallet_address;
              const isHovered = hoveredParticipant === participant.wallet_address;
              
              // Hover logic: If someone is hovered, fade others. If no one hovered, show all normally
              const shouldFade = !!(hoveredParticipant && !isHovered);
              
              // Get custom line styles
              const lineStyles = getLineStyle(originalParticipant || participant, index, shouldFade);
              
              // Override stroke width for current user or hovered
              if (isCurrentUser || isHovered) {
                lineStyles.strokeWidth = Math.max(lineStyles.strokeWidth, 3);
              }
              
              return (
                <Line
                  key={participant.wallet_address}
                  type="monotone"
                  dataKey={participant.wallet_address}
                  {...lineStyles}
                  strokeOpacity={shouldFade ? 0.15 : lineStyles.strokeOpacity}
                  dot={false}
                  activeDot={{ 
                    r: isHovered ? 8 : 4, 
                    fill: shouldFade ? '#6b7280' : lineStyles.stroke,
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
              
              // Find the original participant data with line_design
              const originalParticipant = participants.find(p => p.wallet_address === participant.wallet_address);
              const lineStyles = getLineStyle(originalParticipant || participant, index, false);
              const color = lineStyles.stroke;
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

      {/* Performance Summary - Now at the bottom */}
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

    </div>
  );
};