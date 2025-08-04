// src/components/DuelSnapshotTable.tsx

/**
 * DUEL Snapshot Table Component
 * 
 * @description Table component for displaying DUEL token daily snapshots
 * Shows Date, DUEL Balance, Dividend %, and Total Supply in a clean table format
 * 
 * @author BranchManager69
 * @created 2025-07-24
 * 
 * ⚠️ IMPORTANT TIMEZONE HACK WARNING ⚠️
 * Due to timezone calculation issues between API UTC timestamps and browser local time,
 * there's a +1 day offset applied in formatDate() function (line ~107).
 * This ensures dates display correctly as July 30th instead of July 29th, etc.
 * Without this hack, all dates appear one day earlier than they should.
 * 
 * TODO: Fix the root timezone calculation issues in extrapolation logic
 * and remove this band-aid solution.
 */

import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import NanoLogo from './logo/NanoLogo';
import { useIndividualToken } from '../hooks/websocket/topic-hooks/useIndividualToken';

interface BalanceDataPoint {
  id: number;
  balance_lamports: string;
  balance_duel: number;
  timestamp: string;
  total_registered_supply?: number;
  dividend_percentage?: number;
  daily_contest_revenue?: number;
  isExtrapolated?: boolean;
  dividend_status?: 'pending' | 'completed' | 'failed';
  dividend_amount_sol?: number;
  dividend_paid_at?: string;
  dividend_transaction?: {
    id: number;
    amount_sol: number;
    status: string;
    created_at: string;
    processed_at: string;
    tx_signature: string;
  };
}

