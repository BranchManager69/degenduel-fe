// src/pages/public/tokens/TokenDetailPageNew.tsx

/**
 * Token Detail Page - Professional Market Data Platform Design
 * 
 * @description Beautiful token detail page with real-time data updates
 * Uses REST API for initial load and WebSocket for live updates
 * @author Claude & BranchManager69
 * @version 3.0.0
 * @created 2025-01-XX
 */

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { useIndividualToken } from "../../../hooks/websocket/topic-hooks/useIndividualToken";
import { useStore } from "../../../store/useStore";
import { TokenHelpers } from "../../../types";
import { formatNumber } from "../../../utils/format";
import { resetToDefaultMeta, setupTokenOGMeta } from "../../../utils/ogImageUtils";

// Helper function for intelligent time formatting
const getTimeAgo = (dateString: string, compact: boolean = false): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (compact) {
    // Mobile-friendly compact format: "3m15d" instead of "3 months, 15 days ago"
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    const remainingDays = diffInDays % 30;
    if (diffInMonths < 12) {
      return remainingDays > 0 ? `${diffInMonths}m, ${remainingDays}d` : `${diffInMonths}m`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    const remainingMonths = diffInMonths % 12;
    return remainingMonths > 0 ? `${diffInYears}y, ${remainingMonths}m` : `${diffInYears}y`;
  }

  // Desktop format (original)
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  const remainingDays = diffInDays % 30;
  if (diffInMonths < 12) {
    const monthText = `${diffInMonths} month${diffInMonths === 1 ? '' : 's'}`;
    const dayText = remainingDays > 0 ? `, ${remainingDays} day${remainingDays === 1 ? '' : 's'}` : '';
    return `${monthText}${dayText} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  const remainingMonths = diffInMonths % 12;
  const yearText = `${diffInYears} year${diffInYears === 1 ? '' : 's'}`;
  const monthText = remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : '';
  return `${yearText}${monthText} ago`;
};


export const TokenDetailPageNew: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showRestResponse, setShowRestResponse] = useState(false);
  const [sortByRecency, setSortByRecency] = useState(false);
  const { address } = useParams<{ address: string }>();
  const { user } = useStore();

  // Use the individual token hook for proper WebSocket subscription
  const {
    token,
    isLoading,
    error: wsError,
    lastRawMessage,
    messageHistory,
    lastUpdateType,
    initialRestResponse
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
      resetToDefaultMeta();
    };
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
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
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <Card className="bg-dark-200/50 backdrop-blur-sm border-red-500/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
              <p className="text-gray-400">
                {!address ? "Token contract address is required" : 
                 wsError || `Token with address ${address} not found`}
              </p>
              <Link to="/tokens" className="mt-4 inline-block text-brand-400 hover:text-brand-300">
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
  
  // Calculate additional metrics
  const priceChange24h = TokenHelpers.getPriceChange(token);
  const isPositive = priceChange24h >= 0;
  const marketCap = TokenHelpers.getMarketCap(token);

  // Helper function to get all timestamp fields in sorted order
  const getTimestampFields = () => {
    const fields = [
      { key: 'created_at', value: token.created_at, label: 'created_at' },
      { key: 'first_seen_on_jupiter_at', value: token.first_seen_on_jupiter_at, label: 'first_seen_on_jupiter_at' },
      { key: 'last_is_active_evaluation_at', value: token.last_is_active_evaluation_at, label: 'last_is_active_evaluation_at' },
      { key: 'last_jupiter_sync_at', value: token.last_jupiter_sync_at, label: 'last_jupiter_sync_at' },
      { key: 'last_price_change', value: token.last_price_change, label: 'last_price_change' },
      { key: 'last_priority_calculation', value: token.last_priority_calculation, label: 'last_priority_calculation' },
      { key: 'last_refresh_attempt', value: token.last_refresh_attempt, label: 'last_refresh_attempt' },
      { key: 'last_refresh_success', value: token.last_refresh_success, label: 'last_refresh_success' },
      { key: 'metadata_last_updated_at', value: token.metadata_last_updated_at, label: 'metadata_last_updated_at' },
      { key: 'pool_price_calculated_at', value: token.pool_price_calculated_at, label: 'pool_price_calculated_at' },
      { key: 'refresh_metadata_last_enrichment_attempt', value: token.refresh_metadata?.last_enrichment_attempt, label: 'refresh_metadata.last_enrichment_attempt' },
      { key: 'refresh_metadata_last_enrichment_success', value: token.refresh_metadata?.last_enrichment_success, label: 'refresh_metadata.last_enrichment_success' },
      { key: 'score_calculated_at', value: token.score_calculated_at, label: 'score_calculated_at' },
      { key: 'token_prices_updated_at', value: token.token_prices?.updated_at, label: 'token_prices.updated_at' },
      { key: 'updated_at', value: token.updated_at, label: 'updated_at' },
    ].filter(field => field.value); // Only include fields that have values

    if (sortByRecency) {
      // Sort by date, most recent first
      return fields.sort((a, b) => new Date(b.value!).getTime() - new Date(a.value!).getTime());
    } else {
      // Return in default order (as they appear in the original code)
      return fields;
    }
  };

  return (
    <SilentErrorBoundary>
      <div className="flex flex-col min-h-screen">

        {/* Professional Hero Section */}
        <div className="relative overflow-hidden">
          {/* Dynamic Background with Token Color */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: token.color ? 
                `radial-gradient(circle at 50% 0%, ${token.color}40, transparent 70%)` : 
                'radial-gradient(circle at 50% 0%, #10b98140, transparent 70%)'
            }}
          />
          
          {/* Header Image Background */}
          {token.header_image_url && (
            <div className="absolute inset-0">
              <img 
                src={token.header_image_url} 
                alt=""
                className="w-full h-full object-cover opacity-20"
              />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            {/* Navigation */}
            <Link 
              to="/tokens" 
              className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
              Back to Tokens
            </Link>

            {/* Token Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-center space-x-4">
                {token.image_url && (
                  <motion.img 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    src={token.image_url} 
                    alt={token.symbol}
                    className="w-20 h-20 rounded-full shadow-2xl ring-4 ring-white/10"
                    style={{
                      boxShadow: token.color ? `0 0 40px ${token.color}40` : undefined
                    }}
                  />
                )}
                <div>
                  <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    {token.symbol}
                    {token.tags && token.tags.includes('verified') && (
                      <span className="text-emerald-400 text-sm">✓</span>
                    )}
                  </h1>
                  <p className="text-xl text-gray-300">{token.name}</p>
                  
                  {/* Links underneath name */}
                  <div className="mt-3">
                    {((token.websites?.length ?? 0) > 0 || TokenHelpers.getSocials(token).length > 0) ? (
                      <div className="flex flex-wrap gap-3">
                        {token.websites?.map((website: any, idx: number) => (
                          <a
                            key={idx}
                            href={typeof website === 'string' ? website : website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            {typeof website === 'string' ? 'Website' : (website.label || 'Website')}
                          </a>
                        ))}
                        
                        {TokenHelpers.getSocials(token).map((social, idx) => (
                          <a
                            key={idx}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm transition-colors ${
                              social.type === 'twitter' ? 'text-blue-400 hover:text-blue-300' :
                              social.type === 'telegram' ? 'text-blue-400 hover:text-blue-300' :
                              social.type === 'discord' ? 'text-indigo-400 hover:text-indigo-300' :
                              'text-green-400 hover:text-green-300'
                            }`}
                          >
                            {social.type.charAt(0).toUpperCase() + social.type.slice(1)}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No links available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className="text-left md:text-right">
                <div className="flex flex-col md:items-end gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      ${formatNumber(marketCap, marketCap >= 1000000000 ? 2 : marketCap >= 1000000 ? 2 : "short")}
                    </span>
                    <span className="text-lg text-gray-400 font-medium">MC</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-white font-medium">${formatNumber(TokenHelpers.getPrice(token), 6, true)}</span>
                    <motion.span 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center text-sm font-semibold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {isPositive ? '+' : ''}{formatNumber(priceChange24h, 2)}%
                    </motion.span>
                  </div>
                </div>

                {/* Trading Actions */}
                <div className="flex gap-3 mt-4">
                  <a
                    href={`https://jup.ag/swap/SOL-${TokenHelpers.getAddress(token)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    Trade on Jupiter
                  </a>
                  <a
                    href={`https://dexscreener.com/solana/${TokenHelpers.getAddress(token)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-dark-300 hover:bg-dark-400 text-white font-medium rounded-lg transition-all border border-dark-400 hover:border-gray-600"
                  >
                    View Charts
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative z-10 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Under Construction Notice */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm text-center">
              🚧 This page is under construction and being improved. More features coming soon
            </p>
          </div>

          {/* Timeline Section - Admin Only */}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-red-400">🔒</span> Token Lifecycle Timeline
              </h3>
              
              {/* Timeline */}
              <div className="relative">
                {/* Main timeline line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-dark-400"></div>
                
                {/* Timeline events */}
                <div className="relative flex justify-between items-start">
                  {/* Pool Created */}
                  {token.refresh_metadata?.enhanced_market_data?.pairCreatedAt && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-10 relative">
                        <span className="text-xs">🏊</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-blue-400">Pool Created</p>
                        <p className="text-xs text-gray-400">{new Date(token.refresh_metadata.enhanced_market_data.pairCreatedAt).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{getTimeAgo(token.refresh_metadata.enhanced_market_data.pairCreatedAt)}</span>
                          <span className="sm:hidden">{getTimeAgo(token.refresh_metadata.enhanced_market_data.pairCreatedAt, true)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Discovered */}
                  {token.first_seen_on_jupiter_at && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 relative">
                        <span className="text-xs">🔍</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-green-400">Discovered</p>
                        <p className="text-xs text-gray-400">{new Date(token.first_seen_on_jupiter_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{getTimeAgo(token.first_seen_on_jupiter_at)}</span>
                          <span className="sm:hidden">{getTimeAgo(token.first_seen_on_jupiter_at, true)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata Updated */}
                  {token.metadata_last_updated_at && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center z-10 relative">
                        <span className="text-xs">📝</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-purple-400">Metadata Updated</p>
                        <p className="text-xs text-gray-400">{new Date(token.metadata_last_updated_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{getTimeAgo(token.metadata_last_updated_at)}</span>
                          <span className="sm:hidden">{getTimeAgo(token.metadata_last_updated_at, true)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Score Calculated */}
                  {token.score_calculated_at && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center z-10 relative">
                        <span className="text-xs">📊</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-yellow-400">Score Calculated</p>
                        <p className="text-xs text-gray-400">{new Date(token.score_calculated_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{getTimeAgo(token.score_calculated_at)}</span>
                          <span className="sm:hidden">{getTimeAgo(token.score_calculated_at, true)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Last Update */}
                  {token.updated_at && (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center z-10 relative animate-pulse">
                        <span className="text-xs">🔄</span>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-orange-400">Last Update</p>
                        <p className="text-xs text-gray-400">{new Date(token.updated_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline">{getTimeAgo(token.updated_at)}</span>
                          <span className="sm:hidden">{getTimeAgo(token.updated_at, true)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional timeline metadata */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {token.last_refresh_attempt && (
                  <div className="bg-dark-300/50 rounded p-2">
                    <p className="text-gray-500">Last Refresh Attempt</p>
                    <p className="text-gray-300">
                      <span className="hidden sm:inline">{getTimeAgo(token.last_refresh_attempt)}</span>
                      <span className="sm:hidden">{getTimeAgo(token.last_refresh_attempt, true)}</span>
                    </p>
                  </div>
                )}
                {token.pool_price_calculated_at && (
                  <div className="bg-dark-300/50 rounded p-2">
                    <p className="text-gray-500">Price Calculated</p>
                    <p className="text-gray-300">
                      <span className="hidden sm:inline">{getTimeAgo(token.pool_price_calculated_at)}</span>
                      <span className="sm:hidden">{getTimeAgo(token.pool_price_calculated_at, true)}</span>
                    </p>
                  </div>
                )}
                {token.last_is_active_evaluation_at && (
                  <div className="bg-dark-300/50 rounded p-2">
                    <p className="text-gray-500">Activity Evaluated</p>
                    <p className="text-gray-300">
                      <span className="hidden sm:inline">{getTimeAgo(token.last_is_active_evaluation_at)}</span>
                      <span className="sm:hidden">{getTimeAgo(token.last_is_active_evaluation_at, true)}</span>
                    </p>
                  </div>
                )}
                {token.last_jupiter_sync_at && (
                  <div className="bg-dark-300/50 rounded p-2">
                    <p className="text-gray-500">Jupiter Sync</p>
                    <p className="text-gray-300">
                      <span className="hidden sm:inline">{getTimeAgo(token.last_jupiter_sync_at)}</span>
                      <span className="sm:hidden">{getTimeAgo(token.last_jupiter_sync_at, true)}</span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Token Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="h-full">
                <div className="p-6">

                  {/* Contract Address */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
                      <code className="text-xs text-gray-300 break-all flex-1">
                        {TokenHelpers.getAddress(token)}
                      </code>
                      <button
                        onClick={() => {
                          const address = TokenHelpers.getAddress(token);
                          if (address) {
                            navigator.clipboard.writeText(address).then(() => {
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            });
                          }
                        }}
                        className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-white text-xs rounded transition-colors min-w-[50px]"
                      >
                        {copySuccess ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="mb-6">
                    <div className="space-y-2">
                      {token.launchpad && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-400 text-sm">Launchpad</span>
                          <span className="text-white text-sm font-medium">
                            {token.launchpad === 'pump.fun' ? '🚀 Pump.fun' : token.launchpad}
                          </span>
                        </div>
                      )}
                      {token.total_supply && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-400 text-sm">Total Supply</span>
                          <span className="text-white text-sm">{formatNumber(parseFloat(String(token.total_supply)), "short")}</span>
                        </div>
                      )}
                      {token.discovery_count !== undefined && (user?.role === 'admin' || user?.role === 'superadmin') && (
                        <div className="flex justify-between py-1 bg-red-500/10 border border-red-500/20 rounded px-2">
                          <span className="text-red-400 text-sm">🔒 Discovery Count</span>
                          <span className="text-white text-sm">{token.discovery_count}</span>
                        </div>
                      )}
                      {token.momentum_indicator && (user?.role === 'admin' || user?.role === 'superadmin') && (
                        <div className="flex justify-between py-1 bg-red-500/10 border border-red-500/20 rounded px-2">
                          <span className="text-red-400 text-sm">🔒 Momentum</span>
                          <span className={`text-sm font-medium ${
                            token.momentum_indicator === 'stable' ? 'text-blue-400' :
                            token.momentum_indicator === 'rising' ? 'text-green-400' :
                            token.momentum_indicator === 'falling' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {token.momentum_indicator.charAt(0).toUpperCase() + token.momentum_indicator.slice(1)}
                          </span>
                        </div>
                      )}
                      {token.price_calculation_method && (user?.role === 'admin' || user?.role === 'superadmin') && (
                        <div className="flex justify-between py-1 bg-red-500/10 border border-red-500/20 rounded px-2">
                          <span className="text-red-400 text-sm">🔒 Price Method</span>
                          <span className="text-white text-xs">{token.price_calculation_method.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Right Column - Enhanced Market Data */}
            {token.refresh_metadata?.enhanced_market_data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="h-full">
                  <div className="p-6">
                    
                    {/* Compact Grid with Shared Headers */}
                    <div className="space-y-3">
                      {/* Time Period Headers */}
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div></div> {/* Empty cell for row labels */}
                        <div className="text-center text-gray-400 font-medium">5 min</div>
                        <div className="text-center text-gray-400 font-medium">1 hour</div>
                        <div className="text-center text-gray-400 font-medium">6 hours</div>
                        <div className="text-center text-gray-400 font-medium">24 hours</div>
                      </div>

                      {/* Volume Row */}
                      {token.refresh_metadata?.enhanced_market_data?.volumes && (
                        <div className="grid grid-cols-5 gap-2 items-center">
                          <div className="text-xs text-gray-400">Volume</div>
                          {(['m5', 'h1', 'h6', 'h24'] as const).map((period) => {
                            const volume = token.refresh_metadata?.enhanced_market_data?.volumes?.[period];
                            return (
                              <div key={period} className="bg-dark-300/50 rounded px-2 py-1.5 text-center">
                                <p className="text-xs font-medium text-white">${formatNumber(volume || 0, "short")}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Price Change Row */}
                      {token.refresh_metadata?.enhanced_market_data?.priceChanges && (
                        <div className="grid grid-cols-5 gap-2 items-center">
                          <div className="text-xs text-gray-400">Change</div>
                          {(['m5', 'h1', 'h6', 'h24'] as const).map((period) => {
                            const change = token.refresh_metadata?.enhanced_market_data?.priceChanges?.[period] || 0;
                            const isPositive = change >= 0;
                            return (
                              <div key={period} className="bg-dark-300/50 rounded px-2 py-1.5 text-center">
                                <p className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {isPositive ? '+' : ''}{formatNumber(change, 2)}%
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Buy/Sell Row */}
                      {token.refresh_metadata?.enhanced_market_data?.transactions && (
                        <div className="grid grid-cols-5 gap-2 items-center">
                          <div className="text-xs text-gray-400">Buy/Sell</div>
                          {(['m5', 'h1', 'h6', 'h24'] as const).map((period) => {
                            const tx = token.refresh_metadata?.enhanced_market_data?.transactions?.[period];
                            if (!tx) return <div key={period} className="bg-dark-300/50 rounded px-2 py-1.5" />;
                            const buyRatio = tx.buys / (tx.buys + tx.sells) * 100;
                            return (
                              <div key={period} className="bg-dark-300/50 rounded px-2 py-1.5">
                                <div className="text-xs text-center mb-1">
                                  <span className="text-green-400">{tx.buys}</span>
                                  <span className="text-gray-500 mx-0.5">/</span>
                                  <span className="text-red-400">{tx.sells}</span>
                                </div>
                                <div className="w-full bg-dark-400 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                                    style={{ width: `${buyRatio}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Additional Metadata */}
                    <div className="border-t border-dark-400/50 pt-4 mt-4 space-y-2">
                      {token.refresh_metadata?.enhanced_market_data?.pairCreatedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Pool Created</span>
                          <span>
                            <span className="text-gray-400 text-xs">
                              <span className="hidden sm:inline">{getTimeAgo(token.refresh_metadata?.enhanced_market_data?.pairCreatedAt || '')}</span>
                              <span className="sm:hidden">{getTimeAgo(token.refresh_metadata?.enhanced_market_data?.pairCreatedAt || '', true)}</span>
                            </span>
                            <span className="text-white ml-3">
                              {new Date(token.refresh_metadata?.enhanced_market_data?.pairCreatedAt).toLocaleString([], { 
                                year: 'numeric', 
                                month: 'numeric', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                      {token.refresh_metadata?.last_enrichment_success && (user?.role === 'admin' || user?.role === 'superadmin') && (
                        <div className="flex justify-between text-sm bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                          <span className="text-red-400">🔒 Last Data Update</span>
                          <span>
                            <span className="text-gray-400 text-xs">
                              <span className="hidden sm:inline">{getTimeAgo(token.refresh_metadata?.last_enrichment_success || '')}</span>
                              <span className="sm:hidden">{getTimeAgo(token.refresh_metadata?.last_enrichment_success || '', true)}</span>
                            </span>
                            <span className="text-white ml-3">
                              {new Date(token.refresh_metadata?.last_enrichment_success || '').toLocaleString([], { 
                                year: 'numeric', 
                                month: 'numeric', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                      {token.refresh_metadata?.enrichment_status && (user?.role === 'admin' || user?.role === 'superadmin') && (
                        <div className="flex justify-between text-sm bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                          <span className="text-red-400">🔒 Enrichment Status</span>
                          <span className={`capitalize ${token.refresh_metadata?.enrichment_status === 'complete' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {token.refresh_metadata?.enrichment_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* All Date Fields Container - Admin Only */}
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="h-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-red-400">🔒</span> All Token Timestamps
                      </h3>
                      <button
                        onClick={() => setSortByRecency(!sortByRecency)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          sortByRecency 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
                        }`}
                      >
                        {sortByRecency ? '🕒 By Recency' : '📋 Default'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {getTimestampFields().map((field) => (
                        <div key={field.key} className="flex justify-between text-sm bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                          <span className="text-red-400">🔒 {field.label}</span>
                          <span className="flex flex-col sm:flex-row sm:items-center">
                            <span className="text-gray-400 text-xs">
                              <span className="hidden sm:inline">{getTimeAgo(field.value!)}</span>
                              <span className="sm:hidden">{getTimeAgo(field.value!, true)}</span>
                            </span>
                            <span className="text-white sm:ml-3 text-xs sm:text-sm">
                              {new Date(field.value!).toLocaleString([], { 
                                year: 'numeric', 
                                month: 'numeric', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* WebSocket Debug Panel - Only for admin/superadmin */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono text-sm rounded-lg shadow-lg"
            >
              {showDebug ? 'HIDE' : 'SHOW'} WS DEBUG
            </button>
          </div>
        )}

        {showDebug && (
          <div className="fixed top-20 right-4 w-96 max-h-[80vh] bg-black/95 border-2 border-red-500 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-red-500">
              <h3 className="text-red-400 font-mono font-bold">WEBSOCKET DEBUG</h3>
              <p className="text-xs text-gray-400 mt-1">Token: {address}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current State */}
              <div className="border border-gray-700 rounded p-3">
                <h4 className="text-yellow-400 font-mono text-sm mb-2">CURRENT STATE:</h4>
                <div className="text-xs font-mono space-y-1">
                  <div className="text-gray-300">
                    Image URL: <span className={token?.image_url ? 'text-green-400' : 'text-red-400'}>
                      {token?.image_url ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    Header Image: <span className={token?.header_image_url ? 'text-green-400' : 'text-red-400'}>
                      {token?.header_image_url ? '✓ Present' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    Last Update Type: <span className={lastUpdateType === 'minimal' ? 'text-orange-400' : 'text-green-400'}>
                      {lastUpdateType ? lastUpdateType.toUpperCase() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Initial REST Response - Collapsible */}
              {initialRestResponse && (
                <div className="border border-gray-700 rounded p-3">
                  <button
                    onClick={() => setShowRestResponse(!showRestResponse)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-800/50 rounded transition-colors p-1 -m-1"
                  >
                    <h4 className="text-blue-400 font-mono text-sm">INITIAL REST RESPONSE:</h4>
                    <span className="text-gray-400 text-xs">
                      {showRestResponse ? '▼' : '▶'} {Object.keys(initialRestResponse).length} fields
                    </span>
                  </button>
                  {showRestResponse && (
                    <div className="mt-2 text-xs font-mono">
                      <div className="text-green-400 mb-1">
                        Fields: {Object.keys(initialRestResponse).join(', ')}
                      </div>
                      <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {JSON.stringify(initialRestResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Last Message */}
              {lastRawMessage && (
                <div className="border border-gray-700 rounded p-3">
                  <h4 className="text-yellow-400 font-mono text-sm mb-2">LAST WS MESSAGE:</h4>
                  <div className="text-xs font-mono">
                    <div className="text-blue-400 mb-1">Fields received: {Object.keys(lastRawMessage).join(', ')}</div>
                    <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(lastRawMessage, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Message History */}
              <div className="border border-gray-700 rounded p-3">
                <h4 className="text-yellow-400 font-mono text-sm mb-2">MESSAGE HISTORY:</h4>
                <div className="space-y-2">
                  {messageHistory.length === 0 ? (
                    <p className="text-gray-500 text-xs">No messages yet...</p>
                  ) : (
                    messageHistory.map((msg, idx) => (
                      <div key={idx} className="text-xs font-mono border-b border-gray-800 pb-2">
                        <div className="text-gray-400">{msg.timestamp}</div>
                        <div className="text-blue-400">Fields: {msg.fields.join(', ')}</div>
                        <div className={`${msg.fields.includes('image_url') ? 'text-yellow-300' : 'text-gray-500'}`}>
                          Has images: {msg.fields.includes('image_url') || msg.fields.includes('header_image_url') ? 'YES' : 'NO'}
                        </div>
                        <div className={`${msg.fields.length <= 4 ? 'text-orange-400' : 'text-green-400'}`}>
                          Type: {msg.fields.length <= 4 && msg.fields.includes('price') && !msg.fields.includes('image_url') ? 'MINIMAL UPDATE' : 'FULL UPDATE'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SilentErrorBoundary>
  );
};

export default TokenDetailPageNew;