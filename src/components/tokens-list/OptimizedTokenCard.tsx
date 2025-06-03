import React, { useMemo, useState } from "react";
import { Token } from "../../types";
import { formatNumber, formatTokenPrice, formatPercentage } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { DeleteTokenModal } from "./DeleteTokenModal";
import { useStore } from "../../store/useStore";

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

interface OptimizedTokenCardProps {
  token: Token;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Optimized TokenCard component with improved performance
 * - Removed excessive debug logging
 * - Simplified animations for better mobile performance
 * - Optimized renders with memoization
 * - Reduced background effects
 */
export const OptimizedTokenCard: React.FC<OptimizedTokenCardProps> = React.memo(({ 
  token, 
  onClick,
  isSelected = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const user = useStore((state) => state.user);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  // Prioritize high-res banner image for background
  const bannerUrl = useMemo(() => {
    return token.header_image_url || token.images?.headerImage || null;
  }, [token.header_image_url, token.images]);
  
  // Fallback logo for overlay
  const logoUrl = useMemo(() => {
    return token.image_url || token.images?.imageUrl || null;
  }, [token.image_url, token.images]);
  
  // Calculate intelligent metrics from new data
  const metrics = useMemo(() => {
    const change5m = token.priceChanges?.["5m"] || 0;
    const change1h = token.priceChanges?.["1h"] || 0;
    const change24h = token.change_24h || Number(token.change24h) || 0;
    // const volume5m = token.volumes?.["5m"] || 0;
    // const volume1h = token.volumes?.["1h"] || 0;
    const buys5m = token.transactions?.["5m"]?.buys || 0;
    const sells5m = token.transactions?.["5m"]?.sells || 0;
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
    <>
      <div
        className="aspect-[3/4] w-full perspective-1000 cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card - COMPLETELY REDESIGNED */}
          <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow">
            <div className={`relative w-full h-full bg-dark-200/70 backdrop-blur-sm hover:bg-dark-200/80 transition-all duration-300 group ${isSelected ? 'ring-2 ring-brand-500' : ''}`}>
              
              {/* HIGH-RES BANNER BACKGROUND with Parallax */}
              <div className="absolute inset-0 overflow-hidden">
                {bannerUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    style={{
                      backgroundImage: `url(${bannerUrl})`,
                      backgroundPosition: 'center 30%', // Parallax effect - slight offset
                      backgroundSize: 'cover'
                    }}
                  />
                ) : (
                  <div 
                    className="absolute inset-0 transform group-hover:scale-105 transition-transform duration-700" 
                    style={{
                      background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                    }}
                  />
                )}
                
                {/* Smart gradient overlay - adapts to trend */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  metrics.trend === 'up' 
                    ? 'bg-gradient-to-t from-green-900/80 via-black/60 to-black/20'
                    : 'bg-gradient-to-t from-red-900/80 via-black/60 to-black/20'
                }`} />
                
                {/* Data pulse overlay based on activity */}
                {metrics.activity > 10 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent animate-pulse" />
                )}
              </div>

              {/* COMPACT DATA OVERLAY */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                
                {/* TOP ROW - Priority & Tags */}
                <div className="flex justify-between items-start">
                  {/* Priority Score Indicator */}
                  {metrics.priority > 0 && (
                    <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white ml-1">{metrics.priority}</span>
                    </div>
                  )}
                  
                  {/* Activity Indicator */}
                  {metrics.activity > 5 && (
                    <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs">
                      <span className="text-orange-400">🔥</span>
                      <span className="text-white ml-1">{metrics.activity}</span>
                    </div>
                  )}
                </div>
                
                {/* MIDDLE ROW - Logo + Symbol */}
                <div className="flex items-center space-x-3">
                  {logoUrl && (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 backdrop-blur-sm border border-white/20">
                      <img src={logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">{token.symbol}</h3>
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
                
                {/* BOTTOM ROW - Advanced Visual Indicators */}
                <div className="space-y-1">
                  {/* Price with trend arrow */}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">{formatTokenPrice(token.price)}</div>
                    <div className={`flex items-center ${metrics.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      <div className={`text-sm font-mono ${(token.change_24h || Number(token.change24h) || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(token.change_24h || Number(token.change24h) || 0) >= 0 ? '↗' : '↘'} {formatPercentage(token.change_24h || token.change24h, false)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Cap with size indicator */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-300">${formatNumber(token.market_cap || token.marketCap, 'short')}</div>
                    <div className="flex items-center space-x-1">
                      {/* Size dots based on market cap */}
                      {(token.market_cap || Number(token.marketCap) || 0) > 1000000000 && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
                      {(token.market_cap || Number(token.marketCap) || 0) > 100000000 && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Activity indicators row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Volume heat bar */}
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-1 bg-dark-400 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            (token.volume_24h || Number(token.volume24h) || 0) > 10000000 ? 'bg-red-500' :
                            (token.volume_24h || Number(token.volume24h) || 0) > 1000000 ? 'bg-orange-500' :
                            (token.volume_24h || Number(token.volume24h) || 0) > 100000 ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.log10(Math.max(1, token.volume_24h || Number(token.volume24h) || 1)) * 10)}%` }}
                        />
                      </div>
                      {(token.volume_24h || Number(token.volume24h) || 0) > 10000000 && <div className="text-red-400 text-xs">🔥</div>}
                    </div>
                    
                    {/* Buy/Sell pressure */}
                    {token.transactions?.["5m"] && (
                      <div className="flex items-center space-x-1">
                        <div className={`w-1 h-3 rounded-full ${
                          token.transactions["5m"].buys > token.transactions["5m"].sells ? 'bg-green-400' : 'bg-gray-600'
                        }`}></div>
                        <div className={`w-1 h-3 rounded-full ${
                          token.transactions["5m"].sells > token.transactions["5m"].buys ? 'bg-red-400' : 'bg-gray-600'
                        }`}></div>
                      </div>
                    )}
                    
                    {/* Momentum arrows for multiple timeframes */}
                    <div className="flex space-x-0.5">
                      {token.priceChanges?.["5m"] !== undefined && (
                        <div className={`text-xs ${token.priceChanges["5m"] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.priceChanges["5m"] >= 0 ? '▲' : '▼'}
                        </div>
                      )}
                      {token.priceChanges?.["1h"] !== undefined && (
                        <div className={`text-xs ${token.priceChanges["1h"] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.priceChanges["1h"] >= 0 ? '▲' : '▼'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Timeframe indicators - subtle bottom strip */}
                {(token.priceChanges || token.volumes) && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent">
                    {/* Volume activity indicator */}
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500/50 to-cyan-500/50"
                      style={{ width: `${Math.min(((token.volumes?.["1h"] || 0) / 1000000) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Back of card - ENHANCED DATA VIEW */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow">
            <div className="w-full h-full bg-dark-200/90 backdrop-blur-sm p-3 hover:bg-dark-200/95 transition-colors duration-300">
              
              {/* Header with token info */}
              <div className="mb-3">
                <h3 className="text-lg font-bold text-white truncate">{token.name}</h3>
                {token.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">{token.description}</p>
                )}
              </div>

              {/* MULTI-TIMEFRAME GRID */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* 5m Change */}
                <div className="bg-dark-300/60 rounded p-2">
                  <div className="text-xs text-gray-400">5m</div>
                  <div className={`text-sm font-bold ${
                    (token.priceChanges?.["5m"] || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(token.priceChanges?.["5m"])}
                  </div>
                </div>
                
                {/* 1h Change */}
                <div className="bg-dark-300/60 rounded p-2">
                  <div className="text-xs text-gray-400">1h</div>
                  <div className={`text-sm font-bold ${
                    (token.priceChanges?.["1h"] || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(token.priceChanges?.["1h"])}
                  </div>
                </div>
                
                {/* FDV vs Market Cap */}
                <div className="bg-dark-300/60 rounded p-2">
                  <div className="text-xs text-gray-400">FDV</div>
                  <div className="text-sm font-bold text-white">
                    ${formatNumber(token.fdv || "0", 'short')}
                  </div>
                </div>
                
                {/* Supply */}
                <div className="bg-dark-300/60 rounded p-2">
                  <div className="text-xs text-gray-400">Supply</div>
                  <div className="text-sm font-bold text-white">
                    {formatNumber(token.totalSupply || "0", 'short')}
                  </div>
                </div>
              </div>
              
              {/* TRANSACTION ACTIVITY */}
              {token.transactions && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Activity (5m)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-500/20 rounded p-2 text-center">
                      <div className="text-xs text-green-400">Buys</div>
                      <div className="text-sm font-bold text-green-300">
                        {token.transactions["5m"]?.buys || 0}
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded p-2 text-center">
                      <div className="text-xs text-red-400">Sells</div>
                      <div className="text-sm font-bold text-red-300">
                        {token.transactions["5m"]?.sells || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* AGE & DISCOVERY */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {token.firstSeenAt && (
                  <div className="bg-dark-300/60 rounded p-2">
                    <div className="text-xs text-gray-400">Listed</div>
                    <div className="text-xs text-white">
                      {new Date(token.firstSeenAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {token.pairCreatedAt && (
                  <div className="bg-dark-300/60 rounded p-2">
                    <div className="text-xs text-gray-400">Pair</div>
                    <div className="text-xs text-white">
                      {new Date(token.pairCreatedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* CONTRACT + SOCIALS */}
              <div className="space-y-2">
                <CopyToClipboard text={token.contractAddress}>
                  <div className="bg-dark-300/60 rounded p-2 cursor-pointer hover:bg-dark-300/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Contract</span>
                      <span className="text-white/30">📋</span>
                    </div>
                    <p className="font-mono text-xs text-white/70 truncate">
                      {`${token.contractAddress.slice(0, 8)}...${token.contractAddress.slice(-6)}`}
                    </p>
                  </div>
                </CopyToClipboard>
                
                {/* Compact social row */}
                {token.socials && (
                  <div className="flex gap-1">
                    {token.socials?.twitter && (
                      <a href={token.socials.twitter} target="_blank" rel="noopener noreferrer" 
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 bg-dark-300/60 rounded p-2 text-center hover:bg-dark-300/80 transition-colors">
                        <span className="text-white/70">𝕏</span>
                      </a>
                    )}
                    {token.socials?.telegram && (
                      <a href={token.socials.telegram} target="_blank" rel="noopener noreferrer"
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 bg-dark-300/60 rounded p-2 text-center hover:bg-dark-300/80 transition-colors">
                        <span className="text-white/70">✈️</span>
                      </a>
                    )}
                    {token.socials?.discord && (
                      <a href={token.socials.discord} target="_blank" rel="noopener noreferrer"
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 bg-dark-300/60 rounded p-2 text-center hover:bg-dark-300/80 transition-colors">
                        <span className="text-white/70">💬</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Admin delete button - compact */}
              {user?.is_admin && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full mt-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-1 rounded text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteTokenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tokenAddress={token.contractAddress}
        tokenSymbol={token.symbol}
      />
    </>
  );
});

OptimizedTokenCard.displayName = 'OptimizedTokenCard';