// src/components/LiquiditySimulator.tsx

/**
 * Liquidity Simulator Component
 * 
 * This component provides an interactive interface for simulating token liquidation
 * strategies with real-time feedback via WebSocket.
 * 
 * Last updated: April 27, 2025
 * @author: @BranchManager69
 * 
 * IMPORTANT NOTE: This component is actively being updated as part of the v69 WebSocket system rollout.
 * Some functionality might be missing or in flux as new features are implemented.
 * If you notice missing functionality, please coordinate with the team before making changes.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { AcquisitionLevel, ScenarioType, TokenInfo, useLiquiditySim } from '../hooks/websocket/topic-hooks/useLiquiditySim';
import { ddApi } from '../services/dd-api';

// Token search response
interface TokenSearchResponse {
  success: boolean;
  tokens: {
    address: string;
    name: string;
    symbol: string;
    price_usd: number;
    market_cap: number;
    total_supply: number;
    circulating_supply: number;
    logo_url: string;
  }[];
}

// Formatters for numbers
const formatters = {
  usd: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  
  price: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 5,
    maximumFractionDigits: 6,
  }),
  
  compact: new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }),
  
  percent: new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  
  number: new Intl.NumberFormat('en-US'),
  
  marketCap: (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    return `$${(value / 1_000_000).toFixed(2)}M`;
  },
};

// Parameter labels and descriptions
const parameterInfo = {
  totalSupply: {
    label: 'Total Supply',
    description: 'Total token supply for calculating market cap',
  },
  currentPrice: {
    label: 'Current Price',
    description: 'Current token price in USD',
  },
  baseReserve: {
    label: 'Base Reserve',
    description: 'Base reserve amount in the liquidity pool',
  },
  quoteReserve: {
    label: 'Quote Reserve',
    description: 'Quote reserve amount in the liquidity pool (USD)',
  },
  acquisitionLevel: {
    label: 'Acquisition Level',
    description: 'Level of token acquisition (low, medium, high)',
    options: [
      { value: 'low', label: 'Low (0.5% of supply)' },
      { value: 'medium', label: 'Medium (2% of supply)' },
      { value: 'high', label: 'High (5% of supply)' },
    ],
  },
  personalRatio: {
    label: 'Personal Ratio',
    description: 'Ratio of tokens personally owned vs. total acquired amount',
  },
  days: {
    label: 'Timeframe (Days)',
    description: 'Number of days to simulate the liquidation strategy',
  },
  scenarioType: {
    label: 'Market Scenario',
    description: 'Market conditions for simulation',
    options: [
      { value: 'baseCase', label: 'Base Case' },
      { value: 'bullCase', label: 'Bull Case' },
      { value: 'bearCase', label: 'Bear Case' },
    ],
  },
};

// Default simulation parameters
const defaultParams = {
  totalSupply: 1000000000,
  currentPrice: 0.5,
  baseReserve: 10000000,
  quoteReserve: 5000000,
  acquisitionLevel: 'medium' as AcquisitionLevel,
  personalRatio: 0.5,
  days: 60,
  scenarioType: 'baseCase' as ScenarioType,
};

/**
 * Liquidity Simulator Component
 * 
 * This component provides an interactive interface for simulating token liquidation
 * strategies with real-time feedback via WebSocket.
 */
