// src/components/landing/hot-tokens/StandardizedHotTokensList.tsx

/**
 * Standardized Hot Tokens List
 * 
 * Displays a list of "hot" tokens using the standardized DataContainer
 * and useStandardizedTokenData hook
 * 
 * @author BranchManager69
 * @created 2025-04-29
 * @updated 2025-04-30
 * @version 1.9.0
 * 
 * @description
 * This component displays a list of "hot" tokens using the standardized DataContainer
 * and useStandardizedTokenData hook
 * 
 * @param {number} maxTokens - The maximum number of tokens to display
 * @param {boolean} initialLoading - Whether to show the initial loading state
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useSound from 'use-sound';
import { useStandardizedTokenData } from '../../../hooks/data/useStandardizedTokenData';
import { Token } from '../../../types';
import { formatNumber } from '../../../utils/format';
import { DataContainer } from '../../shared/DataContainer';

// Props for the StandardizedHotTokensList component
interface StandardizedHotTokensListProps {
  maxTokens?: number;
  initialLoading?: boolean;
}

// Constants
const MAX_PUMPING_TOKENS = 5; // The maximum number of tokens to display
const INITIAL_LOADING = true; // Whether to show the initial loading state

/**
 * Standardized Hot Tokens List component
 * 
 * Displays a list of "hot" tokens using the standardized DataContainer and useStandardizedTokenData hook
 * 
 * @param {StandardizedHotTokensListProps} props - The props for the component
 * @param {number} props.maxTokens - The maximum number of tokens to display
 * @param {boolean} props.initialLoading - Whether to show the initial loading state
 * 
 * @returns {React.ReactNode} The rendered component
 */
