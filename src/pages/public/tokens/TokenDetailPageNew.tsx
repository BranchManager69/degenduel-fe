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
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { formatNumber } from "../../../utils/format";
import { setupTokenOGMeta, resetToDefaultMeta } from "../../../utils/ogImageUtils";
import { TokenHelpers } from "../../../types";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useIndividualToken } from "../../../hooks/websocket/topic-hooks/useIndividualToken";

export const TokenDetailPageNew: React.FC = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { address } = useParams<{ address: string }>();

  // Use the individual token hook for proper WebSocket subscription
  const {
    token,
    isLoading,
    isConnected,
    error: wsError,
    lastUpdate
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
      <div className="flex flex-col min-h-screen bg-dark-100">
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
      <div className="flex flex-col min-h-screen bg-dark-100">
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

  return (
    <SilentErrorBoundary>
      <div className="flex flex-col min-h-screen bg-dark-100">

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
              <div className="absolute inset-0 bg-gradient-to-b from-dark-100/50 via-dark-100/80 to-dark-100" />
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
                </div>
              </div>

              {/* Price Section */}
              <div className="text-left md:text-right">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-white">
                    ${formatNumber(TokenHelpers.getPrice(token), 6, true)}
                  </span>
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center text-lg font-semibold ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                    {isPositive ? '+' : ''}{formatNumber(priceChange24h, 2)}%
                  </motion.span>
                </div>
                
                {/* Real-time indicator */}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                  {isConnected ? 'Live updates' : 'Connecting...'}
                  {lastUpdate && (
                    <span className="text-xs">
                      • Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
                    </span>
                  )}
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
          {/* Key Metrics Bar - Minimalist version with only Market Cap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mb-8"
          >
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-400/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Market Cap</p>
                  <p className="text-xl font-bold text-white">${formatNumber(marketCap, "short")}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-400/20" />
              </div>
            </Card>
          </motion.div>

          {/* Token Information - Now the main content */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-400/50 h-full">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Token Information</h2>

                  {/* Contract Address */}
                  <div className="mb-6">
                    <p className="text-gray-400 text-sm mb-2">Contract Address</p>
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


                  {/* Links */}
                  <div>
                    <p className="text-gray-400 text-sm mb-3">Links</p>
                    <div className="space-y-2">
                      {((token.websites?.length ?? 0) > 0 || TokenHelpers.getSocials(token).length > 0) ? (
                        <>
                          {token.websites?.map((website: any, idx: number) => (
                            <a
                              key={idx}
                              href={typeof website === 'string' ? website : website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors group"
                            >
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                                {typeof website === 'string' ? 'Website' : (website.label || 'Website')}
                              </span>
                            </a>
                          ))}
                          
                          {TokenHelpers.getSocials(token).map((social, idx) => (
                            <a
                              key={idx}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-dark-300/50 rounded-lg hover:bg-dark-300 transition-colors group"
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                social.type === 'twitter' ? 'bg-blue-400' :
                                social.type === 'telegram' ? 'bg-blue-500' :
                                social.type === 'discord' ? 'bg-purple-400' :
                                'bg-gray-400'
                              }`} />
                              <span className="text-gray-300 group-hover:text-white transition-colors text-sm capitalize">
                                {social.type}
                              </span>
                            </a>
                          ))}
                        </>
                      ) : (
                        <div className="p-3 bg-dark-300/50 rounded-lg text-center">
                          <p className="text-gray-400 text-sm">No links available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </SilentErrorBoundary>
  );
};

export default TokenDetailPageNew;