const LiquiditySimulator: React.FC = () => {
  // State for simulation parameters
  const [params, setParams] = useState(defaultParams);
  
  // Liquidity simulation hook provides WebSocket connection and methods
  const {
    simulating,
    simulationResults,
    error,
    isConnected,
    connectionState,
    runSimulation,
    runGridSimulation,
    getTokenInfo
  } = useLiquiditySim();
  
  // Token search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenSearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'parameters' | 'results' | 'grid'>('parameters');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Grid simulation state
  const [gridParams, setGridParams] = useState({
    acquisitionLevels: ['medium'] as AcquisitionLevel[],
    scenarios: ['baseCase'] as ScenarioType[],
  });
  
  // Handle parameter changes
  const handleParamChange = (key: string, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [key]: typeof value === 'string' && !isNaN(Number(value)) && 
              !['acquisitionLevel', 'scenarioType'].includes(key) 
              ? Number(value) 
              : value
    }));
  };
  
  // Handle token search
  const searchTokens = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    
    try {
      setSearching(true);
      setSearchError(null);
      
      const response = await ddApi.fetch(`/api/tokens/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Token search error:', error);
      setSearchError('Failed to search tokens. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);
  
  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      searchTokens();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [searchQuery, searchTokens]);
  
  // Select a token and fetch its pool information
  const handleSelectToken = useCallback((token: TokenSearchResponse['tokens'][0]) => {
    getTokenInfo(token.address);
    setSearchResults(null);
    setSearchQuery('');
  }, [getTokenInfo]);

  // Log the simulation results
  useEffect(() => {
    console.log('Simulation results:', simulationResults);
  }, [simulationResults]);
  
  // Process token information when received through WebSocket
  useEffect(() => {
    if (simulationResults && 'tokenInfo' in simulationResults && simulationResults.tokenInfo) {
      
      // Get the token info from the simulation results
      const tokenInfo = simulationResults.tokenInfo as TokenInfo;
      
      // Get the total supply from the token info
      const totalSupply = tokenInfo.totalSupply;
      console.log(`Total supply: ${totalSupply}`);

      // Set the selected token
      setSelectedToken(tokenInfo);
      
      // Update simulation parameters based on token information
      setParams(prev => ({
        ...prev,
        //totalSupply: tokenInfo.totalSupply, // (does not exist)
        currentPrice: tokenInfo.price,
        baseReserve: tokenInfo.baseReserve,
        quoteReserve: tokenInfo.quoteReserve
      }));
    }
  }, [simulationResults]);
  
  // Submit simulation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulation(params);
    setActiveTab('results');
  };
  
  // Run grid simulation
  const handleGridSimulation = () => {
    const gridSimParams = {
      ...params,
      acquisitionLevels: gridParams.acquisitionLevels,
      scenarios: gridParams.scenarios
    };
    
    runGridSimulation(gridSimParams);
    setActiveTab('grid');
  };
  
  // Toggle acquisition level selection for grid simulation
  const toggleAcquisitionLevel = (level: AcquisitionLevel) => {
    setGridParams(prev => {
      if (prev.acquisitionLevels.includes(level)) {
        return {
          ...prev,
          acquisitionLevels: prev.acquisitionLevels.filter(l => l !== level)
        };
      } else {
        return {
          ...prev,
          acquisitionLevels: [...prev.acquisitionLevels, level]
        };
      }
    });
  };
  
  // Toggle scenario selection for grid simulation
  const toggleScenario = (scenario: ScenarioType) => {
    setGridParams(prev => {
      if (prev.scenarios.includes(scenario)) {
        return {
          ...prev,
          scenarios: prev.scenarios.filter(s => s !== scenario)
        };
      } else {
        return {
          ...prev,
          scenarios: [...prev.scenarios, scenario]
        };
      }
    });
  };
  
  // Computed breakdown
  const breakdown = useMemo(() => {
    if (!simulationResults || !('results' in simulationResults) || !simulationResults.results) {
      return null;
    }
    
    // Make sure we have a summary (single simulation result, not grid)
    const results = simulationResults.results as { summary?: any };
    if (!results.summary) {
      return null;
    }
    
    const { totalProceeds, averageSellPrice, totalTokensSold, percentOfSupply, finalPrice, priceImpact } = results.summary;
    
    return {
      totalProceeds: formatters.usd.format(totalProceeds as number),
      averageSellPrice: formatters.price.format(averageSellPrice as number),
      totalTokensSold: formatters.compact.format(totalTokensSold as number),
      percentOfSupply: formatters.percent.format((percentOfSupply as number) / 100),
      finalPrice: formatters.price.format(finalPrice as number),
      priceImpact: formatters.percent.format((priceImpact as number) / 100),
    };
  }, [simulationResults]);
  
  // Timeline data for charts
  const timelineData = useMemo(() => {
    if (!simulationResults || !('results' in simulationResults) || !simulationResults.results) {
      return [];
    }
    
    // Check if we have a timeline
    const results = simulationResults.results as { timeline?: any[] };
    return results.timeline || [];
  }, [simulationResults]);
  
  // Grid results processing
  const gridResults = useMemo(() => {
    if (!simulationResults || !('results' in simulationResults) || !simulationResults.results) {
      return null;
    }
    
    // If it has a summary, it's not a grid result
    const results = simulationResults.results as any;
    if (results.summary) {
      return null;
    }
    
    // Check if this is a grid result by looking for nested objects with simulation results
    const keys = Object.keys(results);
    if (keys.length === 0) {
      return null;
    }
    
    // Try to determine if it's a grid result
    const firstKey = keys[0];
    const firstValue = results[firstKey];
    if (!firstValue || typeof firstValue !== 'object' || !Object.keys(firstValue).length) {
      return null;
    }
    
    // Convert the grid results to a format suitable for display
    return Object.entries(results).map(([scenario, acquisitions]) => ({
      scenario,
      acquisitions: Object.entries(acquisitions as Record<string, any>).map(([level, result]) => ({
        level,
        ...(result as any).summary
      }))
    }));
  }, [simulationResults]);
  
  return (
    <div className="min-h-screen bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Token Liquidation Simulator</h1>
            <p className="text-gray-400 mt-2">Analyze and optimize token liquidation strategies with realistic market constraints</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">{connectionState}</span>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Parameters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Token Search */}
            <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">Token Selection</h2>
              
              <div className="relative mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a token..."
                  className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                
                {/* Search Results Dropdown */}
                {searchResults && searchResults.tokens.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-dark-300 border border-dark-400 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.tokens.map((token) => (
                      <button
                        key={token.address}
                        onClick={() => handleSelectToken(token)}
                        className="w-full px-4 py-2 text-left hover:bg-dark-400/50 flex items-center space-x-3"
                      >
                        {token.logo_url && (
                          <img src={token.logo_url} alt={token.symbol} className="w-6 h-6 rounded-full" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-100">{token.symbol}</span>
                            <span className="text-sm text-gray-400">{formatters.price.format(token.price_usd)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">{token.name}</span>
                            <span className="text-gray-500">MC: {formatters.marketCap(token.market_cap)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin h-5 w-5 border-t-2 border-brand-400 rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Selected Token */}
              {selectedToken && (
                <div className="bg-dark-300/50 rounded-lg p-4 border border-brand-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-100">{selectedToken.name} ({selectedToken.symbol})</h3>
                    <span className="text-brand-400">{formatters.price.format(selectedToken.price)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Market Cap:</span>
                      <span className="text-gray-200 ml-2">{formatters.marketCap(selectedToken.marketCap)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Base Reserve:</span>
                      <span className="text-gray-200 ml-2">{formatters.compact.format(selectedToken.baseReserve)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Quote Reserve:</span>
                      <span className="text-gray-200 ml-2">{formatters.usd.format(selectedToken.quoteReserve)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Address:</span>
                      <span className="text-gray-200 ml-2 text-xs truncate">{selectedToken.address.substring(0, 6)}...{selectedToken.address.substring(selectedToken.address.length - 4)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {searchError && (
                <div className="text-red-500 text-sm mt-2">{searchError}</div>
              )}
            </div>
            
            {/* Simulation Tabs */}
            <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg overflow-hidden">
              <div className="flex border-b border-dark-300">
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'parameters' ? 'bg-brand-400/20 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-300/50'}`}
                  onClick={() => setActiveTab('parameters')}
                >
                  Parameters
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'results' ? 'bg-brand-400/20 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-300/50'}`}
                  onClick={() => setActiveTab('results')}
                  disabled={!simulationResults}
                >
                  Results
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'grid' ? 'bg-brand-400/20 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-300/50'}`}
                  onClick={() => setActiveTab('grid')}
                >
                  Grid
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'parameters' && (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {/* Basic parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.currentPrice.label}
                          </label>
                          <input
                            type="number"
                            value={params.currentPrice}
                            onChange={(e) => handleParamChange('currentPrice', e.target.value)}
                            step="0.000001"
                            min="0.000001"
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.totalSupply.label}
                          </label>
                          <input
                            type="number"
                            value={params.totalSupply}
                            onChange={(e) => handleParamChange('totalSupply', e.target.value)}
                            step="1000000"
                            min="1"
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.acquisitionLevel.label}
                          </label>
                          <select
                            value={params.acquisitionLevel}
                            onChange={(e) => handleParamChange('acquisitionLevel', e.target.value)}
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          >
                            {parameterInfo.acquisitionLevel.options.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.scenarioType.label}
                          </label>
                          <select
                            value={params.scenarioType}
                            onChange={(e) => handleParamChange('scenarioType', e.target.value)}
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          >
                            {parameterInfo.scenarioType.options.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.personalRatio.label}
                          </label>
                          <input
                            type="number"
                            value={params.personalRatio}
                            onChange={(e) => handleParamChange('personalRatio', e.target.value)}
                            step="0.01"
                            min="0"
                            max="1"
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          />
                          <span className="text-xs text-gray-500 mt-1 block">
                            {formatters.percent.format(params.personalRatio)}
                          </span>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            {parameterInfo.days.label}
                          </label>
                          <input
                            type="number"
                            value={params.days}
                            onChange={(e) => handleParamChange('days', e.target.value)}
                            step="1"
                            min="1"
                            max="365"
                            className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Advanced Parameters Toggle */}
                      <div className="border-t border-dark-300 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="flex items-center text-sm text-gray-400 hover:text-brand-400"
                        >
                          <span className="mr-2">{showAdvanced ? 'Hide' : 'Show'} Advanced Parameters</span>
                          <svg 
                            className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Advanced Parameters */}
                      {showAdvanced && (
                        <div className="pt-4 space-y-4 border-t border-dark-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                {parameterInfo.baseReserve.label}
                              </label>
                              <input
                                type="number"
                                value={params.baseReserve}
                                onChange={(e) => handleParamChange('baseReserve', e.target.value)}
                                step="1000"
                                min="1"
                                className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                {parameterInfo.quoteReserve.label}
                              </label>
                              <input
                                type="number"
                                value={params.quoteReserve}
                                onChange={(e) => handleParamChange('quoteReserve', e.target.value)}
                                step="1000"
                                min="1"
                                className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 italic">
                            Pool price: {formatters.price.format(params.quoteReserve / params.baseReserve)} • 
                            Market cap: {formatters.marketCap(params.currentPrice * params.totalSupply)}
                          </div>
                        </div>
                      )}
                      
                      {/* Error message */}
                      {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
                          {error}
                        </div>
                      )}
                      
                      {/* Submit Button */}
                      <div className="pt-4 flex items-center space-x-4">
                        <button
                          type="submit"
                          disabled={simulating}
                          className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-dark-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {simulating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></div>
                              Simulating...
                            </div>
                          ) : (
                            'Run Simulation'
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleGridSimulation}
                          disabled={simulating}
                          className="flex-1 bg-dark-300 hover:bg-dark-400 text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dark-400 focus:ring-offset-2 focus:ring-offset-dark-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Grid Simulation
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                
                {activeTab === 'grid' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 mb-4">Grid Configuration</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Acquisition Levels
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {parameterInfo.acquisitionLevel.options.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleAcquisitionLevel(option.value as AcquisitionLevel)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                gridParams.acquisitionLevels.includes(option.value as AcquisitionLevel)
                                  ? 'bg-brand-500/50 border border-brand-500 text-brand-300'
                                  : 'bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Market Scenarios
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {parameterInfo.scenarioType.options.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleScenario(option.value as ScenarioType)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                gridParams.scenarios.includes(option.value as ScenarioType)
                                  ? 'bg-brand-500/50 border border-brand-500 text-brand-300'
                                  : 'bg-dark-300/50 border border-dark-400 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mt-2">
                        Grid simulation will run multiple simulations using combinations of the selected acquisition 
                        levels and market scenarios. This allows for comparing different liquidation strategies.
                      </p>
                      
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={handleGridSimulation}
                          disabled={simulating || gridParams.acquisitionLevels.length === 0 || gridParams.scenarios.length === 0}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-dark-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {simulating ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></div>
                              Running Grid Simulation...
                            </div>
                          ) : (
                            'Run Grid Simulation'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'results' && !breakdown && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-gray-400 text-center">
                      <p>No simulation results yet.</p>
                      <p className="text-sm mt-2">Configure parameters and run a simulation to see results here.</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'results' && breakdown && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark-300/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-400 uppercase">Total Proceeds</h4>
                        <p className="text-xl font-bold text-brand-400">{breakdown.totalProceeds}</p>
                      </div>
                      <div className="bg-dark-300/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-400 uppercase">Average Sell Price</h4>
                        <p className="text-xl font-bold text-gray-100">{breakdown.averageSellPrice}</p>
                      </div>
                      <div className="bg-dark-300/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-400 uppercase">Tokens Liquidated</h4>
                        <p className="text-xl font-bold text-gray-100">{breakdown.totalTokensSold}</p>
                        <p className="text-xs text-gray-500">{breakdown.percentOfSupply} of total supply</p>
                      </div>
                      <div className="bg-dark-300/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-400 uppercase">Price Impact</h4>
                        <p className="text-xl font-bold text-red-400">{breakdown.priceImpact}</p>
                        <p className="text-xs text-gray-500">Final: {breakdown.finalPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Charts and Results */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'parameters' && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No results to display</h3>
                  <p className="mt-1 text-sm text-gray-500">Run a simulation to see results.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'results' && timelineData.length > 0 && (
              <>
                {/* Proceeds and Price Chart */}
                <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Proceeds & Price</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis dataKey="day" stroke="#A0AEC0" />
                        <YAxis yAxisId="price" tickFormatter={(value) => `$${value.toFixed(6)}`} stroke="#A0AEC0" />
                        <YAxis yAxisId="proceeds" orientation="right" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="#A0AEC0" />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'Price') return formatters.price.format(value as number);
                            if (name === 'Proceeds') return formatters.usd.format(value as number);
                            return value;
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(26, 32, 44, 0.9)",
                            border: "1px solid #2D3748",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Legend />
                        <Line yAxisId="price" type="monotone" dataKey="price" name="Price" stroke="#00E5FF" dot={false} />
                        <Line yAxisId="proceeds" type="monotone" dataKey="proceeds" name="Proceeds" stroke="#7F00FF" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Tokens Sold and Price Impact Chart */}
                <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Tokens Sold & Price Impact</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis dataKey="day" stroke="#A0AEC0" />
                        <YAxis yAxisId="tokens" tickFormatter={(value) => formatters.compact.format(value)} stroke="#A0AEC0" />
                        <YAxis yAxisId="impact" orientation="right" tickFormatter={(value) => `${value.toFixed(2)}%`} stroke="#A0AEC0" />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'Tokens Sold') return formatters.number.format(value as number);
                            if (name === 'Price Impact') return `${(value as number).toFixed(2)}%`;
                            return value;
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(26, 32, 44, 0.9)",
                            border: "1px solid #2D3748",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="tokens" dataKey="tokensSold" name="Tokens Sold" fill="#00E5FF80" />
                        <Line yAxisId="impact" type="monotone" dataKey="priceImpact" name="Price Impact" stroke="#FF0080" dot={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Market Cap & Liquidation Progress */}
                <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-100 mb-4">Market Cap & Liquidation Progress</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                        <XAxis dataKey="day" stroke="#A0AEC0" />
                        <YAxis yAxisId="marketCap" tickFormatter={(value) => formatters.marketCap(value)} stroke="#A0AEC0" />
                        <YAxis yAxisId="percent" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}%`} stroke="#A0AEC0" />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'Market Cap') return formatters.marketCap(value as number);
                            if (name === 'Total Sold (%)') return `${(value as number).toFixed(2)}%`;
                            return value;
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(26, 32, 44, 0.9)",
                            border: "1px solid #2D3748",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Legend />
                        <Area yAxisId="marketCap" type="monotone" dataKey="marketCap" name="Market Cap" fill="#7F00FF40" stroke="#7F00FF" />
                        <Line yAxisId="percent" type="monotone" dataKey="totalSold" name="Total Sold (%)" stroke="#00E5FF" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'grid' && gridResults && (
              <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-100 mb-4">Grid Simulation Results</h3>
                
                {gridResults.map((scenarioResult) => (
                  <div key={scenarioResult.scenario} className="mb-6">
                    <h4 className="text-md font-medium text-gray-200 mb-3">
                      {parameterInfo.scenarioType.options.find(opt => opt.value === scenarioResult.scenario)?.label || scenarioResult.scenario}
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-dark-300">
                        <thead className="bg-dark-300/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Acquisition Level
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Total Proceeds
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Avg Sell Price
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Price Impact
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Tokens Sold
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-dark-300/30 divide-y divide-dark-300">
                          {scenarioResult.acquisitions.map((acquisition) => (
                            <tr key={acquisition.level} className="hover:bg-dark-300/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                                {parameterInfo.acquisitionLevel.options.find(opt => opt.value === acquisition.level)?.label || acquisition.level}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-brand-400 font-medium">
                                {formatters.usd.format(acquisition.totalProceeds)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                                {formatters.price.format(acquisition.averageSellPrice)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-400">
                                {formatters.percent.format(acquisition.priceImpact / 100)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-300">
                                {formatters.compact.format(acquisition.totalTokensSold)}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({formatters.percent.format(acquisition.percentOfSupply / 100)})
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                {/* Comparative Chart */}
                {gridResults.length > 0 && gridResults[0].acquisitions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-200 mb-3">Comparative Analysis</h4>
                    
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={gridResults.flatMap(scenarioResult => 
                            scenarioResult.acquisitions.map(acq => ({
                              name: `${parameterInfo.scenarioType.options.find(opt => opt.value === scenarioResult.scenario)?.label || scenarioResult.scenario} / ${parameterInfo.acquisitionLevel.options.find(opt => opt.value === acq.level)?.label || acq.level}`,
                              proceeds: acq.totalProceeds,
                              priceImpact: acq.priceImpact,
                              scenario: scenarioResult.scenario,
                              level: acq.level
                            }))
                          )}
                          margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                          <XAxis dataKey="name" stroke="#A0AEC0" angle={-45} textAnchor="end" height={80} />
                          <YAxis yAxisId="proceeds" tickFormatter={(value) => formatters.usd.format(value)} stroke="#A0AEC0" />
                          <YAxis yAxisId="impact" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}%`} stroke="#A0AEC0" />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === 'Total Proceeds') return formatters.usd.format(value as number);
                              if (name === 'Price Impact') return `${(value as number).toFixed(2)}%`;
                              return value;
                            }}
                            contentStyle={{
                              backgroundColor: "rgba(26, 32, 44, 0.9)",
                              border: "1px solid #2D3748",
                              borderRadius: "0.5rem",
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="proceeds" dataKey="proceeds" name="Total Proceeds" fill="#7F00FF" />
                          <Line yAxisId="impact" type="monotone" dataKey="priceImpact" name="Price Impact" stroke="#FF0080" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquiditySimulator;