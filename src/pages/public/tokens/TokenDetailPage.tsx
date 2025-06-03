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
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { formatNumber } from "../../../utils/format";
import { setupTokenOGMeta, resetToDefaultMeta, getTokenOGImageUrl, OGImage } from "../../../utils/ogImageUtils";

export const TokenDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [error, setError] = useState<string | null>(null);

  // Use the standardized token data hook to get all tokens
  const {
    getTokenBySymbol,
    isLoading,
    isConnected,
    error: wsError
  } = useStandardizedTokenData("all");

  // Get the specific token by symbol
  const token = symbol ? getTokenBySymbol(symbol) : null;

  useEffect(() => {
    if (!symbol) {
      setError("Token symbol is required");
      return;
    }

    if (!isLoading && !token && isConnected) {
      setError(`Token ${symbol.toUpperCase()} not found`);
    } else if (token) {
      // Setup OG meta tags when token is found
      setupTokenOGMeta(
        token.symbol,
        token.name,
        String(token.price)
      );
    }

    return () => {
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, [symbol, token, isLoading, isConnected]);

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
  if (error || wsError || !token) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-dark-300/50 backdrop-blur-sm border-red-500/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
              <p className="text-gray-300 mb-6">
                {error || wsError || `Token ${symbol?.toUpperCase()} not found`}
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
            {/* Back Button */}
            <Link 
              to="/tokens" 
              className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
              ← Back to Tokens
            </Link>

            {/* Token Header */}
            <div className="bg-dark-300/50 backdrop-blur-sm rounded-xl p-6 border border-dark-400">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {token.images?.imageUrl && (
                    <img 
                      src={token.images.imageUrl} 
                      alt={token.symbol} 
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-white">{token.symbol}</h1>
                    <p className="text-gray-400">{token.name}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    ${formatNumber(token.price, 6, true)}
                  </div>
                  <div className={`text-lg font-semibold ${
                    Number(token.change24h) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {Number(token.change24h) >= 0 ? '+' : ''}{formatNumber(token.change24h, 2, true)}%
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
                <Card className="bg-dark-300/50 backdrop-blur-sm border-dark-400">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Market Statistics</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark-400/30 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Market Cap</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(token.marketCap, "short")}
                        </p>
                      </div>
                      
                      <div className="bg-dark-400/30 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">24h Volume</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(token.volume24h, "short")}
                        </p>
                      </div>
                      
                      <div className="bg-dark-400/30 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">FDV</p>
                        <p className="text-xl font-semibold text-white">
                          ${formatNumber(token.fdv || "0", "short")}
                        </p>
                      </div>
                      
                      <div className="bg-dark-400/30 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Total Supply</p>
                        <p className="text-xl font-semibold text-white">
                          {formatNumber(token.totalSupply || "0", "short")}
                        </p>
                      </div>
                    </div>

                    {/* Price Changes */}
                    {token.priceChanges && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Price Changes</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {['5m', '1h', '6h', '24h'].map((period) => (
                            <div key={period} className="text-center">
                              <p className="text-gray-400 text-xs uppercase">{period}</p>
                              <p className={`text-sm font-semibold ${
                                Number(token.priceChanges?.[period as keyof typeof token.priceChanges] || 0) >= 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {Number(token.priceChanges?.[period as keyof typeof token.priceChanges] || 0) >= 0 ? '+' : ''}
                                {formatNumber(token.priceChanges?.[period as keyof typeof token.priceChanges] || "0", 2, true)}%
                              </p>
                            </div>
                          ))}
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
                <Card className="bg-dark-300/50 backdrop-blur-sm border-dark-400">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Token Information</h2>
                    
                    {/* Contract Address */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-1">Contract Address</p>
                      <p className="text-white text-xs font-mono break-all">
                        {token.contractAddress}
                      </p>
                    </div>

                    {/* Description */}
                    {token.description && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-1">Description</p>
                        <p className="text-white text-sm">
                          {token.description}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {token.tags && token.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {token.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-brand-500/20 text-brand-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Links</p>
                      <div className="space-y-2">
                        {token.websites && token.websites.map((website, index) => (
                          <a
                            key={index}
                            href={typeof website === 'string' ? website : website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-400 hover:text-blue-300 text-sm truncate"
                          >
                            {typeof website === 'string' ? website : (website.label || website.url)}
                          </a>
                        ))}
                        {token.socials?.twitter && (
                          <a
                            href={token.socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Twitter
                          </a>
                        )}
                        {token.socials?.telegram && (
                          <a
                            href={token.socials.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Telegram
                          </a>
                        )}
                        {token.socials?.discord && (
                          <a
                            href={token.socials.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Discord
                          </a>
                        )}
                      </div>
                    </div>
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