export const StandardizedHotTokensList: React.FC<StandardizedHotTokensListProps> = ({
  maxTokens = MAX_PUMPING_TOKENS,
  initialLoading = INITIAL_LOADING
}) => {
  // Enable/disable sound effects
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Use the standardized token data hook
  const {
    hotTokens,
    isLoading,
    error,
    isConnected,
    connectionState,
    refresh,
    lastUpdate,
    getTokenColor
  } = useStandardizedTokenData('all', 'hot', { status: 'active' }, maxTokens);
  
  // Debug information for the debug panel
  const debugInfo = {
    connectionStatus: connectionState || 'unknown',
    isConnected,
    lastUpdate: lastUpdate?.toISOString() || 'never',
    tokensAvailable: hotTokens.length,
    soundEnabled
  };
  
  // Sound effect for when a token price goes up
  const [playUpSound] = useSound('/assets/media/sounds/token-up.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled
  });

  // Sound effect for when a token price goes down
  const [playDownSound] = useSound('/assets/media/sounds/token-down.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled
  });

  // Header right content with sound toggle and refresh buttons
  const headerRight = (
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
  );

  // Token card renderer
  // [TESTING:  Token interface instead of TokenData]
  const renderToken = useCallback((token: Token, index: number) => {
    const isPositive = Number(token.change24h) >= 0;
    
    return (
      /* Start token card renderer */
      <motion.div
        key={token.contractAddress || token.symbol} // Key for the token card
        layout // Layout for the token card
        layoutId={token.contractAddress || token.symbol} // Layout ID for the token card
        initial={{ opacity: 0, y: 10 }} // Initial animation state
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: [1, 1.02, 1], // Scale animation
          transition: {
            scale: { duration: 0.5 } // Scale transition
          }
        }}
        exit={{ opacity: 0, x: -20 }} // Exit animation state
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          delay: index * 0.1 // Delay for the animation
        }}  
        className="relative" // Relative container for the token card
        onAnimationComplete={() => {
          // Play sound effect on animation complete based on price change
          if (soundEnabled) {
            const change = Number(token.change24h); // Get the price change over 24 hours
            if (change > 0) {
              playUpSound(); // Play the up sound effect if the price is up
            } else if (change < 0) {
              playDownSound(); // Play the down sound effect if price is down
            }
          }
        }}
      >
        {/* Start token card hyperlink */}
        <Link 
          to={`/tokens?symbol=${token.symbol}`}
          className="block"
        >
          {/* Start token card container */}
          <div className="relative bg-dark-300/40 backdrop-blur-sm rounded-lg border border-dark-400/30 overflow-hidden transition-all duration-300 hover:border-yellow-500/30 group">
            {/* Dynamic token card background based on price changes */}
            <div 
              className={`absolute inset-0 transition-opacity duration-300 ${
                Number(token.change24h) >= 0 
                  ? 'bg-gradient-to-r from-green-500/5 via-transparent to-transparent' 
                  : 'bg-gradient-to-r from-red-500/5 via-transparent to-transparent'
              } ${Number(token.change24h) >= 3 || Number(token.change24h) <= -3 ? 'opacity-100' : 'opacity-0'}`}
            ></div>
            
            {/* Ranking badge with animation */}
            <div className="absolute -top-1 -left-1 w-8 h-8">
              <div 
                className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-br-lg flex items-center justify-center text-black font-bold text-xs shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 origin-top-left"
              >
                {/* Ranking badge number */}
                #{index + 1}
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-yellow-500/20 animate-pulse rounded-br-lg"></div>
            </div>
            
            {/* Heat effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            
            {/* Main content container */}
            <div className="p-3 pl-9 flex items-center">

              {/* Start of token logo container */}
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden shadow-md mr-3"
                style={{
                  background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                }}
              >
                {/* Start of token logo */}
                {token.images?.imageUrl ? (
                  <img 
                    src={token.images.imageUrl} 
                    alt={token.symbol}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {/* Token symbol (3 characters) */}
                    {token.symbol.slice(0, 3)}
                  </span>
                )}
                {/* End of token logo */}

                {/* Start of price change indicator overlay */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-1 ${isPositive ? 'bg-green-500' : 'bg-red-500'} opacity-90`}
                ></div>
                {/* End of price change indicator overlay */}

              </div>
              {/* End of token logo container */}
              
              {/* Start of token data container */}
              <div className="flex-1 min-w-0 mr-4">

                {/* Start of token symbol and name container */}
                <div className="flex items-center">
                  {/* Token symbol */}
                  <h4 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                    {/* Token symbol */}
                    {token.symbol}
                  </h4>
                  {/* Token name */}
                  <span className="ml-2 text-xs text-gray-400 truncate">
                    {/* Token name */}
                    {token.name}
                  </span>
                </div>
                {/* End of token symbol and name container */}

                {/* Start of token price and volume container */}
                <div className="flex items-center justify-between mt-1">
                  {/* Token USD price */}
                  <div className="text-sm font-mono text-white">
                    {/* Token USD price (8 decimals) */}
                    ${formatNumber(token.price, 8)}
                  </div>
                  
                  {/* Volume badge */}
                  <div className="text-xs text-gray-400 flex items-center">
                    {/* Volume label */}
                    <span className="mr-1">
                      Vol:
                    </span>
                    {/* Volume value */}
                    <span className="font-mono">
                      {/* Volume (0 decimals) */}
                      ${formatNumber(Number(token.volume24h), 0)}
                    </span>
                  </div>
                </div>
                {/* End of token price and volume container */}
              </div>
              {/* End of token data container */}

              {/* Start of price change container */}
              <div 
                className={`flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg ${
                  isPositive 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                } transition-all duration-300`}
              >
                {/* Start of price change value */}
                <span className="font-mono text-base font-semibold">
                  {isPositive ? '+' : ''}{formatNumber(token.change24h)}%
                </span>
                {/* End of price change value */}
              </div>
              {/* End of price change container */}

            </div>
          </div>
        </Link>
        {/* End of token card hyperlink */}

      </motion.div>
    );
  }, [getTokenColor, playDownSound, playUpSound, soundEnabled]);

  return (
    <DataContainer
      title="DegenDuel • Pumping Tokens"
      subtitle="DegenDuel • Pumping Tokens"
      titleColor="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500"
      isLoading={isLoading || initialLoading}
      error={error}
      debugInfo={debugInfo}
      onRetry={refresh}
      isLive={isConnected}
      headerRight={headerRight}
      variant="token"
    >
      {/* Hot tokens list with improved transitions */}
      <div className="relative space-y-3">
        {/* Use AnimatePresence with custom mode for smoother transitions */}
        <AnimatePresence mode="popLayout">
          {/* Render the tokens - using hotTokens which is Token[] type */}
          {hotTokens.map((token, index) => renderToken(token, index))}
        </AnimatePresence>
        
        {/* Handle empty state */}
        {!isLoading && !error && hotTokens.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-4m0 0H5m4 0h4M9 13m0-4V5m0 4H5m4 0h4m-4 4a4 4 0 11-8 0 4 4 0 018 0zM19 10a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No Pumping Tokens</h3>
            <p className="mt-1 text-sm text-gray-500">Looks like the market is quiet right now.</p>
          </div>
        )}
      </div>
      
      {/* Footer section */}
      <div className="mt-4 text-center">
        <Link 
          to="/tokens" 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20
            border border-yellow-500/30 text-yellow-400 transition-all duration-300 text-sm font-cyber"
        >
          <span>VIEW ALL TOKENS</span>
          <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </DataContainer>
  );
};

export default StandardizedHotTokensList;