interface UserData {
  nickname: string;
  username: string;
  role: string;
  experience_points: number;
  profile_image_url?: string;
  user_level?: {
    level_number: number;
    title: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  balances: BalanceDataPoint[];
  wallet: UserData;
}

interface DuelSnapshotTableProps {
  className?: string;
  demoMode?: boolean;
}

export const DuelSnapshotTable: React.FC<DuelSnapshotTableProps> = ({
  className = '',
  demoMode = false,
}) => {
  const [tableData, setTableData] = useState<BalanceDataPoint[]>([]);
  const [, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedTotalRevenue, setAnimatedTotalRevenue] = useState(0);
  const [animatedTotalDividends, setAnimatedTotalDividends] = useState(0);
  const [animatedTotalEarnings, setAnimatedTotalEarnings] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // Demo mode simulator state
  const [simulatorExpanded, setSimulatorExpanded] = useState(false);
  const [contestsPerDay, setContestsPerDay] = useState(6);
  const [avgEntryFee, setAvgEntryFee] = useState(0.25);
  const [avgParticipants, setAvgParticipants] = useState(50);
  const [demoHoldingsMillions, setDemoHoldingsMillions] = useState(10.0); // 10.0M DUEL default
  
  // Mobile tab state
  const [activeTab, setActiveTab] = useState<'platform' | 'holdings' | 'earnings'>('platform');
  
  // Auto-retry state  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Countdown timer state - must be declared before any conditional returns
  const [timeUntilNextDividend, setTimeUntilNextDividend] = useState('');
  
  // Get SOL price
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const { token: solToken } = useIndividualToken(SOL_ADDRESS);
  const solPrice = solToken?.price || 0;
  
  // Convert millions to actual holdings (0 means use real balance for logged-in users)
  const demoHoldings = demoHoldingsMillions === 0 && !demoMode ? 0 : demoHoldingsMillions * 1000000;
  
  // Calculate simulated daily revenue
  const simulatedDailyRevenue = contestsPerDay * avgEntryFee * avgParticipants;

  // Format date nicely (e.g., "Jul 23, 2025")
  const formatDate = (timestamp: string, mobile: boolean = false): string => {
    const date = new Date(timestamp);
    // HACK: Add 1 day to fix timezone offset issue
    date.setDate(date.getDate() + 1);
    if (mobile) {
      // Mobile format: short date without year
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric'
      });
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle click on date with transaction signature
  const handleDateClick = (txSignature: string) => {
    window.open(`https://solscan.io/tx/${txSignature}`, '_blank');
  };

  // Format large numbers (e.g., 31.7M for balance)
  const formatNumber = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toLocaleString();
    }
  };

  // Format percentage (e.g., 20.67%)
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Format USD value with K/M suffixes
  const formatUsdValue = (usdValue: number): string => {
    if (usdValue < 0.01) return usdValue.toFixed(4);
    if (usdValue >= 1000000) return `${(usdValue / 1000000).toFixed(1)}M`;
    if (usdValue >= 1000) return `${(usdValue / 1000).toFixed(1)}K`;
    if (usdValue >= 10) return usdValue.toFixed(0);
    return usdValue.toFixed(2);
  };

  // Format SOL amount (returns JSX element)
  const formatSolAmount = (amount: number, isItalic: boolean = false, isBold: boolean = false, txSignature?: string, showUsd: boolean = false, maxDecimals: number = 6) => {
    if (amount === null || amount === undefined || amount === 0) {
      return <span className={`${isItalic ? 'italic' : ''} text-gray-500`}>–</span>;
    }
    
    // Format with up to specified decimals, removing trailing zeros
    const formatted = amount.toFixed(maxDecimals).replace(/\.?0+$/, '');
    const usdValue = amount * solPrice;
    
    const content = (
      <div className="flex items-center justify-center gap-1">
        <img 
          src="/assets/media/logos/solana.svg" 
          alt="SOL" 
          className="w-3 h-3"
        />
        <span className={`${isItalic ? 'italic' : ''} ${isBold ? 'font-bold' : ''} text-white`}>
          {formatted}
        </span>
        {showUsd && (
          <span className="text-[10px] text-green-400/60">
            {solPrice > 0 ? (
              `$${formatUsdValue(usdValue)}`
            ) : (
              <span className="w-1.5 h-1.5 bg-green-400/40 rounded-full animate-pulse"></span>
            )}
          </span>
        )}
        {txSignature && (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
    );
    
    if (txSignature) {
      return (
        <button
          onClick={() => handleDateClick(txSignature)}
          className="hover:opacity-80 transition-opacity cursor-pointer"
          title="View transaction on Solscan"
        >
          {content}
        </button>
      );
    }
    
    return content;
  };

  // Generate extrapolated data for missing days
  const generateExtrapolatedData = (actualData: BalanceDataPoint[], currentBalance?: number): BalanceDataPoint[] => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    if (actualData.length === 0) {
      // If no actual data, just create today's extrapolated row
      return [{
        id: 9999,
        balance_lamports: ((currentBalance || 31814255) * 1000000).toString(),
        balance_duel: currentBalance || 31814255,
        timestamp: today.toISOString(),
        total_registered_supply: 150000000,
        dividend_percentage: ((currentBalance || 31814255) / 150000000) * 100,
        isExtrapolated: true
      }];
    }

    // Sort actual data by timestamp (newest first)
    const sortedActualData = [...actualData].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const mostRecentData = sortedActualData[0];
    const mostRecentDate = new Date(mostRecentData.timestamp);
    mostRecentDate.setUTCHours(0, 0, 0, 0);
    
    // Check if we already have today's data
    const todayUTC = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const hasToday = sortedActualData.some(data => data.timestamp === todayUTC);
    
    const extrapolatedRows: BalanceDataPoint[] = [];
    
    // If we already have today's data, don't generate any extrapolated data
    if (hasToday) {
      return extrapolatedRows;
    }
    
    // Calculate days between most recent data and today
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate extrapolated rows for each missing day including today
    for (let i = daysDiff; i >= 1; i--) {
      const missingDate = new Date(mostRecentDate);
      missingDate.setUTCDate(mostRecentDate.getUTCDate() + (daysDiff - i + 1));
      missingDate.setUTCHours(0, 0, 0, 0);
      
      extrapolatedRows.push({
        ...mostRecentData,
        id: 9999 - i, // Unique IDs for extrapolated data
        balance_duel: currentBalance !== undefined ? currentBalance : mostRecentData.balance_duel,
        balance_lamports: ((currentBalance !== undefined ? currentBalance : mostRecentData.balance_duel) * 1000000).toString(),
        timestamp: missingDate.toISOString(),
        isExtrapolated: true,
        // Remove dividend data from extrapolated rows
        dividend_status: undefined,
        dividend_amount_sol: undefined,
        dividend_paid_at: undefined,
        dividend_transaction: undefined
      });
    }
    
    return extrapolatedRows;
  };

  // Generate fallback demo data
  const generateDemoData = (): BalanceDataPoint[] => {
    const now = new Date();
    const demoData: BalanceDataPoint[] = [];
    
    // Generate 7 days of demo data
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const balance = 31814255 - (i * 100000) + Math.random() * 50000;
      const totalSupply = 134134959;
      const percentage = (balance / totalSupply) * 100;
      const dailyRevenue = i === 0 ? 0 : (Math.random() * 10 + 5); // 5-15 SOL for past days, 0 for today
      
      demoData.push({
        id: 1000 + i,
        balance_lamports: (balance * 1000000).toString(),
        balance_duel: balance,
        timestamp: date.toISOString(),
        total_registered_supply: totalSupply,
        dividend_percentage: parseFloat(percentage.toFixed(2)),
        daily_contest_revenue: dailyRevenue,
        isExtrapolated: i === 0, // Today is extrapolated
        dividend_status: i > 0 ? 'completed' : undefined,
        dividend_amount_sol: i > 0 ? (dailyRevenue * 0.1 * percentage / 100) : undefined,
        dividend_paid_at: i > 0 ? date.toISOString() : undefined,
        dividend_transaction: i > 0 ? {
          id: 1000 + i,
          amount_sol: dailyRevenue * 0.1 * percentage / 100,
          status: 'completed',
          created_at: date.toISOString(),
          processed_at: date.toISOString(),
          tx_signature: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'
        } : undefined
      });
    }
    
    return demoData;
  };

  // Fetch snapshot data
  const fetchSnapshotData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If in demo mode, fetch from public endpoint
      if (demoMode) {
        const response = await axios.get('/api/duel-token-balances');
        
        if (response.data && response.data.success) {
          const { platform_revenue, statistics } = response.data.data;
          
          // Use the user-configured demo holdings
          const demoBalance = demoHoldings;
          
          // Convert platform revenue data to our format
          const demoSnapshots: BalanceDataPoint[] = platform_revenue.daily_history.map((day: any, index: number) => {
            const percentage = (demoBalance / statistics.total_supply_tracked) * 100;
            
            return {
              id: 1000 + index,
              balance_lamports: (demoBalance * 1000000).toString(),
              balance_duel: demoBalance,
              timestamp: day.timestamp,
              total_registered_supply: statistics.total_supply_tracked,
              dividend_percentage: parseFloat(percentage.toFixed(2)),
              daily_contest_revenue: day.daily_contest_revenue,
              isExtrapolated: false
            };
          });
          
          // Generate extrapolated data for missing days (including today)
          const extrapolatedData = generateExtrapolatedData(demoSnapshots, demoBalance);
          
          // Combine actual and extrapolated data, sort newest first
          const allData = [...extrapolatedData, ...demoSnapshots];
          allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setTableData(allData);
        } else {
          throw new Error('Failed to fetch demo data');
        }
        return;
      }
      
      const params = {
        view: 'snapshot',
        timeframe: 'all',
        limit: 1000
      };
      
      const response = await axios.get('/api/user/duel-balance-history', { params });
      
      if (response.data && response.data.success) {
        const data: ApiResponse = response.data;
        
        // Mark actual data as not extrapolated
        const actualData = data.balances.map(balance => ({
          ...balance,
          isExtrapolated: false
        }));
        
        // Force inject today's row
        const todayUTC = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
        const todayRow = {
          id: 9999,
          balance_lamports: (actualData[0].balance_duel * 1000000).toString(),
          balance_duel: actualData[0].balance_duel,
          timestamp: todayUTC,
          total_registered_supply: actualData[0].total_registered_supply,
          dividend_percentage: actualData[0].dividend_percentage,
          daily_contest_revenue: 0,
          isExtrapolated: true,
          dividend_status: undefined,
          dividend_amount_sol: undefined,
          dividend_paid_at: undefined,
          dividend_transaction: undefined
        };
        
        // Combine today + actual data, sort newest first
        const allData = [todayRow, ...actualData];
        allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTableData(allData);
        setUserData(data.wallet);
        
        // Clear error on success
        setError(null);
        
        // Clear any pending retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else {
        throw new Error('Failed to fetch snapshot data');
      }
    } catch (err: any) {
      console.error('Error fetching DUEL snapshot data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load snapshot data';
      
      // Check if it's a 502 error and auto-retry silently
      if (err?.response?.status === 502 || errorMessage.includes('502')) {
        
        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        // Set up auto-retry after 5 seconds - silently
        retryTimeoutRef.current = setTimeout(() => {
          fetchSnapshotData();
        }, 5000);
        
        // Don't set error or change loading state for 502s
        return;
      }
      
      // For demo mode, provide fallback data if API fails
      if (demoMode) {
        const fallbackData = generateDemoData();
        setTableData(fallbackData);
        setError(null);
        setIsLoading(false);
        return;
      } else {
        // Only set error for non-502 errors
        setError(errorMessage);
      }
    } finally {
      // Only set loading false if not a 502 error
      if (!error || !error.includes('502')) {
        setIsLoading(false);
      }
    }
  };

  // Fetch data when component mounts or demo mode changes
  useEffect(() => {
    fetchSnapshotData();
    
    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [demoMode]);

  // Countdown timer effect - must be before any conditional returns
  useEffect(() => {
    const getNextDividendDate = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      
      // Set to next midnight UTC (daily dividends)
      nextMidnight.setUTCDate(now.getUTCDate() + 1);
      nextMidnight.setUTCHours(0, 0, 0, 0);
      
      return nextMidnight;
    };

    const updateCountdown = () => {
      const now = new Date();
      const nextDividend = getNextDividendDate();
      const diff = nextDividend.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilNextDividend('Processing...');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeUntilNextDividend(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeUntilNextDividend(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);

  // Animate totals when table data changes
  useEffect(() => {
    if (tableData.length === 0) return;

    // Calculate final values
    const finalRevenue = tableData.reduce((sum, snapshot) => {
      // Use simulated revenue for demo mode or when simulator is active
      const revenue = (demoMode || (!demoMode && simulatorExpanded)) 
        ? simulatedDailyRevenue 
        : (snapshot.daily_contest_revenue || 0);
      return sum + revenue;
    }, 0);
    
    const finalDividends = finalRevenue * 0.1;
    
    const finalEarnings = tableData.reduce((sum, snapshot) => {
      const revenue = (demoMode || (!demoMode && simulatorExpanded)) 
        ? simulatedDailyRevenue 
        : (snapshot.daily_contest_revenue || 0);
      const totalDividendsForDay = revenue * 0.1;
      
      // Calculate dividend percentage based on effective balance (override or actual)
      const effectiveBalance = (!demoMode && simulatorExpanded && demoHoldings > 0) ? demoHoldings : snapshot.balance_duel;
      const percentage = (snapshot.total_registered_supply || 0) > 0 
        ? (effectiveBalance / (snapshot.total_registered_supply || 1)) * 100 
        : 0;
      const myDividendForDay = totalDividendsForDay * (percentage / 100);
      return sum + myDividendForDay;
    }, 0);

    // Animation settings
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();
    const startRevenue = 0;
    const startDividends = 0;
    const startEarnings = 0;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Round based on mode - no decimals for demo, 2 decimals for regular
      const currentRevenue = startRevenue + (finalRevenue - startRevenue) * eased;
      const currentDividends = startDividends + (finalDividends - startDividends) * eased;
      const currentEarnings = startEarnings + (finalEarnings - startEarnings) * eased;
      
      if (demoMode) {
        // No decimals for demo mode
        setAnimatedTotalRevenue(Math.round(currentRevenue));
        setAnimatedTotalDividends(Math.round(currentDividends));
        setAnimatedTotalEarnings(Math.round(currentEarnings));
      } else {
        // 2 decimals for regular mode
        setAnimatedTotalRevenue(Math.round(currentRevenue * 100) / 100);
        setAnimatedTotalDividends(Math.round(currentDividends * 100) / 100);
        setAnimatedTotalEarnings(Math.round(currentEarnings * 100) / 100);
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tableData, demoMode, simulatedDailyRevenue, simulatorExpanded]);

  if (error && !demoMode) {
    const is502Error = error.includes('502');
    
    // For 502 errors, just show loading spinner - server is restarting
    if (is502Error) {
      return (
        <div className={`${className}`}>
          <div className="bg-dark-300/30 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent mb-4"></div>
                <p className="text-gray-400">Loading snapshot data...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // For other errors, show a simple error state
    return (
      <div className={`${className}`}>
        <div className="bg-dark-300/30 rounded-lg overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Unable to load dividend data</p>
              <button 
                onClick={() => {
                  setError(null);
                  fetchSnapshotData();
                }}
                className="px-4 py-2 bg-dark-400 hover:bg-dark-500 text-gray-200 rounded-lg transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #9945FF;
          cursor: pointer;
          border-radius: 50%;
          transition: background 0.15s ease-in-out;
        }
        .slider::-webkit-slider-thumb:hover {
          background: #b969ff;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #9945FF;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          transition: background 0.15s ease-in-out;
        }
        .slider::-moz-range-thumb:hover {
          background: #b969ff;
        }
        .slider::-webkit-slider-runnable-track {
          background: rgba(153, 69, 255, 0.1);
          border-radius: 4px;
        }
        .slider::-moz-range-track {
          background: rgba(153, 69, 255, 0.1);
          border-radius: 4px;
        }
      `}} />

      {/* Table */}
      <div className="rounded-lg overflow-hidden">
        {/* Next Dividend Countdown */}
        {!demoMode && timeUntilNextDividend && (
          <div className="px-4 py-3 text-center border-b border-gray-800/50">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-sm">
              <span className="text-gray-400 uppercase tracking-wide">Next Dividend:</span>
              <span className="text-xl font-bold text-white">{timeUntilNextDividend}</span>
              <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Daily at Midnight UTC • up to 20min</span>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent mb-4"></div>
              <p className="text-gray-400">Loading snapshot data...</p>
            </div>
          </div>
        ) : tableData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">No snapshot data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-800 md:table-fixed">
              <thead>
                <tr style={{backgroundColor: 'transparent', background: 'none'}}>
                  {/* Date column - always visible */}
                  <th className="pb-1 px-0 sticky left-0 z-10 bg-dark-200" style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center">
                      &nbsp;
                    </div>
                  </th>
                  
                  {/* Platform section */}
                  <th colSpan={5} className={`pb-1 px-0 md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-dark-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      Platform
                    </div>
                  </th>
                  {/* Platform strip when inactive on mobile */}
                  <th className={`pb-1 px-0 md:hidden ${activeTab === 'platform' ? 'hidden' : 'table-cell'} cursor-pointer`} 
                      style={{backgroundColor: 'transparent', background: 'none', border: 'none', width: '30px'}}
                      onClick={() => setActiveTab('platform')}>
                    <div className="bg-dark-400/40 hover:bg-dark-400/60 rounded-t-lg py-0.5 border-l border-t border-r border-gray-800 h-full min-h-[20px] transition-colors flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  </th>
                  
                  {/* Holdings section */}
                  <th colSpan={5} className={`pb-1 px-0 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-blue-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      You
                    </div>
                  </th>
                  {/* Holdings strip when inactive on mobile */}
                  <th className={`pb-1 px-0 md:hidden ${activeTab === 'holdings' ? 'hidden' : 'table-cell'} cursor-pointer`}
                      style={{backgroundColor: 'transparent', background: 'none', border: 'none', width: '30px'}}
                      onClick={() => setActiveTab('holdings')}>
                    <div className="bg-blue-400/40 hover:bg-blue-400/60 rounded-t-lg py-0.5 border-l border-t border-r border-gray-800 h-full min-h-[20px] transition-colors flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeTab === 'platform' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                      </svg>
                    </div>
                  </th>
                  
                  {/* Earnings section */}
                  <th colSpan={2} className={`pb-1 px-0 md:table-cell ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`} style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-purple-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      DEGEN Dividend
                    </div>
                  </th>
                  {/* Earnings strip when inactive on mobile */}
                  <th className={`pb-1 px-0 md:hidden ${activeTab === 'earnings' ? 'hidden' : 'table-cell'} cursor-pointer`}
                      style={{backgroundColor: 'transparent', background: 'none', border: 'none', width: '30px'}}
                      onClick={() => setActiveTab('earnings')}>
                    <div className="bg-purple-400/40 hover:bg-purple-400/60 rounded-t-lg py-0.5 border-l border-t border-r border-gray-800 h-full min-h-[20px] transition-colors flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </th>
                </tr>
                <tr className="bg-dark-300/50">
                  {/* Date column - always visible, sticky */}
                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider sticky left-0 z-10 sm:px-2 md:px-3 md:text-xs w-24 sm:w-24 md:w-auto">
                    Date
                  </th>
                  
                  {/* Platform columns */}
                  <th className={`px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-dark-400/20 rounded-l-lg md:table-cell md:px-6 ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '120px'}}>
                    <div className="flex items-center justify-center gap-1">
                      <span className="hidden md:inline">Revenue</span>
                      <span className="md:hidden text-[10px]">Rev</span>
                      {(demoMode || simulatorExpanded) && (
                        <span className="text-[8px] bg-purple-500/30 text-purple-300 px-1 py-0.5 rounded md:text-[9px] md:px-1.5">
                          SIM
                        </span>
                      )}
                    </div>
                  </th>
                  <th className={`py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20 md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                    
                  </th>
                  <th className={`py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20 md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '20px', paddingLeft: '1px', paddingRight: '1px'}}>
                    
                  </th>
                  <th className={`py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20 md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                    
                  </th>
                  <th className={`px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-dark-400/20 rounded-r-lg border-r border-gray-800 md:table-cell md:px-6 ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '120px'}}>
                    <span className="bg-gray-700/30 px-1.5 py-0.5 rounded text-white font-semibold">
                      <span className="hidden md:inline">Dividends</span>
                      <span className="md:hidden text-[10px]">Div</span>
                    </span>
                  </th>
                  {/* Platform strip when inactive */}
                  <th className={`md:hidden ${activeTab === 'platform' ? 'hidden' : 'table-cell'} bg-dark-400/40`} style={{width: '30px'}}></th>
                  
                  {/* Holdings columns */}
                  <th className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20 rounded-l-lg md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                    You
                  </th>
                  <th className={`px-0 py-3 text-center text-xs font-medium text-gray-500 bg-blue-400/20 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                    ÷
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                    Claimed
                  </th>
                  <th className={`px-0 py-3 text-center text-xs font-medium text-gray-500 bg-blue-400/20 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                    =
                  </th>
                  <th className={`px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20 rounded-r-lg md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                    <span className="bg-gray-700/30 px-1.5 py-0.5 rounded text-white font-semibold whitespace-nowrap">Your %</span>
                  </th>
                  {/* Holdings strip when inactive */}
                  <th className={`md:hidden ${activeTab === 'holdings' ? 'hidden' : 'table-cell'} bg-blue-400/40`} style={{width: '30px'}}></th>
                  
                  {/* Earnings columns */}
                  <th className={`px-1 py-3 text-center text-xs font-medium text-gray-500 bg-purple-400/20 rounded-l-lg md:table-cell ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                    •
                  </th>
                  <th className={`px-0.5 py-3 text-center text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-purple-400/20 rounded-r-lg sm:text-xs md:table-cell md:px-4 ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                    <div className="flex items-center justify-center gap-1">
                      <span className="bg-gray-700/30 px-1.5 py-0.5 rounded text-white font-semibold">Your Airdrop</span>
                      {(demoMode || simulatorExpanded) && (
                        <span className="text-[8px] bg-purple-500/30 text-purple-300 px-1 py-0.5 rounded md:text-[9px] md:px-1.5">
                          SIM
                        </span>
                      )}
                    </div>
                  </th>
                  {/* Earnings strip when inactive */}
                  <th className={`md:hidden ${activeTab === 'earnings' ? 'hidden' : 'table-cell'} bg-purple-400/40`} style={{width: '30px'}}></th>
                </tr>
              </thead>
              <tbody className="bg-dark-200/30">
                {tableData.map((snapshot) => {
                  const isExtrapolated = snapshot.isExtrapolated;
                  const isToday = isExtrapolated && (() => {
                    const todayUTC = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
                    return snapshot.timestamp === todayUTC;
                  })();
                  
                  // Use simulated revenue for demo mode or when simulator is active
                  const totalRevenue = (demoMode || (!demoMode && simulatorExpanded)) 
                    ? simulatedDailyRevenue 
                    : (snapshot.daily_contest_revenue || 0);
                  const totalDividends = totalRevenue * 0.1;
                  
                  // Calculate dividend percentage based on effective balance (override or actual)
                  const effectiveBalance = (!demoMode && simulatorExpanded && demoHoldings > 0) ? demoHoldings : snapshot.balance_duel;
                  const dividendPercentage = (snapshot.total_registered_supply || 0) > 0 
                    ? (effectiveBalance / (snapshot.total_registered_supply || 1)) * 100 
                    : 0;
                  
                  // For authenticated users with real data, use actual dividend amounts from API
                  // For demo mode or extrapolated data, use calculated values
                  const myDividend = (!demoMode && !snapshot.isExtrapolated && snapshot.dividend_amount_sol !== undefined) 
                    ? snapshot.dividend_amount_sol 
                    : totalDividends * (dividendPercentage / 100);
                  
                  return (
                    <tr
                      key={snapshot.id}
                      className={`hover:bg-dark-300/20 transition-colors ${
                        isToday ? '' : 
                        isExtrapolated ? 'bg-orange-500/7 border-l-4 border-l-orange-400/50' : ''
                      }`}
                    >
                      {/* Date column - always visible, sticky */}
                      <td className="px-2 py-1 whitespace-nowrap text-[10px] sticky left-0 z-10 sm:px-2 sm:py-2 md:px-3 md:py-3 md:text-xs border-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          {snapshot.dividend_status === 'completed' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <span 
                            className={`leading-none ${
                              isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-gray-300'
                            }`}
                          >
                            <span className="sm:hidden">{formatDate(snapshot.timestamp, true)}</span>
                            <span className="hidden sm:inline">{formatDate(snapshot.timestamp)}</span>
                          </span>
                          {(isExtrapolated && isToday) && (
                            <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1 py-0.5 rounded leading-none md:text-[10px] md:px-1.5">
                              Pending
                            </span>
                          )}
                          {(isExtrapolated && !isToday) && (
                            <span className="bg-orange-500/20 text-orange-400 text-[9px] px-1 py-0.5 rounded leading-none md:text-[10px] md:px-1.5">
                              Pending
                            </span>
                          )}
                          {(!isExtrapolated && snapshot.dividend_status === 'pending') && (
                            <span className="bg-yellow-500/20 text-yellow-400 text-[9px] px-1 py-0.5 rounded leading-none md:text-[10px] md:px-1.5">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Platform columns */}
                      {totalRevenue > 0 ? (
                        <>
                          <td className={`px-2 py-2 whitespace-nowrap text-xs text-center bg-dark-400/10 rounded-l-lg md:table-cell md:px-6 md:py-4 md:text-sm ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '120px'}}>
                            {formatSolAmount(totalRevenue, false, false, undefined, true)}
                          </td>
                          <td className={`py-2 text-center text-[10px] text-gray-500 bg-dark-400/10 md:table-cell md:py-4 md:text-xs ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                            ×
                          </td>
                          <td className={`py-2 text-center text-[10px] text-gray-500 bg-dark-400/10 md:table-cell md:py-4 md:text-xs ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '20px', paddingLeft: '1px', paddingRight: '1px'}}>
                            10%
                          </td>
                          <td className={`py-2 text-center text-[10px] text-gray-500 bg-dark-400/10 md:table-cell md:py-4 md:text-xs ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                            =
                          </td>
                          <td className={`px-2 py-2 whitespace-nowrap text-xs text-center bg-dark-400/10 rounded-r-lg border-r border-gray-800 md:table-cell md:px-6 md:py-4 md:text-sm ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '120px'}}>
                            {formatSolAmount(totalDividends, false, false, undefined, true)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className={`px-2 py-2 whitespace-nowrap text-xs text-center bg-dark-400/10 rounded-lg border-r border-gray-800 md:table-cell md:px-6 md:py-4 md:text-sm ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`}>
                          <span className="text-gray-500 text-[10px] md:text-xs">no paid contests</span>
                        </td>
                      )}
                      {/* Platform strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'platform' ? 'hidden' : 'table-cell'} bg-dark-400/40 cursor-pointer hover:bg-dark-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('platform')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </td>
                      {/* Holdings columns */}
                      <td className={`px-4 py-2 whitespace-nowrap text-xs text-center bg-blue-400/10 rounded-l-lg md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                        <div className="flex items-center justify-center">
                          <span className={`${isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-white'}`}>
                            {formatNumber((!demoMode && simulatorExpanded && demoHoldings > 0) ? demoHoldings : snapshot.balance_duel)}
                          </span>
                          <div className="flex items-center justify-center -ml-0.5" style={{transform: 'scale(0.6)'}}>
                            <NanoLogo />
                          </div>
                        </div>
                      </td>
                      <td className={`px-0 py-2 text-center text-xs text-gray-500 bg-blue-400/10 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                        ÷
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-xs text-center bg-blue-400/10 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'} ${isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-gray-300'}`}>
                        <div className="flex items-center justify-center">
                          <span>
                            {snapshot.total_registered_supply 
                              ? formatNumber(snapshot.total_registered_supply)
                              : 'N/A'
                            }
                          </span>
                          {snapshot.total_registered_supply && (
                            <div className="flex items-center justify-center -ml-0.5" style={{transform: 'scale(0.6)'}}>
                              <NanoLogo />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-0 py-2 text-center text-xs text-gray-500 bg-blue-400/10 md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                        =
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-xs text-center bg-blue-400/10 rounded-r-lg md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                        <span className={`text-xs ${isToday ? 'text-gray-500' : isExtrapolated ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatPercentage(dividendPercentage)}
                        </span>
                      </td>
                      {/* Holdings strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'holdings' ? 'hidden' : 'table-cell'} bg-blue-400/40 cursor-pointer hover:bg-blue-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('holdings')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeTab === 'platform' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                          </svg>
                        </div>
                      </td>
                      
                      {/* Earnings columns */}
                      <td className={`px-1 py-2 text-center text-xs text-gray-500 bg-purple-400/10 md:table-cell ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                        •
                      </td>
                      <td className={`px-0.5 py-2 whitespace-nowrap text-xs text-center bg-purple-400/10 md:table-cell md:px-4 ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                        {isToday ? (
                          <div className="opacity-60">
                            {formatSolAmount(myDividend, false, true, snapshot.dividend_transaction?.tx_signature, true, 2)}
                          </div>
                        ) : (
                          formatSolAmount(myDividend, false, true, snapshot.dividend_transaction?.tx_signature, true, 2)
                        )}
                      </td>
                      {/* Earnings strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'earnings' ? 'hidden' : 'table-cell'} bg-purple-400/40 cursor-pointer hover:bg-purple-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('earnings')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Totals Row */}
                {(() => {
                  return (
                    <tr className="bg-dark-100/50 border-t-2 border-gray-600">
                      <td className="px-2 py-3 whitespace-nowrap text-xs font-semibold text-white sticky left-0 z-10 bg-dark-100/50 md:px-6 md:py-4 md:text-sm">
                        <span className="md:hidden">TOTAL</span>
                        <span className="hidden md:inline">ALL TIME</span>
                      </td>
                      {animatedTotalRevenue > 0 ? (
                        <>
                          <td className={`px-2 py-3 whitespace-nowrap text-xs text-center bg-dark-400/20 rounded-l-lg md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`}>
                            {formatSolAmount(animatedTotalRevenue, false, false, undefined, true, demoMode ? 0 : 2)}
                          </td>
                          <td className={`py-3 text-center text-[10px] text-gray-500 bg-dark-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                            ×
                          </td>
                          <td className={`py-3 text-center text-[10px] text-gray-500 bg-dark-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '20px', paddingLeft: '1px', paddingRight: '1px'}}>
                            10%
                          </td>
                          <td className={`py-3 text-center text-[10px] text-gray-500 bg-dark-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`} style={{width: '15px', paddingLeft: '1px', paddingRight: '1px'}}>
                            =
                          </td>
                          <td className={`px-2 py-3 whitespace-nowrap text-xs text-center bg-dark-400/20 rounded-r-lg border-r border-gray-800 md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`}>
                            <span className="underline">{formatSolAmount(animatedTotalDividends, false, false, undefined, true, demoMode ? 0 : 2)}</span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className={`px-2 py-3 whitespace-nowrap text-xs text-center bg-dark-400/20 rounded-lg border-r border-gray-800 md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'platform' ? 'table-cell' : 'hidden'}`}>
                          <span className="text-gray-500 text-[10px] md:text-xs">—</span>
                        </td>
                      )}
                      {/* Platform strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'platform' ? 'hidden' : 'table-cell'} bg-dark-400/40 cursor-pointer hover:bg-dark-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('platform')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </td>
                      {/* Holdings columns in totals */}
                      <td className={`px-2 py-3 whitespace-nowrap text-xs bg-blue-400/20 rounded-l-lg text-center md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className={`px-0 py-3 text-center text-[10px] text-gray-500 bg-blue-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                        ÷
                      </td>
                      <td className={`px-2 py-3 whitespace-nowrap text-xs text-center bg-blue-400/20 md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className={`px-0 py-3 text-center text-[10px] text-gray-500 bg-blue-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`} style={{width: '12px'}}>
                        =
                      </td>
                      <td className={`px-2 py-3 whitespace-nowrap text-xs text-center bg-blue-400/20 rounded-r-lg md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'holdings' ? 'table-cell' : 'hidden'}`}>
                        <span className="text-gray-500">—</span>
                      </td>
                      {/* Holdings strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'holdings' ? 'hidden' : 'table-cell'} bg-blue-400/40 cursor-pointer hover:bg-blue-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('holdings')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeTab === 'platform' ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                          </svg>
                        </div>
                      </td>
                      
                      {/* Earnings columns in totals */}
                      <td className={`px-1 py-3 text-center text-[10px] text-gray-500 bg-purple-400/20 md:py-4 md:text-xs md:table-cell ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                        •
                      </td>
                      <td className={`px-0.5 py-3 whitespace-nowrap text-xs text-center bg-purple-400/20 md:px-6 md:py-4 md:text-sm md:table-cell ${activeTab === 'earnings' ? 'table-cell' : 'hidden'}`}>
                        <span className="underline">{formatSolAmount(animatedTotalEarnings, false, true, undefined, true, demoMode ? 0 : 2)}</span>
                      </td>
                      {/* Earnings strip when inactive on mobile */}
                      <td className={`md:hidden ${activeTab === 'earnings' ? 'hidden' : 'table-cell'} bg-purple-400/40 cursor-pointer hover:bg-purple-400/60 transition-colors`} style={{width: '30px'}} onClick={() => setActiveTab('earnings')}>
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
                
                {/* APY Row */}
                {(() => {
                  // Calculate APY based on the data
                  const hasValidData = tableData.length > 0 && animatedTotalEarnings > 0;
                  
                  if (!hasValidData) return null;
                  
                  // Get the date range first to check if we have enough data
                  const oldestDate = new Date(tableData[tableData.length - 1].timestamp);
                  const newestDate = new Date(tableData[0].timestamp);
                  const daysDiff = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Count days with actual revenue (non-zero)
                  const daysWithRevenue = tableData.filter(snapshot => {
                    const revenue = (demoMode || (!demoMode && simulatorExpanded)) 
                      ? simulatedDailyRevenue 
                      : (snapshot.daily_contest_revenue || 0);
                    return revenue > 0;
                  }).length;
                  
                  // Check if we have enough non-zero revenue days
                  const hasEnoughData = daysWithRevenue >= 7;
                  
                  // Get average balance over the period (using override if set)
                  const avgBalance = tableData.reduce((sum, snapshot) => {
                    const effectiveBalance = (!demoMode && simulatorExpanded && demoHoldings > 0) ? demoHoldings : snapshot.balance_duel;
                    return sum + effectiveBalance;
                  }, 0) / tableData.length;
                  
                  // Calculate daily return rate
                  const dailyReturn = animatedTotalEarnings / avgBalance / daysDiff;
                  
                  // Convert to APY (compound daily for 365 days) - handle edge cases
                  const apy = dailyReturn > 0 ? (Math.pow(1 + dailyReturn, 365) - 1) * 100 : 0;
                  
                  return (
                    <tr className="bg-gradient-to-r from-purple-900/20 to-green-900/20 border-t border-gray-600">
                      <td colSpan={13} className="px-4 py-4 text-center md:px-6">
                        {hasEnoughData ? (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                            <span className="text-gray-400 text-xs sm:text-sm">Based on your earnings:</span>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400 sm:text-2xl">
                                {apy.toFixed(2)}%
                              </span>
                              <span className="text-gray-300 text-base font-semibold sm:text-lg">APY</span>
                            </div>
                            <span className="text-gray-500 text-xs">({daysWithRevenue} earning day{daysWithRevenue !== 1 ? 's' : ''})</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                            <span className="text-gray-400 text-xs sm:text-sm">APY:</span>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg text-gray-500 sm:text-xl">
                                Cannot calculate
                              </span>
                            </div>
                            <span className="text-gray-500 text-xs">(Need 7+ earning days, have {daysWithRevenue})</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
      

      {/* Revenue Simulator */}
      {(
        <div className="mt-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg overflow-hidden border border-purple-500/30">
          <button
            onClick={() => setSimulatorExpanded(!simulatorExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:from-purple-600/30 hover:to-blue-600/30 bg-gradient-to-r transition-all duration-200 group md:px-6 md:py-4"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm font-bold text-purple-300 whitespace-nowrap md:text-lg md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-purple-300 md:to-blue-300">
                WHAT IF...?
              </span>
              <span className="text-xs text-gray-400 truncate hidden sm:inline md:text-sm md:font-medium md:text-gray-300">
                {simulatorExpanded ? 'Customize projections' : 'Estimate earnings'}
              </span>
            </div>
            <div className="bg-purple-500/20 rounded-full p-1.5 group-hover:bg-purple-500/30 transition-colors md:p-2">
              <svg 
                className={`w-4 h-4 transition-transform ${simulatorExpanded ? 'rotate-90' : ''} text-purple-300 md:w-5 md:h-5`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          
          {simulatorExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Your DUEL Holdings {!demoMode && '(Override)'}: <span className="text-white font-semibold">{demoHoldingsMillions.toFixed(1)}M</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.1"
                    value={demoHoldingsMillions}
                    onChange={(e) => setDemoHoldingsMillions(parseFloat(e.target.value))}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="text-[10px] text-gray-500 mt-1">
                    {demoHoldingsMillions > 0 ? (
                      <>= {((demoHoldings / (tableData[0]?.total_registered_supply || 1)) * 100).toFixed(4)}% of supply</>
                    ) : !demoMode ? (
                      <>Using your actual balance</>
                    ) : (
                      <>0.0M DUEL</>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Contests per Day: <span className="text-white font-semibold">{contestsPerDay}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={contestsPerDay}
                    onChange={(e) => setContestsPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>1</span>
                    <span>100</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Average Entry Fee: <span className="text-white font-semibold inline-flex items-center gap-1">
                      {avgEntryFee.toFixed(2)}
                      <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={avgEntryFee}
                    onChange={(e) => setAvgEntryFee(parseFloat(e.target.value))}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>0.1</span>
                    <span>5.0</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Avg Participants: <span className="text-white font-semibold">{avgParticipants}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="100"
                    step="1"
                    value={avgParticipants}
                    onChange={(e) => setAvgParticipants(parseInt(e.target.value))}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>3</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400 flex items-center flex-wrap">
                    <span>Formula: {contestsPerDay} contests × </span>
                    <span className="inline-flex items-center gap-1 mx-1">
                      {avgEntryFee}
                      <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                    </span>
                    <span>× {avgParticipants} participants = </span>
                    <span className="font-semibold text-brand-400 ml-1 inline-flex items-center gap-1">
                      {simulatedDailyRevenue.toFixed(2)}
                      <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                      <span>/day</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setContestsPerDay(6);
                      setAvgEntryFee(0.25);
                      setAvgParticipants(50);
                      if (demoMode) setDemoHoldingsMillions(10.0);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
                
                {/* Projection for logged-in users - only show when simulator is collapsed */}
                {!demoMode && tableData.length > 0 && !simulatorExpanded && (
                  <div className="bg-dark-400/20 rounded-lg p-3 border border-gray-700/50">
                    <div className="text-xs text-gray-500 mb-1">Based on your current holdings:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Your Daily Earnings:</span>
                        <div className="text-white font-semibold">
                          {(() => {
                            const currentPercentage = tableData[0]?.dividend_percentage || 0;
                            const dailyDividends = simulatedDailyRevenue * 0.1;
                            const dailyEarnings = dailyDividends * (currentPercentage / 100);
                            return `${dailyEarnings.toFixed(4)} SOL`;
                          })()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Monthly (30 days):</span>
                        <div className="text-green-400 font-semibold">
                          {(() => {
                            const currentPercentage = tableData[0]?.dividend_percentage || 0;
                            const dailyDividends = simulatedDailyRevenue * 0.1;
                            const dailyEarnings = dailyDividends * (currentPercentage / 100);
                            return `${(dailyEarnings * 30).toFixed(2)} SOL`;
                          })()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Yearly (365 days):</span>
                        <div className="text-purple-400 font-semibold">
                          {(() => {
                            const currentPercentage = tableData[0]?.dividend_percentage || 0;
                            const dailyDividends = simulatedDailyRevenue * 0.1;
                            const dailyEarnings = dailyDividends * (currentPercentage / 100);
                            return `${(dailyEarnings * 365).toFixed(2)} SOL`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DuelSnapshotTable;