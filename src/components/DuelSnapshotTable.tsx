// src/components/DuelSnapshotTable.tsx

/**
 * DUEL Snapshot Table Component
 * 
 * @description Table component for displaying DUEL token daily snapshots
 * Shows Date, DUEL Balance, Dividend %, and Total Supply in a clean table format
 * 
 * @author BranchManager69
 * @created 2025-07-24
 */

import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import NanoLogo from './logo/NanoLogo';

interface BalanceDataPoint {
  id: number;
  balance_lamports: string;
  balance_duel: number;
  timestamp: string;
  total_registered_supply?: number;
  dividend_percentage?: number;
  daily_contest_revenue?: number;
  isExtrapolated?: boolean;
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
  
  // Calculate simulated daily revenue
  const simulatedDailyRevenue = contestsPerDay * avgEntryFee * avgParticipants;

  // Format date nicely (e.g., "Jul 23, 2025")
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  // Format SOL amount (returns JSX element)
  const formatSolAmount = (amount: number, isItalic: boolean = false) => {
    if (amount === 0) {
      return <span className={`${isItalic ? 'italic' : ''} text-gray-500`}>–</span>;
    }
    
    return (
      <div className="flex items-center justify-center gap-1">
        <span className={`${isItalic ? 'italic' : ''} text-white`}>
          {amount.toFixed(2)}
        </span>
        <img 
          src="/assets/media/logos/solana.svg" 
          alt="SOL" 
          className="w-4 h-4"
        />
      </div>
    );
  };

  // Generate extrapolated data for missing days
  const generateExtrapolatedData = (actualData: BalanceDataPoint[], currentBalance?: number): BalanceDataPoint[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    mostRecentDate.setHours(0, 0, 0, 0);
    
    // Check if we already have today's data
    const hasToday = sortedActualData.some(data => {
      const dataDate = new Date(data.timestamp);
      dataDate.setHours(0, 0, 0, 0);
      return dataDate.getTime() === today.getTime();
    });
    
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
      missingDate.setDate(mostRecentDate.getDate() + (daysDiff - i + 1));
      missingDate.setHours(0, 0, 0, 0);
      
      extrapolatedRows.push({
        ...mostRecentData,
        id: 9999 - i, // Unique IDs for extrapolated data
        balance_duel: currentBalance !== undefined ? currentBalance : mostRecentData.balance_duel,
        balance_lamports: ((currentBalance !== undefined ? currentBalance : mostRecentData.balance_duel) * 1000000).toString(),
        timestamp: missingDate.toISOString(),
        isExtrapolated: true
      });
    }
    
