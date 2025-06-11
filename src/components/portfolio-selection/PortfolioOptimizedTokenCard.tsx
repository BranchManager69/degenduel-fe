import React, { useCallback, useMemo, useState } from "react";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatPercentage, formatTokenPrice } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { applyTokenImageOverrides } from "../../config/tokenImageOverrides";

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

interface PortfolioOptimizedTokenCardProps {
  token: Token;
  isSelected: boolean;
  weight: number;
  onSelect: () => void;
  onWeightChange: (weight: number) => void;
  remainingAllocation?: number;
}

/**
 * PortfolioOptimizedTokenCard - Enhanced version of OptimizedTokenCard
 * specifically designed for portfolio selection with weight management
 * 
 * Key Features:
 * - Stunning visual design from OptimizedTokenCard
 * - Portfolio weight selection functionality
 * - Smart interaction: click to select, expandable weight slider
 * - Multi-timeframe data display
 * - Banner backgrounds with smart overlays
 */
export const PortfolioOptimizedTokenCard: React.FC<PortfolioOptimizedTokenCardProps> = React.memo(({ 
  token, 
  isSelected,
  weight,
  onSelect,
  onWeightChange,
  remainingAllocation = 0
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Apply frontend image overrides
  const enhancedToken = useMemo(() => applyTokenImageOverrides(token), [token]);

  // Handle card click - select/deselect token
  const handleCardClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  // Toggle details view
  const handleDetailsToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  }, [showDetails]);

  // Prioritize high-res banner image for background
  const bannerUrl = useMemo(() => {
    return enhancedToken.header_image_url || enhancedToken.images?.headerImage || null;
  }, [enhancedToken.header_image_url, enhancedToken.images]);
  
  // Fallback logo for overlay
  const logoUrl = useMemo(() => {
    return enhancedToken.image_url || enhancedToken.images?.imageUrl || '/images/tokens/default.png';
  }, [enhancedToken.image_url, enhancedToken.images]);
  
  // Calculate intelligent metrics using TokenHelpers
  const metrics = useMemo(() => {
    const priceChanges = TokenHelpers.getPriceChanges(token);
    const transactions = TokenHelpers.getTransactions(token);
    const change24h = TokenHelpers.getPriceChange(token);
    
    const change5m = priceChanges?.m5 || 0;
    const change1h = priceChanges?.h1 || 0;
    const buys5m = transactions?.m5?.buys || 0;
    const sells5m = transactions?.m5?.sells || 0;
    const priorityScore = token.priority_score || token.priorityScore || 0;
    
    return {
      momentum: change5m !== 0 ? change5m : change1h,
      velocity: Math.abs(change5m) + Math.abs(change1h),
      activity: buys5m + sells5m,
      priority: priorityScore,
      trend: change24h >= 0 ? 'up' : 'down'
    };
  }, [token]);

  return (
    <div className="w-full perspective-1000">
      {/* Mobile Layout - Compact horizontal card */}
      <div className="sm:hidden">
        <div 
          className={`relative w-full h-16 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'ring-2 ring-brand-500 shadow-brand-500/20 bg-brand-500/10' 
              : 'bg-dark-200/70 hover:bg-dark-200/80'
          }`}
          onClick={handleCardClick}
        >
          <div className="flex items-center h-full px-3 gap-3">
            {/* Token Logo */}
            {logoUrl && (
              <img src={logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
            
            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm truncate">{token.symbol}</span>
                <span className={`text-xs ${TokenHelpers.getPriceChange(token) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate">{formatTokenPrice(TokenHelpers.getPrice(token))}</div>
            </div>
            
            {/* Selection Status */}
            <div className="flex-shrink-0">
              {isSelected ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWeightChange(Math.max(0, weight - 1));
                    }}
                    className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-full text-white font-bold flex items-center justify-center active:scale-95 transition-all duration-150"
                  >
                    −
                  </button>
                  <div className="bg-brand-500/20 rounded px-2 py-1 min-w-[42px] text-center">
                    <span className="text-sm font-bold text-brand-100">{weight}%</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWeightChange(Math.min(100, weight + 1));
                    }}
                    className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 rounded-full text-white font-bold flex items-center justify-center active:scale-95 transition-all duration-150"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original tall cards */}
      <div className="hidden sm:block aspect-[3/4] w-full">
        <div className="relative w-full h-full">
          {/* Main Card */}
          <div 
            className={`relative w-full h-full rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 ${
              isSelected 
                ? 'ring-2 ring-brand-500 shadow-brand-500/20 scale-105 z-20' 
                : 'hover:scale-[1.02] hover:shadow-xl z-10'
            }`}
            onClick={handleCardClick}
          >
            <div className="relative w-full h-full bg-dark-200/70 backdrop-blur-sm hover:bg-dark-200/80 transition-all duration-300 group">
            
            {/* HIGH-RES BANNER BACKGROUND with Parallax */}
            <div className="absolute inset-0 overflow-hidden">
              {bannerUrl ? (
                <div
                  className="absolute inset-0 bg-cover animate-slow-scan transform group-hover:scale-110 group-hover:translate-y-[-2px] transition-all duration-700 ease-out"
                  style={{
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundSize: 'cover' // Fill the entire card height and width
                  }}
                />
              ) : (
                <div 
                  className="absolute inset-0 transform group-hover:scale-110 group-hover:translate-y-[-2px] transition-all duration-700 ease-out" 
                  style={{
                    background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                  }}
                />
              )}
              
              {/* Smart gradient overlay - adapts to trend and selection */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                isSelected
                  ? 'bg-gradient-to-t from-brand-900/30 via-black/60 to-black/20'
                  : metrics.trend === 'up' 
                    ? 'bg-gradient-to-t from-green-900/20 via-black/60 to-black/20'
                    : 'bg-gradient-to-t from-red-900/20 via-black/60 to-black/20'
              }`} />
              
              {/* Selection slide effect */}
              <div 
                className={`absolute inset-0 bg-gradient-to-r from-brand-500/30 via-brand-400/20 to-transparent transition-transform duration-500 ease-out ${
                  isSelected ? 'translate-x-0' : '-translate-x-full'
                }`}
              />
              
              {/* Selection pulse effect */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-t from-brand-500/10 to-transparent animate-pulse" />
              )}
              
              {/* Data pulse overlay based on activity */}
              {metrics.activity > 10 && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent animate-pulse" />
              )}
            </div>


            {/* COMPACT DATA OVERLAY */}
            <div className="absolute inset-0 p-3 flex flex-col justify-between" style={{ zIndex: 10 }}>
              
              {/* TOP ROW - Selection Status & Details */}
              <div className="flex justify-between items-start">
                {/* Enhanced Selection Indicator with Larger Weight Display */}
                <div className={`
                  bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border transition-all duration-300
                  ${isSelected 
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' 
                    : 'border-gray-500/30'
                  }
                `}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full transition-colors ${
                      isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                    }`} />
                    {isSelected ? (
                      <span className="text-sm font-bold text-emerald-300">
                        {weight}%
                      </span>
                    ) : (
                      <span className="text-sm font-mono text-gray-400">
                        SELECT
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Token Logo - only show if we have a real token image */}
                {logoUrl && !logoUrl.includes('default.png') && (
                  <button
                    onClick={handleDetailsToggle}
                    className="w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full border border-gray-500/30 hover:border-white/50 transition-colors overflow-hidden"
                  >
                    <img 
                      src={logoUrl} 
                      alt={token.symbol} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide the button entirely if image fails to load
                        const button = (e.target as HTMLImageElement).closest('button');
                        if (button) {
                          button.style.display = 'none';
                        }
                      }}
                    />
                  </button>
                )}
              </div>
              
              {/* MIDDLE ROW - Symbol Only */}
              <div className="flex items-center">
                <div>
                  <h3 className={`${token.symbol.length >= 9 ? 'text-xl' : 'text-2xl'} font-bold text-white`} style={{ 
                    textShadow: '6px 6px 12px rgba(0,0,0,1), -4px -4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,1), 0px 0px 10px rgba(0,0,0,0.9)', 
                    WebkitTextStroke: '1.5px rgba(0,0,0,0.7)' 
                  }}>
                    {token.symbol}
                  </h3>
                  {token.tags && token.tags.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {token.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs bg-brand-500/30 text-brand-200 px-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* BOTTOM ROW - Market Cap & Price/Performance */}
              <div className="space-y-2">
                {/* Percentage change - top right */}
                <div className="flex items-center justify-end">
                  <div className={`text-sm font-bold font-sans ${TokenHelpers.getPriceChange(token) >= 0 ? 'text-green-400' : 'text-red-400'}`} style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' 
                  }}>
                    {TokenHelpers.getPriceChange(token) >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                  </div>
                </div>
                
                {/* Market Cap (left) + Price (right) */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300 whitespace-nowrap" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' }}>${formatNumber(TokenHelpers.getMarketCap(token), 'short')} MC</div>
                  <div className="text-base font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,1)' }}>{formatTokenPrice(TokenHelpers.getPrice(token))}</div>
                </div>
              </div>
            </div>

            {/* PORTFOLIO WEIGHT MAX BUTTON */}
            <div
              className={`absolute bottom-0 left-0 right-0 transform transition-all duration-300 ease-out overflow-hidden ${
                isSelected
                  ? "h-8 opacity-100 translate-y-0"
                  : "h-0 opacity-0 translate-y-2"
              }`}
            >
              <div
                className="bg-black/70 backdrop-blur-sm p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const maxWeight = weight + remainingAllocation;
                      onWeightChange(maxWeight);
                    }}
                    className="px-4 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-md shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                    disabled={remainingAllocation <= 0}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS OVERLAY - Slides down from top */}
        <div
          className={`absolute top-0 left-0 right-0 transform transition-all duration-300 ease-out overflow-hidden z-30 ${
            showDetails
              ? "h-full opacity-100 translate-y-0"
              : "h-0 opacity-0 -translate-y-2"
          }`}
        >
          <div className="w-full h-full bg-dark-200/95 backdrop-blur-md rounded-xl border border-dark-400 p-3">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white truncate">{token.name}</h3>
              <button
                onClick={handleDetailsToggle}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* MULTI-TIMEFRAME GRID */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* 5m Change */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">5m</div>
                <div className={`text-sm font-bold ${
                  (TokenHelpers.getPriceChanges(token)?.m5 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(TokenHelpers.getPriceChanges(token)?.m5)}
                </div>
              </div>
              
              {/* 1h Change */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">1h</div>
                <div className={`text-sm font-bold ${
                  (TokenHelpers.getPriceChanges(token)?.h1 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(TokenHelpers.getPriceChanges(token)?.h1)}
                </div>
              </div>
              
              {/* FDV */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">FDV</div>
                <div className="text-sm font-bold text-white">
                  ${formatNumber(TokenHelpers.getFDV(token), 'short')}
                </div>
              </div>
              
              {/* Liquidity */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">Liquidity</div>
                <div className="text-sm font-bold text-white">
                  ${formatNumber(TokenHelpers.getLiquidity(token), 'short')}
                </div>
              </div>
            </div>
            
            {/* TRANSACTION ACTIVITY */}
            {(() => {
              const transactions = TokenHelpers.getTransactions(token);
              return transactions && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Activity (5m)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-500/20 rounded p-2 text-center">
                      <div className="text-xs text-green-400">Buys</div>
                      <div className="text-sm font-bold text-green-300">
                        {transactions.m5?.buys || 0}
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded p-2 text-center">
                      <div className="text-xs text-red-400">Sells</div>
                      <div className="text-sm font-bold text-red-300">
                        {transactions.m5?.sells || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CONTRACT ADDRESS */}
            <div className="mt-auto">
              <CopyToClipboard text={TokenHelpers.getAddress(token)}>
                <div className="bg-dark-300/60 rounded p-2 cursor-pointer hover:bg-dark-300/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Contract</span>
                    <span className="text-white/30">📋</span>
                  </div>
                  <p className="font-mono text-xs text-white/70 truncate">
                    {`${TokenHelpers.getAddress(token).slice(0, 8)}...${TokenHelpers.getAddress(token).slice(-6)}`}
                  </p>
                </div>
              </CopyToClipboard>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
});

PortfolioOptimizedTokenCard.displayName = 'PortfolioOptimizedTokenCard';