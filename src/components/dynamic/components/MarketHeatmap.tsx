// src/components/dynamic/components/MarketHeatmap.tsx

/**
 * Market Heatmap Component - Production Ready
 * 
 * @description Beautiful, responsive market heatmap with color-coded tokens
 * @author BranchManager69 + Claude Code
 * @version 2.0.0 - Production Ready
 * @created 2025-05-26
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicComponentProps, MarketHeatmapData } from '../types';

// Utility functions for calculations
const formatMarketCap = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const getChangeColor = (change: number): string => {
  if (change > 10) return 'bg-green-500 text-white';
  if (change > 5) return 'bg-green-400 text-white';
  if (change > 0) return 'bg-green-300 text-black';
  if (change > -5) return 'bg-red-300 text-black';
  if (change > -10) return 'bg-red-400 text-white';
  return 'bg-red-500 text-white';
};

const getBorderColor = (change: number): string => {
  if (change > 5) return 'border-green-400/50';
  if (change > 0) return 'border-green-300/30';
  if (change > -5) return 'border-red-300/30';
  return 'border-red-400/50';
};

// Calculate responsive grid columns based on screen size and token count
const getGridColumns = (tokenCount: number, screenSize: 'mobile' | 'tablet' | 'desktop'): string => {
  if (screenSize === 'mobile') {
    if (tokenCount <= 4) return 'grid-cols-2';
    if (tokenCount <= 9) return 'grid-cols-3';
    return 'grid-cols-3';
  }
  
  if (screenSize === 'tablet') {
    if (tokenCount <= 6) return 'grid-cols-3';
    if (tokenCount <= 12) return 'grid-cols-4';
    return 'grid-cols-4';
  }
  
  // Desktop
  if (tokenCount <= 8) return 'grid-cols-4';
  if (tokenCount <= 15) return 'grid-cols-5';
  if (tokenCount <= 24) return 'grid-cols-6';
  return 'grid-cols-8';
};

// Hook for responsive breakpoint detection
const useResponsiveBreakpoint = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

// Individual token cell component
interface TokenCellProps {
  token: MarketHeatmapData['tokens'][0];
  index: number;
  metric: MarketHeatmapData['metric'];
  onClick: (token: MarketHeatmapData['tokens'][0]) => void;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

const TokenCell: React.FC<TokenCellProps> = ({ token, index, metric, onClick, screenSize }) => {
  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  
  // Calculate relative size based on market cap for visual hierarchy
  const getSizeClass = () => {
    if (isMobile) return 'h-16'; // Fixed height on mobile
    if (isTablet) return 'h-20'; // Fixed height on tablet
    
    // Variable heights on desktop based on market cap
    if (token.market_cap > 1e9) return 'h-24';
    if (token.market_cap > 100e6) return 'h-20';
    return 'h-16';
  };

  const displayValue = () => {
    switch (metric) {
      case 'volume': return formatMarketCap(token.volume_24h);
      case 'change': return formatPercentage(token.change_24h);
      case 'liquidity': return formatMarketCap(token.market_cap * 0.1); // Rough liquidity estimate
      default: return formatMarketCap(token.market_cap);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative cursor-pointer rounded-lg border-2 transition-all duration-300
        ${getChangeColor(token.change_24h)}
        ${getBorderColor(token.change_24h)}
        ${getSizeClass()}
        hover:shadow-lg hover:shadow-mauve/20
        flex flex-col justify-between p-2 sm:p-3
        ${isMobile ? 'min-h-[4rem]' : isTablet ? 'min-h-[5rem]' : 'min-h-[4rem]'}
      `}
      onClick={() => onClick(token)}
    >
      {/* Token Symbol */}
      <div className={`font-bold font-mono ${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-sm lg:text-base'}`}>
        {token.symbol}
      </div>
      
      {/* Market Data */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className={`font-semibold ${isMobile ? 'text-[10px]' : isTablet ? 'text-xs' : 'text-xs lg:text-sm'}`}>
          {displayValue()}
        </div>
        
        {/* Change percentage - always shown */}
        <div className={`font-mono ${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} mt-1`}>
          {formatPercentage(token.change_24h)}
        </div>
      </div>

      {/* Category indicator (desktop only) */}
      {!isMobile && token.category && (
        <div className="absolute top-1 right-1">
          <div className={`w-2 h-2 rounded-full ${
            token.category === 'defi' ? 'bg-blue-400' :
            token.category === 'meme' ? 'bg-yellow-400' :
            token.category === 'gaming' ? 'bg-purple-400' :
            'bg-gray-400'
          }`} />
        </div>
      )}

      {/* Risk level indicator (tablet+ only) */}
      {!isMobile && token.risk_level && (
        <div className="absolute bottom-1 right-1">
          <div className={`w-1 h-1 rounded-full ${
            token.risk_level === 'low' ? 'bg-green-300' :
            token.risk_level === 'medium' ? 'bg-yellow-300' :
            'bg-red-300'
          }`} />
        </div>
      )}
    </motion.div>
  );
};