    return extrapolatedRows;
  };

  // Fetch snapshot data
  const fetchSnapshotData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If in demo mode, use example data
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate demo snapshot data (6 days of real data, today will be extrapolated)
        const demoSnapshots: BalanceDataPoint[] = [];
        const now = new Date();
        
        // Generate 6 daily snapshots starting from yesterday (skip today to simulate missing data)
        for (let i = 1; i <= 6; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const balance = 31814255 - (i * 50000) + Math.random() * 20000;
          const totalSupply = 150000000 + Math.random() * 5000000;
          const percentage = (balance / totalSupply) * 100;
          
          demoSnapshots.push({
            id: 1000 + i,
            balance_lamports: (balance * 1000000).toString(),
            balance_duel: balance,
            timestamp: date.toISOString(),
            total_registered_supply: totalSupply,
            dividend_percentage: parseFloat(percentage.toFixed(2)),
            isExtrapolated: false
          });
        }
        
        // Generate extrapolated data for missing days (including today)
        const extrapolatedData = generateExtrapolatedData(demoSnapshots, 31814255);
        
        // Combine actual and extrapolated data, sort newest first
        const allData = [...extrapolatedData, ...demoSnapshots];
        allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTableData(allData);
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
        
        // Generate extrapolated data for missing days
        // TODO: Get current balance from trends data when available
        const extrapolatedData = generateExtrapolatedData(actualData);
        
        // Combine actual and extrapolated data, sort newest first
        const allData = [...extrapolatedData, ...actualData];
        allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTableData(allData);
        setUserData(data.wallet);
      } else {
        throw new Error('Failed to fetch snapshot data');
      }
    } catch (err) {
      console.error('Error fetching DUEL snapshot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load snapshot data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchSnapshotData();
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
      const percentage = snapshot.dividend_percentage || 0;
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
      
      setAnimatedTotalRevenue(startRevenue + (finalRevenue - startRevenue) * eased);
      setAnimatedTotalDividends(startDividends + (finalDividends - startDividends) * eased);
      setAnimatedTotalEarnings(startEarnings + (finalEarnings - startEarnings) * eased);
      
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

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <div className="text-center">
            <button 
              onClick={fetchSnapshotData}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Revenue Simulator */}
      {(
        <div className="mb-4 bg-dark-300/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setSimulatorExpanded(!simulatorExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-300/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg 
                className={`w-4 h-4 transition-transform ${simulatorExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-gray-300">
                What If...?
              </span>
              <span className="text-xs text-gray-500">
                (Daily Platform Revenue: {simulatedDailyRevenue.toFixed(2)} SOL)
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {simulatorExpanded ? 'Click to collapse' : 'Click to customize'}
            </span>
          </button>
          
          {simulatorExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Contests per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={contestsPerDay}
                    onChange={(e) => setContestsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-dark-200 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Average Entry Fee (SOL)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={avgEntryFee}
                    onChange={(e) => setAvgEntryFee(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full px-3 py-2 bg-dark-200 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Avg Participants per Contest
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="1000"
                    value={avgParticipants}
                    onChange={(e) => setAvgParticipants(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full px-3 py-2 bg-dark-200 border border-gray-700 rounded-md text-white text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Formula: {contestsPerDay} contests × {avgEntryFee} SOL × {avgParticipants} participants = 
                    <span className="font-semibold text-brand-400 ml-1">{simulatedDailyRevenue.toFixed(2)} SOL/day</span>
                  </div>
                  <button
                    onClick={() => {
                      setContestsPerDay(6);
                      setAvgEntryFee(0.25);
                      setAvgParticipants(50);
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

      {/* Table */}
      <div className="bg-dark-300/30 rounded-lg overflow-hidden">
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
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr style={{backgroundColor: 'transparent', background: 'none'}}>
                  <th className="pb-1 px-0" style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-black/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      &nbsp;
                    </div>
                  </th>
                  <th colSpan={5} className="pb-1 px-0" style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-dark-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      Platform
                    </div>
                  </th>
                  <th colSpan={5} className="pb-1 px-0" style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-blue-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      You
                    </div>
                  </th>
                  <th colSpan={2} className="pb-1 px-0" style={{backgroundColor: 'transparent', background: 'none', border: 'none'}}>
                    <div className="bg-purple-400/20 rounded-t-lg py-0.5 text-[10px] uppercase text-gray-500 font-medium text-center border-l border-t border-r border-gray-800">
                      DEGEN Dividend
                    </div>
                  </th>
                </tr>
                <tr className="bg-dark-300/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-dark-400/20 rounded-l-lg">
                    <div className="flex items-center justify-center gap-1">
                      Revenue
                      {!demoMode && simulatorExpanded && (
                        <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">
                          SIMULATED
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                    
                  </th>
                  <th className="py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20" style={{width: '25px', paddingLeft: '2px', paddingRight: '2px'}}>
                    
                  </th>
                  <th className="py-3 text-center text-xs font-medium text-gray-500 bg-dark-400/20" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                    
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-dark-400/20 rounded-r-lg border-r border-gray-800">
                    <span className="underline">Dividends</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20 rounded-l-lg">
                    You
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 bg-blue-400/20">
                    ÷
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20">
                    All Users
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 bg-blue-400/20">
                    =
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-blue-400/20 rounded-r-lg">
                    <span className="underline">Your Share</span>
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 bg-purple-400/20 rounded-l-lg">
                    •
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-purple-400/20 rounded-r-lg">
                    <span className="underline">Amount</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-200/30 divide-y divide-gray-800">
                {tableData.map((snapshot) => {
                  const isExtrapolated = snapshot.isExtrapolated;
                  const isToday = isExtrapolated && (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const snapshotDate = new Date(snapshot.timestamp);
                    snapshotDate.setHours(0, 0, 0, 0);
                    return today.getTime() === snapshotDate.getTime();
                  })();
                  
                  // Use simulated revenue for demo mode or when simulator is active
                  const totalRevenue = (demoMode || (!demoMode && simulatorExpanded)) 
                    ? simulatedDailyRevenue 
                    : (snapshot.daily_contest_revenue || 0);
                  const totalDividends = totalRevenue * 0.1;
                  const myDividend = snapshot.dividend_percentage ? (totalDividends * snapshot.dividend_percentage / 100) : 0;
                  
                  return (
                    <tr
                      key={snapshot.id}
                      className={`hover:bg-dark-300/20 transition-colors ${
                        isToday ? 'bg-gray-900/60 border-l-4 border-l-cyan-400/50' : 
                        isExtrapolated ? 'bg-orange-500/7 border-l-4 border-l-orange-400/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className={`${isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-gray-300'} leading-none`}>
                            {formatDate(snapshot.timestamp)}
                          </span>
                          {isExtrapolated && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 self-start leading-none ${
                              isToday 
                                ? 'bg-cyan-500/20 text-cyan-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {isToday ? 'Today' : 'Pending'}
                            </span>
                          )}
                        </div>
                        </td>
                      {totalRevenue > 0 ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/10 rounded-l-lg">
                            {formatSolAmount(totalRevenue, false)}
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/10" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                            ×
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/10" style={{width: '25px', paddingLeft: '2px', paddingRight: '2px'}}>
                            10%
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/10" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                            =
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/10 rounded-r-lg border-r border-gray-800">
                            {formatSolAmount(totalDividends, false)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/10 rounded-lg border-r border-gray-800">
                          <span className="text-gray-500 text-xs">no paid contests</span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm bg-blue-400/10 rounded-l-lg">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-white'}`}>
                            {formatNumber(snapshot.balance_duel)}
                          </span>
                          <div className="w-4 h-4">
                            <NanoLogo />
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-blue-400/10">
                        ÷
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center bg-blue-400/10 ${isToday ? 'text-gray-400' : isExtrapolated ? 'text-gray-400' : 'text-gray-300'}`}>
                        <div className="flex items-center justify-center gap-2">
                          <span>
                            {snapshot.total_registered_supply 
                              ? formatNumber(snapshot.total_registered_supply)
                              : 'N/A'
                            }
                          </span>
                          {snapshot.total_registered_supply && (
                            <div className="w-4 h-4">
                              <NanoLogo />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-blue-400/10">
                        =
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-blue-400/10 rounded-r-lg">
                        <span className={`text-xs ${isToday ? 'text-gray-500' : isExtrapolated ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatPercentage(snapshot.dividend_percentage)}
                        </span>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-purple-400/10">
                        •
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-purple-400/10">
                        {formatSolAmount(myDividend, false)}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Totals Row */}
                {(() => {
                  return (
                    <tr className="bg-dark-100/50 border-t-2 border-gray-600">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        ALL TIME
                      </td>
                      {animatedTotalRevenue > 0 ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/20 rounded-l-lg font-semibold">
                            {formatSolAmount(animatedTotalRevenue, false)}
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/20" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                            ×
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/20" style={{width: '25px', paddingLeft: '2px', paddingRight: '2px'}}>
                            10%
                          </td>
                          <td className="py-4 text-center text-xs text-gray-500 bg-dark-400/20" style={{width: '20px', paddingLeft: '2px', paddingRight: '2px'}}>
                            =
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/20 rounded-r-lg border-r border-gray-800 font-semibold">
                            <span className="underline">{formatSolAmount(animatedTotalDividends, false)}</span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center bg-dark-400/20 rounded-lg border-r border-gray-800">
                          <span className="text-gray-500 text-xs">—</span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm bg-blue-400/20 rounded-l-lg text-center">
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-blue-400/20">
                        ÷
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-blue-400/20">
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-blue-400/20">
                        =
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-blue-400/20 rounded-r-lg">
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className="px-1 py-4 text-center text-xs text-gray-500 bg-purple-400/20">
                        •
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center bg-purple-400/20 font-semibold">
                        <span className="underline">{formatSolAmount(animatedTotalEarnings, false)}</span>
                      </td>
                    </tr>
                  );
                })()}
                
                {/* APY Row */}
                {(() => {
                  // Calculate APY based on the data
                  const hasValidData = tableData.length > 0 && animatedTotalEarnings > 0;
                  
                  if (!hasValidData) return null;
                  
                  // Get the date range
                  const oldestDate = new Date(tableData[tableData.length - 1].timestamp);
                  const newestDate = new Date(tableData[0].timestamp);
                  const daysDiff = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Get average balance over the period
                  const avgBalance = tableData.reduce((sum, snapshot) => sum + snapshot.balance_duel, 0) / tableData.length;
                  
                  // Calculate daily return rate
                  const dailyReturn = animatedTotalEarnings / avgBalance / daysDiff;
                  
                  // Convert to APY (compound daily for 365 days)
                  const apy = (Math.pow(1 + dailyReturn, 365) - 1) * 100;
                  
                  return (
                    <tr className="bg-gradient-to-r from-purple-900/20 to-green-900/20 border-t border-gray-600">
                      <td colSpan={13} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-6">
                          <span className="text-gray-400 text-sm">Based on your earnings:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
                              {apy.toFixed(2)}%
                            </span>
                            <span className="text-gray-300 text-lg font-semibold">APY</span>
                          </div>
                          <span className="text-gray-500 text-xs">({daysDiff.toFixed(0)} day{daysDiff !== 1 ? 's' : ''} of data)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Explanation text */}
      <div className="mt-4 text-center space-y-1">
        <p className="text-gray-400 text-sm">
          Transparent calculations showing how your DUEL holdings determine your daily revenue share
        </p>
        <div className="flex justify-center items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-cyan-400">Today:</span>
            <span className="text-gray-400">Projected using current balance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-400">Pending:</span>
            <span className="text-gray-400">Distribution in progress</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuelSnapshotTable;