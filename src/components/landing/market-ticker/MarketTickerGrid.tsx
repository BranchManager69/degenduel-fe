// src/components/landing/market-ticker/MarketTickerGrid.tsx

/**
 * Market Ticker Grid Component
 * 
 * @description A high-density, NYSE-style grid display for token data that flashes on updates
 * without immediate reordering. Periodic reordering occurs on interval.
 * 
 * @author Claude
 * @version 1.0.0
 * @created 2025-05-10
 */

import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useSound from 'use-sound';
import { useStandardizedTokenData } from '../../../hooks/data/useStandardizedTokenData';
import { Token } from '../../../types';
import { formatNumber } from '../../../utils/format';

// Props for the MarketTickerGrid component
interface MarketTickerGridProps {
  maxTokens?: number;
  initialLoading?: boolean;
  title?: string;
  subtitle?: string;
  reorderInterval?: number; // Milliseconds between reordering (default: 10000ms)
  viewAllLink?: string;
  showBillboard?: boolean; // Whether to show the detail billboard
}

// Individual token data display row
const TokenRow: React.FC<{
  token: Token;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: () => void;
  lastPrices: Record<string, number>;
}> = ({ token, index, isSelected, onSelect, onUpdate, lastPrices }) => {
  const controls = useAnimation();
  const rowRef = useRef<HTMLDivElement>(null);
  const currentPrice = Number(token.price);
  const lastPrice = lastPrices[token.symbol] || currentPrice;
  
  // Determine price change state: 1 = up, -1 = down, 0 = unchanged
  const priceChangeState = useMemo(() => {
    if (!lastPrice || lastPrice === currentPrice) return 0;
    return currentPrice > lastPrice ? 1 : -1;
  }, [currentPrice, lastPrice]);
  
  // Determine if 24h change is positive or negative
  const is24hPositive = Number(token.change24h) >= 0;
  
  // Flash animation on update
  useEffect(() => {
    if (priceChangeState !== 0) {
      controls.start({
        backgroundColor: [
          priceChangeState > 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
          'rgba(0, 0, 0, 0)'
        ],
        transition: { duration: 1.5, ease: "easeOut" }
      });
      onUpdate();
    }
  }, [priceChangeState, controls, onUpdate]);
  
  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);
  
  return (
    <motion.div
      ref={rowRef}
      animate={controls}
      className={`grid grid-cols-12 gap-0 py-1.5 px-3 cursor-pointer text-sm border-b border-gray-800/40 transition-colors ${
        isSelected 
          ? 'bg-brand-900/30 border-l-2 border-l-brand-500' 
          : 'hover:bg-gray-800/20 border-l-2 border-l-transparent'
      }`}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Rank */}
      <div className="col-span-1 font-mono text-gray-500 flex items-center">
        {index + 1}
      </div>
      
      {/* Symbol & Name */}
      <div className="col-span-2 font-semibold text-white flex items-center gap-2">
        {token.images?.imageUrl ? (
          <img src={token.images.imageUrl} alt={token.symbol} className="w-4 h-4 rounded-full" />
        ) : (
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
            is24hPositive ? 'bg-green-500/30' : 'bg-red-500/30'
          }`}>
            {token.symbol.slice(0, 1)}
          </div>
        )}
        <span className="truncate">{token.symbol}</span>
      </div>
      
      {/* Name (hidden on small screens) */}
      <div className="col-span-3 hidden sm:flex items-center text-gray-400 truncate">
        <span className="truncate text-xs">{token.name}</span>
      </div>
      
      {/* Price */}
      <div className={`col-span-2 font-mono flex items-center justify-end ${
        priceChangeState > 0 ? 'text-green-400' : 
        priceChangeState < 0 ? 'text-red-400' : 
        'text-white'
      }`}>
        <div className="flex items-center">
          <span>${formatNumber(token.price, token.price < 0.01 ? 8 : 6)}</span>
          
          {/* Price change indicator arrow */}
          {priceChangeState !== 0 && (
            <motion.span 
              className="ml-1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              {priceChangeState > 0 ? '▲' : '▼'}
            </motion.span>
          )}
        </div>
      </div>
      
      {/* 24h Change */}
      <div className={`col-span-2 flex items-center justify-end ${
        is24hPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        <div className={`px-2 py-0.5 rounded font-mono text-xs ${
          is24hPositive ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          {is24hPositive ? '+' : ''}{formatNumber(token.change24h)}%
        </div>
      </div>
      
      {/* Volume - hidden on small screens */}
      <div className="col-span-2 hidden sm:flex items-center justify-end font-mono text-gray-300">
        ${formatNumber(token.volume24h)}
      </div>
    </motion.div>
  );
};

// Token detail billboard component
const TokenBillboard: React.FC<{ token: Token | null }> = ({ token }) => {
  if (!token) return null;
  
  const is24hPositive = Number(token.change24h) >= 0;
  
  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50 rounded-lg p-4 mb-4 relative overflow-hidden"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.03)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine"></div>
      </div>
      
      {/* Cyberpunk corner cuts */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-purple-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-purple-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-brand-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        {/* Logo and token info */}
        <div className="flex items-start gap-4">
          {/* Token logo with glow effect */}
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full blur-md ${
              is24hPositive ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}></div>
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br ${
              is24hPositive 
                ? 'from-green-900/60 to-green-700/30' 
                : 'from-red-900/60 to-red-700/30'
            } border ${
              is24hPositive ? 'border-green-500/40' : 'border-red-500/40'
            }`}>
              {token.images?.imageUrl ? (
                <img src={token.images.imageUrl} alt={token.symbol} className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-2xl font-bold text-white">{token.symbol.slice(0, 3)}</span>
              )}
            </div>
          </div>
          
          {/* Token details */}
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white">{token.symbol}</h3>
              <span className="text-sm text-gray-400 truncate">{token.name}</span>
            </div>
            
            <div className="flex items-baseline gap-3 mt-1">
              <div className="text-xl font-mono font-bold text-white">${formatNumber(token.price)}</div>
              <div className={`px-2 py-1 rounded ${
                is24hPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {is24hPositive ? '+' : ''}{formatNumber(token.change24h)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Token metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 ml-auto">
          {/* Market Cap */}
          <div className="bg-gray-800/40 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Market Cap</div>
            <div className="text-base font-mono text-white">${formatNumber(token.marketCap)}</div>
          </div>
          
          {/* 24h Volume */}
          <div className="bg-gray-800/40 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">24h Volume</div>
            <div className="text-base font-mono text-white">${formatNumber(token.volume24h)}</div>
          </div>
          
          {/* Holders / Social Status */}
          <div className="bg-gray-800/40 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Social Score</div>
            <div className="text-base font-mono text-white">
              <div className="flex items-center">
                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${is24hPositive ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(Math.abs(Number(token.change24h) * 2), 100)}%` }}></div>
                </div>
                <span className="ml-2">{Math.min(Math.abs(Math.round(Number(token.change24h) * 2)), 100)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="flex items-center">
          <Link
            to={`/tokens?symbol=${token.symbol}`}
            className="px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-md hover:from-brand-600 hover:to-purple-700 transition-all whitespace-nowrap"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * MarketTickerGrid Component
 */
export const MarketTickerGrid: React.FC<MarketTickerGridProps> = ({
  maxTokens = 10,
  initialLoading = false,
  title = "DegenDuel • Market Ticker",
  subtitle = "Live-updating market data",
  reorderInterval = 10000, // 10 seconds
  viewAllLink = "/tokens",
  showBillboard = true
}) => {
  // Token data hooks
  const {
    topTokens,
    isLoading,
    error,
    isConnected,
    connectionState,
    refresh,
    lastUpdate
  } = useStandardizedTokenData("all", "marketCap", {}, 5, maxTokens);
  
  // State
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPrices, setLastPrices] = useState<Record<string, number>>({});
  
  // Sound effects
  const [playUpSound] = useSound('/assets/media/sounds/token-up.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled
  });
  
  const [playDownSound] = useSound('/assets/media/sounds/token-down.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled
  });
  
  // Update tokens when data changes
  useEffect(() => {
    if (topTokens && topTokens.length > 0) {
      // Save previous prices before updating
      const newLastPrices: Record<string, number> = {};
      topTokens.forEach(token => {
        if (tokens.find(t => t.symbol === token.symbol)) {
          // Find this token in the current state to compare
          const currentToken = tokens.find(t => t.symbol === token.symbol);
          if (currentToken) {
            newLastPrices[token.symbol] = Number(currentToken.price);
          }
        }
      });
      
      if (Object.keys(newLastPrices).length > 0) {
        setLastPrices(prev => ({...prev, ...newLastPrices}));
      }
      
      // Update tokens list
      setTokens(topTokens);
    }
  }, [topTokens, tokens]);
  
  // Handle token update (play sound)
  const handleTokenUpdate = useCallback((isPositive: boolean) => {
    if (soundEnabled) {
      if (isPositive) {
        playUpSound();
      } else {
        playDownSound();
      }
    }
  }, [soundEnabled, playUpSound, playDownSound]);
  
  // Reorder tokens periodically, keeping selected token in view
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (tokens.length > 0 && !isLoading) {
        // Call the refresh function to get fresh data
        refresh();
      }
    }, reorderInterval);
    
    return () => clearInterval(intervalId);
  }, [tokens, isLoading, refresh, reorderInterval]);
  
  // Cyberpunk-styled header
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-brand-400 via-purple-400 to-brand-500 text-transparent bg-clip-text relative group">
          {title}
          <span className="absolute -left-[1px] top-[1px] text-2xl font-bold font-cyber text-brand-600/30 select-none">{title}</span>
        </h2>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          <span className="text-sm text-brand-400 font-cyber">
            {subtitle}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Sound toggle button */}
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
            soundEnabled 
              ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
              : 'bg-gray-800/30 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400'
          }`}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Connection indicator */}
        <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-1.5`}></span>
          <span className="text-xs font-mono">{isConnected ? 'LIVE' : 'SYNC'}</span>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={refresh}
          className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
          title="Refresh data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
  
  // Render table header
  const renderTableHeader = () => (
    <div className="grid grid-cols-12 gap-0 py-2 px-3 border-b border-gray-700/50 text-xs text-gray-400 font-semibold">
      <div className="col-span-1">#</div>
      <div className="col-span-2">Symbol</div>
      <div className="col-span-3 hidden sm:block">Name</div>
      <div className="col-span-2 text-right">Price</div>
      <div className="col-span-2 text-right">24h %</div>
      <div className="col-span-2 hidden sm:block text-right">Volume</div>
    </div>
  );
  
  // Loading state
  if (isLoading || initialLoading) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        {renderHeader()}
        
        <div className="animate-pulse space-y-3">
          {renderTableHeader()}
          
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-0 py-1.5 px-3 border-b border-gray-800/40">
              <div className="col-span-1 h-4 bg-gray-700/30 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded"></div>
              <div className="col-span-3 hidden sm:block h-4 bg-gray-700/30 rounded"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded ml-auto w-3/4"></div>
              <div className="col-span-2 h-4 bg-gray-700/30 rounded ml-auto w-1/2"></div>
              <div className="col-span-2 hidden sm:block h-4 bg-gray-700/30 rounded ml-auto w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        {renderHeader()}
        
        <div className="text-center py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 mb-4">
            <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-red-400 mb-2">Oops! Something went wrong.</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          
          <button 
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (tokens.length === 0) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        {renderHeader()}
        
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-4m0 0H5m4 0h4M9 13m0-4V5m0 4H5m4 0h4m-4 4a4 4 0 11-8 0 4 4 0 018 0zM19 10a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">No Tokens Available</h3>
          <p className="mt-1 text-sm text-gray-500">Looks like the market is quiet right now.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:50px_50px] opacity-10"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10">
        {renderHeader()}
      </div>
      
      {/* Selected token billboard */}
      <div className="relative z-10">
        <AnimatePresence>
          {showBillboard && selectedToken && (
            <TokenBillboard token={selectedToken} />
          )}
        </AnimatePresence>
      </div>
      
      {/* Market ticker table */}
      <div className="relative z-10 bg-dark-300/20 backdrop-blur-sm rounded-lg border border-gray-800/40 overflow-hidden">
        {/* Table header */}
        {renderTableHeader()}
        
        {/* Table body */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800/20 scrollbar-thumb-gray-600/40">
          {tokens.map((token, index) => (
            <TokenRow
              key={token.contractAddress || token.symbol}
              token={token}
              index={index}
              isSelected={selectedToken?.symbol === token.symbol}
              onSelect={() => setSelectedToken(token === selectedToken ? null : token)}
              onUpdate={() => handleTokenUpdate(Number(token.price) > (lastPrices[token.symbol] || 0))}
              lastPrices={lastPrices}
            />
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-center relative z-10">
        <Link 
          to={viewAllLink} 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20
            border border-brand-500/30 text-brand-400 transition-all duration-300 text-sm font-cyber"
        >
          <span>VIEW ALL TOKENS</span>
          <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default MarketTickerGrid;