// Main MarketHeatmap component
const MarketHeatmap: React.FC<DynamicComponentProps> = ({ 
  data, 
  className = '', 
  onInteraction,
  state = 'active'
}) => {
  const screenSize = useResponsiveBreakpoint();
  const [selectedToken, setSelectedToken] = useState<MarketHeatmapData['tokens'][0] | null>(null);
  const [sortBy, setSortBy] = useState<'market_cap' | 'change' | 'volume'>('market_cap');

  // Parse and validate data
  const heatmapData: MarketHeatmapData = useMemo(() => {
    if (!data || !data.tokens) {
      // Mock data for demonstration
      return {
        tokens: [
          { symbol: 'SOL', market_cap: 11.2e9, change_24h: 5.2, volume_24h: 890e6, category: 'defi', risk_level: 'low' },
          { symbol: 'BONK', market_cap: 1.8e9, change_24h: -2.1, volume_24h: 45e6, category: 'meme', risk_level: 'high' },
          { symbol: 'JUP', market_cap: 850e6, change_24h: 8.7, volume_24h: 120e6, category: 'defi', risk_level: 'medium' },
          { symbol: 'WIF', market_cap: 720e6, change_24h: -5.3, volume_24h: 89e6, category: 'meme', risk_level: 'high' },
          { symbol: 'ORCA', market_cap: 320e6, change_24h: 12.4, volume_24h: 23e6, category: 'defi', risk_level: 'medium' },
          { symbol: 'POPCAT', market_cap: 180e6, change_24h: 24.8, volume_24h: 15e6, category: 'meme', risk_level: 'high' },
          { symbol: 'RAY', market_cap: 450e6, change_24h: 3.1, volume_24h: 67e6, category: 'defi', risk_level: 'medium' },
          { symbol: 'PYTH', market_cap: 890e6, change_24h: -1.2, volume_24h: 34e6, category: 'defi', risk_level: 'low' },
        ],
        metric: 'market_cap',
        size: 'medium'
      };
    }
    return data;
  }, [data]);

  // Sort tokens based on selected metric
  const sortedTokens = useMemo(() => {
    const sorted = [...heatmapData.tokens].sort((a, b) => {
      switch (sortBy) {
        case 'change': return Math.abs(b.change_24h) - Math.abs(a.change_24h);
        case 'volume': return b.volume_24h - a.volume_24h;
        default: return b.market_cap - a.market_cap;
      }
    });
    return sorted;
  }, [heatmapData.tokens, sortBy]);

  // Handle token selection
  const handleTokenClick = (token: MarketHeatmapData['tokens'][0]) => {
    setSelectedToken(token);
    if (onInteraction) {
      onInteraction('token_selected', { token });
    }
  };

  // Get responsive grid class
  const gridClass = getGridColumns(sortedTokens.length, screenSize);

  if (state === 'loading') {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className={`grid ${gridClass} gap-2`}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-red-400 text-center">
          <div className="text-lg font-mono font-semibold mb-2">Error Loading Market Data</div>
          <div className="text-sm">Please try again later</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-mono text-white font-semibold">Market Heatmap</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {sortedTokens.length} tokens • Updated live
          </p>
        </div>
        
        {/* Sort controls - horizontal on mobile, inline on desktop */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {(['market_cap', 'change', 'volume'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSortBy(metric)}
              className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                sortBy === metric
                  ? 'bg-mauve text-white'
                  : 'bg-darkGrey text-gray-300 hover:bg-mauve/20'
              }`}
            >
              {metric === 'market_cap' ? 'Cap' : metric === 'change' ? 'Change' : 'Volume'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className={`grid ${gridClass} gap-1.5 sm:gap-2 mb-4`}>
        <AnimatePresence mode="popLayout">
          {sortedTokens.map((token, index) => (
            <TokenCell
              key={token.symbol}
              token={token}
              index={index}
              metric={heatmapData.metric || 'market_cap'}
              onClick={handleTokenClick}
              screenSize={screenSize}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Legend - simplified on mobile */}
      <div className="border-t border-mauve/20 pt-3">
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
          <div className="flex items-center space-x-2">
            <span>Colors:</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-[10px]">Gain</span>
              <div className="w-3 h-3 bg-red-500 rounded ml-2"></div>
              <span className="text-[10px]">Loss</span>
            </div>
          </div>
          
          {screenSize !== 'mobile' && (
            <div className="flex items-center space-x-2">
              <span>Size by:</span>
              <span className="text-white">{heatmapData.metric || 'Market Cap'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Token Modal - overlay on all screen sizes */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-darkGrey-dark border border-mauve/30 rounded-lg p-4 sm:p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-mono font-bold text-white">{selectedToken.symbol}</h4>
                <button
                  onClick={() => setSelectedToken(null)}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-white font-mono">{formatMarketCap(selectedToken.market_cap)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Change:</span>
                  <span className={`font-mono ${selectedToken.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedToken.change_24h)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Volume:</span>
                  <span className="text-white font-mono">{formatMarketCap(selectedToken.volume_24h)}</span>
                </div>
                
                {selectedToken.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white capitalize">{selectedToken.category}</span>
                  </div>
                )}
                
                {selectedToken.risk_level && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`capitalize ${
                      selectedToken.risk_level === 'low' ? 'text-green-400' :
                      selectedToken.risk_level === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {selectedToken.risk_level}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketHeatmap;