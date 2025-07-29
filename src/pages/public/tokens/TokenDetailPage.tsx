// src/pages/public/tokens/TokenDetailPage.tsx

/**
 * Token Detail Page
 * 
 * @description Individual token page with detailed analytics, price charts, and OG image meta tags
 * Uses the UnifiedWebSocket system through useStandardizedTokenData
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-01-29
 * @updated 2025-02-06 - Now uses UnifiedWebSocket instead of API calls
 */

import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { useIndividualToken } from "../../../hooks/websocket/topic-hooks/useIndividualToken";
import { formatNumber } from "../../../utils/format";
import { setupTokenOGMeta, resetToDefaultMeta, getTokenOGImageUrl, OGImage } from "../../../utils/ogImageUtils";
import { TokenHelpers } from "../../../types";

export const TokenDetailPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [showDebug, setShowDebug] = React.useState(false);

  // Use the individual token hook to get data for this specific token
  const {
    token,
    isLoading,
    isConnected,
    error: wsError,
    lastUpdate,
    refresh
  } = useIndividualToken(address || '');

  useEffect(() => {
    if (token) {
      // Setup OG meta tags when token is found
      setupTokenOGMeta(
        token.symbol,
        token.name,
        String(TokenHelpers.getPrice(token))
      );
    }

    return () => {
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-400">Loading token details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!address || wsError || (!isLoading && !token)) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-500/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
              <p className="text-gray-300 mb-6">
                {!address ? "Token contract address is required" : 
                 wsError || `Token with address ${address} not found`}
              </p>
              <Link 
                to="/tokens" 
                className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
              >
                ← Back to Tokens
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // At this point, token is guaranteed to be non-null due to error check above
  if (!token) return null; // TypeScript safety - this should never happen
  
  // Generate OG image URL for social sharing
  const ogImageUrl = getTokenOGImageUrl(token.symbol);

  return (
    <SilentErrorBoundary>
      <div className="flex flex-col min-h-screen">
        {/* OG Image for social sharing */}
        <OGImage src={ogImageUrl} alt={`${token.symbol} preview`} />

        {/* Header Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header with Back Button and Connection Status */}
            <div className="flex items-center justify-between mb-6">
              <Link 
                to="/tokens" 
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Tokens
              </Link>
              
              {/* Debug Button and WebSocket Connection Status */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-3 py-1 text-xs font-mono bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  {showDebug ? 'HIDE DEBUG' : 'SHOW DEBUG'}
                </button>
                
                <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live Updates' : 'Offline'}
                </span>
                </div>
              </div>
            </div>

            {/* Token Header with Banner */}
            <div className="relative rounded-xl overflow-hidden border border-dark-400">
              {/* Header Image Banner */}
              {token.header_image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${token.header_image_url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80" />
                </div>
              )}
              
              {/* Dynamic Brand Color Accent */}
              {token.color && (
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{ 
                    background: `linear-gradient(135deg, ${token.color}20 0%, transparent 50%, ${token.color}20 100%)`
                  }}
                />
              )}
              
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {(token.image_url || token.images?.imageUrl) && (
                      <img 
                        src={token.image_url || token.images?.imageUrl} 
                        alt={token.symbol} 
                        className="w-16 h-16 rounded-full ring-2 ring-white/20 shadow-lg"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-white drop-shadow-lg">{token.symbol}</h1>
                      <p className="text-gray-200 drop-shadow-sm">{token.name}</p>
                      {token.description && (
                        <p className="text-gray-300 text-sm mt-1 max-w-md line-clamp-2 drop-shadow-sm">
                          {token.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white drop-shadow-lg">
                      ${formatNumber(TokenHelpers.getPrice(token), 6, true)}
                    </div>
                    <div className={`text-lg font-semibold drop-shadow-sm ${
                      TokenHelpers.getPriceChange(token) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {TokenHelpers.getPriceChange(token) >= 0 ? '+' : ''}
                      {formatNumber(TokenHelpers.getPriceChange(token), 0, true)}%
                    </div>
                    
                    {/* Last Update and Refresh */}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {lastUpdate && (
                        <span className="text-xs text-gray-400">
                          Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                      )}
                      <button
                        onClick={refresh}
                        className="p-1 hover:bg-dark-200 rounded transition-colors"
                        title="Refresh data"
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Trading Action Buttons */}
                    <div className="flex space-x-2 mt-3">
                      <a
                        href={`https://jup.ag/swap/SOL-${TokenHelpers.getAddress(token)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Buy on Jupiter
                      </a>
                      <a
                        href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        View Chart
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="border-dark-400">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Market Statistics</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className="rounded-lg p-4 border border-white/5"
                        style={{
                          ...(token.color && {
                            borderColor: `${token.color}40`,
                            background: `linear-gradient(135deg, ${token.color}10, transparent)`
                          })
                        }}
                      >
                        <p className="text-gray-400 text-sm">Market Cap</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(TokenHelpers.getMarketCap(token), "short")}
                        </p>
                      </div>
                      
                      <div 
                        className="rounded-lg p-4 border border-white/5"
                        style={{
                          ...(token.color && {
                            borderColor: `${token.color}40`,
                            background: `linear-gradient(135deg, ${token.color}10, transparent)`
                          })
                        }}
                      >
                        <p className="text-gray-400 text-sm">24h Volume</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(TokenHelpers.getVolume(token), "short")}
                        </p>
                      </div>
                      
                      <div 
                        className="rounded-lg p-4 border border-white/5"
                        style={{
                          ...(token.color && {
                            borderColor: `${token.color}40`,
                            background: `linear-gradient(135deg, ${token.color}10, transparent)`
                          })
                        }}
                      >
                        <p className="text-gray-400 text-sm">FDV</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(token.fdv || "0", "short")}
                        </p>
                      </div>
                      
                      <div 
                        className="rounded-lg p-4 border border-white/5"
                        style={{
                          ...(token.color && {
                            borderColor: `${token.color}40`,
                            background: `linear-gradient(135deg, ${token.color}10, transparent)`
                          })
                        }}
                      >
                        <p className="text-gray-400 text-sm">Total Supply</p>
                        <p className="text-xl font-semibold text-white">
                          {formatNumber(token.total_supply || parseFloat(token.totalSupply || '0') || 0, "short")}
                        </p>
                      </div>
                      
                      {/* Liquidity */}
                      <div 
                        className="rounded-lg p-4 border border-white/5"
                        style={{
                          ...(token.color && {
                            borderColor: `${token.color}40`,
                            background: `linear-gradient(135deg, ${token.color}10, transparent)`
                          })
                        }}
                      >
                        <p className="text-gray-400 text-sm">Liquidity</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(token.liquidity || "0", "short")}
                        </p>
                      </div>
                      
                      {/* Priority Score */}
                      {(token.priority_score || token.priorityScore) && (
                        <div 
                          className="rounded-lg p-4 border border-white/5"
                          style={{
                            ...(token.color && {
                              borderColor: `${token.color}40`,
                              background: `linear-gradient(135deg, ${token.color}10, transparent)`
                            })
                          }}
                        >
                          <p className="text-gray-400 text-sm">Quality Score</p>
                          <p className="text-xl font-semibold text-white">
                            {token.priority_score || token.priorityScore}/100
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Price Changes with Visual Indicators */}
                    {(token.priceChanges || token.price_changes) && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Multi-Timeframe Performance</h3>
                        <div className="grid grid-cols-4 gap-3">
                          {['5m', '1h', '6h', '24h'].map((period) => {
                            // Handle both formats: m5/h1/h6/h24 and 5m/1h/6h/24h
                            const priceChanges = token.priceChanges || token.price_changes || {};
                            const periodKey = period === '5m' ? 'm5' : 
                                           period === '1h' ? 'h1' : 
                                           period === '6h' ? 'h6' : 
                                           period === '24h' ? 'h24' : period;
                            const change = Number(
                              priceChanges[period as keyof typeof priceChanges] || 
                              priceChanges[periodKey as keyof typeof priceChanges] || 
                              0
                            );
                            const isPositive = change >= 0;
                            return (
                              <div 
                                key={period} 
                                className="relative rounded-lg p-3 text-center overflow-hidden border border-dark-400/50"
                              >
                                {/* Performance bar background */}
                                <div 
                                  className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
                                    isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                                  }`}
                                  style={{ 
                                    height: `${Math.min(Math.abs(change) * 2, 100)}%` 
                                  }}
                                />
                                <div className="relative z-10">
                                  <p className="text-gray-400 text-xs uppercase font-medium">{period}</p>
                                  <p className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{formatNumber(change, 0, true)}%
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Volume Analytics */}
                    {token.volumes && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Volume Analytics</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {['5m', '1h', '6h', '24h'].map((period) => {
                            // Handle both formats: m5/h1/h6/h24 and 5m/1h/6h/24h
                            const volumes = token.volumes || {};
                            const periodKey = period === '5m' ? 'm5' : 
                                           period === '1h' ? 'h1' : 
                                           period === '6h' ? 'h6' : 
                                           period === '24h' ? 'h24' : period;
                            const volume = volumes[period as keyof typeof volumes] || 
                                         volumes[periodKey as keyof typeof volumes] || 
                                         0;
                            return (
                              <div key={period} className="text-center rounded p-2 border border-dark-400/30">
                                <p className="text-gray-400 text-xs uppercase">{period}</p>
                                <p className="text-sm font-semibold text-white">
                                  ${formatNumber(volume, "short")}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Token Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="border-dark-400" ref={(el) => {
                  if (el && showDebug) {
                    const computed = window.getComputedStyle(el);
                    const debugInfo = {
                      backgroundColor: computed.backgroundColor,
                      background: computed.background,
                      opacity: computed.opacity,
                      backdropFilter: computed.backdropFilter || 'none',
                      className: el.className,
                      allClasses: el.classList.toString(),
                    };
                    console.log('Token Information Card Styles:', debugInfo);
                    
                    // Create debug overlay
                    const existingDebug = document.getElementById('token-info-debug');
                    if (existingDebug) existingDebug.remove();
                    
                    const debugDiv = document.createElement('div');
                    debugDiv.id = 'token-info-debug';
                    debugDiv.style.cssText = 'position: fixed; top: 100px; right: 20px; background: black; color: white; padding: 20px; z-index: 999999; font-family: monospace; font-size: 12px; max-width: 400px; border: 2px solid red;';
                    debugDiv.innerHTML = `
                      <h3 style="color: red; margin: 0 0 10px 0;">TOKEN INFO CARD STYLES:</h3>
                      <div>backgroundColor: ${debugInfo.backgroundColor}</div>
                      <div>background: ${debugInfo.background}</div>
                      <div>opacity: ${debugInfo.opacity}</div>
                      <div>backdropFilter: ${debugInfo.backdropFilter}</div>
                      <div>className: ${debugInfo.className}</div>
                      <div>allClasses: ${debugInfo.allClasses}</div>
                    `;
                    document.body.appendChild(debugDiv);
                  }
                }}>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Token Information</h2>
                    
                    {/* Contract Address with Copy Button */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-1">Contract Address</p>
                      <div className="flex items-center space-x-2 rounded-lg p-2 border border-dark-400/50">
                        <p className="text-white text-xs font-mono break-all flex-1">
                          {TokenHelpers.getAddress(token)}
                        </p>
                        <button
                          onClick={() => {
                            const address = TokenHelpers.getAddress(token);
                            if (address) navigator.clipboard.writeText(address);
                          }}
                          className="px-2 py-1 border border-gray-600 hover:border-gray-400 text-white text-xs rounded transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Token Details */}
                    <div className="mb-4 space-y-2">
                      {token.decimals && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Decimals</span>
                          <span className="text-white text-sm">{token.decimals}</span>
                        </div>
                      )}
                      {token.pairCreatedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Pair Created</span>
                          <span className="text-white text-sm">
                            {new Date(token.pairCreatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {token.first_seen_on_jupiter_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">First Seen</span>
                          <span className="text-white text-sm">
                            {new Date(token.first_seen_on_jupiter_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Tags */}
                    {token.tags && token.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Jupiter Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {token.tags.map((tag: string, index: number) => (
                            <span 
                              key={index}
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: token.color ? `${token.color}20` : '#3b82f620',
                                color: token.color || '#3b82f6',
                                border: `1px solid ${token.color ? `${token.color}40` : '#3b82f640'}`
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enhanced Social Links */}
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Links & Social</p>
                      <div className="space-y-2">
                        {/* Websites */}
                        {token.websites && token.websites.map((website: any, index: number) => (
                          <a
                            key={index}
                            href={typeof website === 'string' ? website : website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-400/10 transition-colors group border border-dark-400/30 hover:border-dark-400/50"
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span className="text-blue-400 group-hover:text-blue-300 text-sm truncate">
                              {typeof website === 'string' ? website : (website.label || website.url)}
                            </span>
                          </a>
                        ))}
                        
                        {/* Enhanced Social Links */}
                        {TokenHelpers.getSocials(token).map((social, index) => {
                          const colorClass = social.type === 'twitter' ? 'text-blue-400 group-hover:text-blue-300' :
                                           social.type === 'telegram' ? 'text-blue-400 group-hover:text-blue-300' :
                                           social.type === 'discord' ? 'text-indigo-400 group-hover:text-indigo-300' :
                                           'text-green-400 group-hover:text-green-300';
                          const bgColor = social.type === 'discord' ? 'bg-indigo-400' : 
                                         social.type === 'website' ? 'bg-green-400' : 'bg-blue-400';
                          
                          return (
                            <a
                              key={index}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-400/10 transition-colors group border border-dark-400/30 hover:border-dark-400/50"
                            >
                              <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                              <span className={`text-sm ${colorClass}`}>
                                {social.type.charAt(0).toUpperCase() + social.type.slice(1)}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Transaction Data */}
                    {token.transactions && (
                      <div className="mt-6">
                        <p className="text-gray-400 text-sm mb-3">Transaction Activity</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['5m', '1h', '6h', '24h'].map((period) => {
                            // Handle both formats: m5/h1/h6/h24 and 5m/1h/6h/24h
                            const transactions = token.transactions || {};
                            const periodKey = period === '5m' ? 'm5' : 
                                           period === '1h' ? 'h1' : 
                                           period === '6h' ? 'h6' : 
                                           period === '24h' ? 'h24' : period;
                            const txData = transactions[period as keyof typeof transactions] || 
                                         transactions[periodKey as keyof typeof transactions];
                            
                            return (
                              <div key={period} className="text-center rounded p-2 border border-dark-400/30">
                                <p className="text-gray-400 text-xs uppercase">{period}</p>
                                <p className="text-sm font-semibold text-white">
                                  {typeof txData === 'object' && txData !== null
                                    ? `${(txData as any).buys || 0}/${(txData as any).sells || 0}`
                                    : String(txData || 0)
                                  }
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </SilentErrorBoundary>
  );
};

export default TokenDetailPage;