import React, { useEffect, useRef, useCallback } from "react";
import { OptimizedTokenCard } from "./OptimizedTokenCard";
import { Token } from "../../types";
import { formatNumber } from "../../utils/format";

interface CreativeTokensGridProps {
  tokens: Token[];
  selectedTokenSymbol?: string | null;
  onTokenClick?: (token: Token) => void;
}

/**
 * CreativeTokensGrid - A redesigned grid with multi-tiered layout,
 * visual groupings, and dynamic sizing
 */
export const CreativeTokensGrid: React.FC<CreativeTokensGridProps> = React.memo(({ 
  tokens, 
  selectedTokenSymbol,
  onTokenClick
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected token with a delay
  useEffect(() => {
    if (selectedTokenSymbol && selectedTokenRef.current) {
      const timeout = setTimeout(() => {
        selectedTokenRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedTokenSymbol]);

  // Memoized token click handler
  const handleTokenClick = useCallback((token: Token) => {
    if (onTokenClick) {
      onTokenClick(token);
    }
  }, [onTokenClick]);

  // Sort tokens by different metrics
  const tokensByMarketCap = [...tokens].sort((a, b) => 
    parseFloat(b.marketCap) - parseFloat(a.marketCap)
  );
  
  // Top gainers - sort by highest positive change
  const tokensByGain = [...tokens].sort((a, b) => 
    parseFloat(b.change24h) - parseFloat(a.change24h)
  );
  
  // Calculate "hotness" based on a combination of change, volume, and recency
  const calculateHotness = (token: Token) => {
    // Normalized values between 0-1
    const changeNormalized = parseFloat(token.change24h) / 100; // Assuming max 100% change
    const volumeNormalized = Math.min(parseFloat(token.volume24h) / 10000000000, 1); // Cap at 10B volume
    
    // Formula: 60% weight on change, 40% on volume
    return (changeNormalized * 0.6) + (volumeNormalized * 0.4);
  };
  
  // Hottest tokens by our custom algorithm
  const tokensByHotness = [...tokens].sort((a, b) => 
    calculateHotness(b) - calculateHotness(a)
  );
  
  // Create our groupings based on the sorted lists
  const topTierTokens = tokensByMarketCap.slice(0, 2);  // Top 2 by market cap
  const midTierTokens = tokensByGain.slice(0, 4);       // Top 4 gainers
  const trendingTokens = tokensByHotness.slice(0, 5);   // Top 5 hottest
  
  // Exclude tokens already shown in featured sections
  const featuredTokenAddresses = new Set([
    ...topTierTokens.map(t => t.contractAddress),
    ...midTierTokens.map(t => t.contractAddress)
  ]);
  
  const restTokens = tokens.filter(
    token => !featuredTokenAddresses.has(token.contractAddress)
  );

  // We no longer need this function as we're using inline styling
  // const getTrendColor = (change: string) => {
  //   const changeNum = parseFloat(change);
  //   return changeNum >= 0 ? 'bg-green-500' : 'bg-red-500';
  // };

  // Simplified token mini card for trending section
  const TrendingToken = ({ token, index }: { token: Token, index: number }) => {
    const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
    
    // Calculate hotness score for display
    const hotnessScore = calculateHotness(token) * 100;
    
    return (
      <div 
        className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 cursor-pointer bg-dark-300/60 backdrop-blur-md relative
          ${isSelected ? 'ring-2 ring-brand-500' : 'hover:bg-dark-300/80 hover:scale-[1.02]'}`}
        onClick={() => handleTokenClick(token)}
      >
        {/* Ranking badge */}
        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-yellow-500 text-xs font-bold text-white flex items-center justify-center shadow-lg">
          {index + 1}
        </div>
        
        {/* Cyberpunk corner cuts */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500/50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500/50"></div>
        
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)` }}
        >
          {token.images?.imageUrl && (
            <img 
              src={token.images.imageUrl} 
              alt={token.symbol}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {!token.images?.imageUrl && (
            <span className="text-xs font-bold text-white">{token.symbol.slice(0, 3)}</span>
          )}
        </div>
        
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-medium text-white">{token.symbol}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">${formatNumber(token.price)}</span>
            <div className="h-3 w-px bg-dark-400"></div>
            <span className="text-xs text-yellow-400">Heat: {hotnessScore.toFixed(0)}</span>
          </div>
        </div>
        
        <div className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${parseFloat(token.change24h) >= 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'} font-medium`}>
          {formatNumber(token.change24h)}%
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Background effects - Enhanced cyberpunk grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-cyber-500/10"></div>
        
        {/* Horizontal grid lines with glitch effect */}
        <div className="absolute w-full h-px top-[25%] bg-brand-500/20"></div>
        <div className="absolute w-[95%] h-px top-[25.5%] left-[2%] bg-brand-500/10"></div>
        <div className="absolute w-full h-px top-[65%] bg-cyber-500/20"></div>
        <div className="absolute w-[97%] h-px top-[65.5%] right-0 bg-cyber-500/10"></div>
        
        {/* Vertical grid lines */}
        <div className="absolute h-full w-px left-1/3 bg-brand-500/10"></div>
        <div className="absolute h-[90%] w-px left-[33.5%] top-[5%] bg-brand-500/5"></div>
        <div className="absolute h-full w-px right-1/3 bg-cyber-500/10"></div>
        
        {/* Corner angular cuts */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-500/30 rounded-tl-md"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-md"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-500/30 rounded-bl-md"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-md"></div>
        
        {/* Digital code lines */}
        <div className="absolute top-2 left-12 w-20 h-2 flex items-center">
          <div className="w-1 h-1 bg-brand-500/40 mr-1"></div>
          <div className="w-3 h-1 bg-brand-500/30 mr-1"></div>
          <div className="w-2 h-1 bg-brand-500/50 mr-1"></div>
          <div className="w-4 h-1 bg-brand-500/20"></div>
        </div>
        <div className="absolute bottom-2 right-12 w-20 h-2 flex items-center justify-end">
          <div className="w-4 h-1 bg-cyan-500/20 mr-1"></div>
          <div className="w-2 h-1 bg-cyan-500/50 mr-1"></div>
          <div className="w-3 h-1 bg-cyan-500/30 mr-1"></div>
          <div className="w-1 h-1 bg-cyan-500/40"></div>
        </div>
      </div>

      {/* Main grid container */}
      <div ref={containerRef} className="relative z-10">
        {/* Tier 1: Featured section - Larger cards for top tokens */}
        {topTierTokens.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-3 relative">
              <div className="w-1.5 h-6 bg-brand-500 mr-2 -skew-x-12"></div>
              <h3 className="text-xl font-bold text-white relative">
                Largest Market Cap
                <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-brand-500/70 to-transparent"></span>
              </h3>
              <div className="ml-4 text-xs text-brand-400 flex items-center">
                <span className="inline-block w-2 h-2 bg-brand-500 mr-1"></span>
                <span className="uppercase tracking-wider">Top by Value</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topTierTokens.map(token => {
                const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
                
                return (
                  <div 
                    key={token.contractAddress}
                    ref={isSelected ? selectedTokenRef : null}
                    className={`
                      relative transition-all duration-300 ease-in-out bg-dark-200/60 backdrop-blur-lg 
                      rounded-xl overflow-hidden border border-dark-300/60
                      ${isSelected ? 'ring-2 ring-brand-500 z-20' : 'hover:border-brand-400/30 z-10'}
                    `}
                  >
                    {/* Cyberpunk corner cuts */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5"></div>
                    <div className="flex md:flex-row flex-col h-full">
                      {/* Left side - image/logo */}
                      <div className="md:w-1/3 h-32 md:h-auto relative overflow-hidden">
                        <div 
                          className="absolute inset-0 flex items-center justify-center" 
                          style={{
                            background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                          }}
                        >
                          <span className="font-display text-4xl text-white/90 font-bold drop-shadow-lg">
                            {token.symbol}
                          </span>
                        </div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold z-30">
                            ✦
                          </div>
                        )}
                      </div>
                      
                      {/* Right side - token info */}
                      <div className="md:w-2/3 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-2xl font-bold text-white flex items-center">
                                {token.symbol}
                                <span className="ml-2 text-xs text-cyan-400 font-mono bg-dark-400/40 px-2 py-0.5 rounded">
                                  {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                                </span>
                              </h3>
                              <p className="text-gray-400 text-sm">{token.name}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium 
                              ${parseFloat(token.change24h) >= 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}
                            >
                              {formatNumber(token.change24h)}%
                            </div>
                          </div>
                          
                          {/* Enhanced stats with consistent corner styling - 3 columns */}
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 relative overflow-hidden group">
                              {/* Decorative corner element */}
                              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-500/30"></div>
                              
                              <p className="text-gray-400 text-xs uppercase font-mono">Price</p>
                              <p className="text-white font-mono text-base">${formatNumber(token.price)}</p>
                            </div>
                            
                            <div className="bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 relative overflow-hidden group">
                              {/* Decorative corner element */}
                              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/30"></div>
                              
                              <p className="text-gray-400 text-xs uppercase font-mono">Market Cap</p>
                              <p className="text-white font-mono text-base">${formatNumber(token.marketCap)}</p>
                            </div>
                            
                            <div className="bg-dark-300/60 backdrop-blur-sm rounded-lg p-2 border border-white/5 relative overflow-hidden group">
                              {/* Decorative corner element */}
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500/30"></div>
                              
                              <p className="text-gray-400 text-xs uppercase font-mono">Volume</p>
                              <p className="text-white font-mono text-base">${formatNumber(token.volume24h)}</p>
                            </div>
                          </div>
                          
                          {/* Additional information row */}
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            <div className="flex space-x-2 items-center mt-2">
                              {token.socials && (
                                <div className="flex space-x-1">
                                  {token.socials?.twitter?.url && (
                                    <a
                                      href="#"
                                      className="w-6 h-6 flex items-center justify-center bg-dark-300/80 text-xs rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      𝕏
                                    </a>
                                  )}
                                  {token.socials?.telegram?.url && (
                                    <a
                                      href="#"
                                      className="w-6 h-6 flex items-center justify-center bg-dark-300/80 text-xs rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      ✈️
                                    </a>
                                  )}
                                  {token.socials?.discord?.url && (
                                    <a
                                      href="#"
                                      className="w-6 h-6 flex items-center justify-center bg-dark-300/80 text-xs rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      💬
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex-1 h-px bg-gradient-to-r from-brand-500/20 via-transparent to-brand-500/20"></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <button 
                            onClick={() => handleTokenClick(token)}
                            className="w-full py-2 rounded text-sm font-medium bg-dark-300/80 border border-brand-500/30 text-white hover:bg-brand-500/20 transition-colors relative overflow-hidden group"
                          >
                            {/* Decorative corner cuts */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-500/50"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50"></div>
                            
                            {/* Button light effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/0 to-brand-500/0 group-hover:from-brand-500/0 group-hover:via-brand-500/10 group-hover:to-brand-500/0 transition-all duration-500"></div>
                            
                            <span className="relative z-10">View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Tier 2: Mid-tier tokens - medium cards with more info */}
        {midTierTokens.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-3 relative">
              <div className="w-1.5 h-6 bg-cyan-500 mr-2 -skew-x-12"></div>
              <h3 className="text-xl font-bold text-white relative">
                Top Gainers
                <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-cyan-500/70 to-transparent"></span>
              </h3>
              <div className="ml-4 text-xs text-cyan-400 flex items-center">
                <span className="inline-block w-2 h-2 bg-cyan-500 mr-1"></span>
                <span className="uppercase tracking-wider">24h Change %</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {midTierTokens.map(token => {
                const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
                
                return (
                  <div 
                    key={token.contractAddress}
                    ref={isSelected ? selectedTokenRef : null}
                    onClick={() => handleTokenClick(token)}
                    className={`
                      relative transition-all duration-300 ease-in-out p-4
                      bg-dark-200/60 backdrop-blur-md rounded-lg cursor-pointer
                      border border-dark-300/60 hover:border-brand-400/30
                      ${isSelected ? 'ring-2 ring-brand-500' : ''}
                    `}
                  >
                    {/* Highlight ribbon for top gainers */}
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-cyan-500/90 text-white text-xs rounded shadow-lg z-20">
                      #{midTierTokens.indexOf(token) + 1}
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                        }}
                      >
                        {token.images?.imageUrl && (
                          <img 
                            src={token.images.imageUrl} 
                            alt={token.symbol}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        {!token.images?.imageUrl && (
                          <span className="text-sm font-bold text-white">{token.symbol.slice(0, 3)}</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
                        <p className="text-gray-400 text-xs">{token.name}</p>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold">
                          ✦
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="text-lg font-mono text-white">${formatNumber(token.price)}</div>
                      <div className={`text-sm px-2 py-0.5 rounded ${parseFloat(token.change24h) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-medium`}>
                        {formatNumber(token.change24h)}%
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-dark-300/60">
                      <div className="text-xs text-gray-400">
                        24h Volume: <span className="text-white">${formatNumber(token.volume24h)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Tier 3: Standard grid for remaining tokens */}
        {restTokens.length > 0 && (
          <div>
            <div className="flex items-center mb-3 relative">
              <div className="w-1.5 h-6 bg-purple-500 mr-2 -skew-x-12"></div>
              <h3 className="text-xl font-bold text-white relative">
                All Tokens
                <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-purple-500/70 to-transparent"></span>
              </h3>
              
              {/* Visual line with digital circuit look */}
              <div className="ml-4 flex items-center flex-1">
                <div className="w-2 h-2 border border-purple-500/50 rotate-45"></div>
                <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-grow"></div>
                <div className="w-1 h-1 bg-purple-500/50 mr-1"></div>
                <div className="w-2 h-1 bg-purple-500/40 mr-4"></div>
                <span className="text-xs text-purple-400 uppercase tracking-wider">Market Data</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {restTokens.map(token => {
                const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
                
                return (
                  <div 
                    key={token.contractAddress}
                    ref={isSelected ? selectedTokenRef : null}
                    className={`relative transition-all duration-300 ease-in-out
                      ${isSelected ? 'scale-105 z-20' : 'hover:scale-[1.03] z-10'}`}
                  >
                    <OptimizedTokenCard 
                      token={token} 
                      isSelected={isSelected}
                      onClick={() => handleTokenClick(token)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {tokens.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 bg-dark-200/60 backdrop-blur-md rounded-lg border border-dark-300/60">
            <div className="text-2xl text-white/50 mb-2">No tokens found</div>
            <div className="text-gray-400">Try adjusting your search or filters</div>
          </div>
        )}
        
        {/* Trending Section - Integrated into main layout */}
        <div className="mt-10 mb-10">
          <div className="flex items-center mb-3 relative">
            <div className="w-1.5 h-6 bg-yellow-500 mr-2 -skew-x-12"></div>
            <h3 className="text-xl font-bold text-white relative">
              Hottest Tokens
              <span className="absolute -bottom-1 left-0 w-full h-px bg-gradient-to-r from-yellow-500/70 to-transparent"></span>
            </h3>
            
            {/* Visual line with active elements */}
            <div className="ml-4 flex items-center flex-1">
              <div className="h-px bg-gradient-to-r from-yellow-500/50 via-yellow-500/30 to-transparent flex-grow relative">
                <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-500/80 rounded-full"></div>
                <div className="absolute top-0 left-2/3 w-1 h-1 bg-yellow-500/60 rounded-full"></div>
              </div>
              <div className="ml-2 h-4 px-2 flex items-center justify-center bg-yellow-500/10 border border-yellow-500/30 rounded-sm">
                <span className="text-xs text-yellow-400 uppercase tracking-wider animate-pulse">Popularity</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {trendingTokens.map((token, index) => (
              <TrendingToken key={token.contractAddress} token={token} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Helper function to get a color based on token symbol  
const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    SOL: '#14F195',
    BTC: '#F7931A',
    ETH: '#627EEA',
    DOGE: '#C3A634',
    ADA: '#0033AD',
    WIF: '#9945FF',
    PEPE: '#479F53',
    BONK: '#F2A900',
    SHIB: '#FFA409'
  };
  return colors[symbol] || '#7F00FF'; // Default to brand purple
};

CreativeTokensGrid.displayName = 'CreativeTokensGrid';