// src/pages/public/tokens/TokenDetailPage.tsx

/**
 * Token Detail Page
 * 
 * @description Individual token page with detailed analytics, price charts, and OG image meta tags
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-01-29
 */

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SilentErrorBoundary } from "../../../components/common/ErrorBoundary";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Card } from "../../../components/ui/Card";
import { formatNumber } from "../../../utils/format";
import { setupTokenOGMeta, resetToDefaultMeta, getTokenOGImageUrl, OGImage } from "../../../utils/ogImageUtils";
import { ddApi } from "../../../services/dd-api";
import { Token } from "../../../types";

export const TokenDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setError("Token symbol is required");
      setIsLoading(false);
      return;
    }

    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For now, we'll simulate fetching a single token from the tokens API
        // In the future, there could be a dedicated token detail endpoint
        const response = await ddApi.fetch("/api/tokens");
        const data = await response.json();
        
        // Find the token by symbol
        const foundToken = data.tokens?.find((t: Token) => 
          t.symbol.toLowerCase() === symbol.toLowerCase()
        );
        
        if (!foundToken) {
          setError(`Token ${symbol.toUpperCase()} not found`);
          return;
        }
        
        setToken(foundToken);
        
        // Setup OG meta tags
        setupTokenOGMeta(
          foundToken.symbol,
          foundToken.name,
          foundToken.price
        );
        
      } catch (err) {
        console.error("Failed to fetch token data:", err);
        setError("Failed to load token details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();

    return () => {
      // Reset to default meta tags when leaving the page
      resetToDefaultMeta();
    };
  }, [symbol]);

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
  if (error || !token) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <span className="animate-pulse">⚠</span>
              <span>{error}</span>
              <span className="animate-pulse">⚠</span>
            </div>
            <Link
              to="/tokens"
              className="mt-4 inline-block px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              ← Back to Tokens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ogImageUrl = getTokenOGImageUrl(token.symbol);
  const tokenColor = getTokenColor(token.symbol);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex items-center text-sm text-gray-400">
          <Link to="/" className="hover:text-brand-400 transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link to="/tokens" className="hover:text-brand-400 transition-colors">
            Tokens
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-300">{token.symbol}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          
          {/* Token Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-lg mb-8"
          >
            {/* Background Image */}
            {token.images?.headerImage && (
              <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img
                    src={token.images.headerImage}
                    alt={`${token.symbol} header`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/90 to-dark-200/60" />
                </motion.div>
              </div>
            )}
            
            {/* Fallback gradient background */}
            {!token.images?.headerImage && (
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${tokenColor} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                }}
              />
            )}
            
            {/* Header Content */}
            <div className="relative z-10 p-6 sm:p-8 min-h-[300px] flex flex-col justify-end">
              <div className="flex items-center gap-6 mb-6">
                {/* Token Logo */}
                {token.images?.imageUrl && (
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-black/40 backdrop-blur-sm border-2 border-white/20">
                    <img 
                      src={token.images.imageUrl} 
                      alt={`${token.symbol} logo`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                
                {/* Token Info */}
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 animate-gradient-x leading-tight">
                    {token.symbol}
                  </h1>
                  {token.name && (
                    <p className="text-xl text-gray-200 mt-2">{token.name}</p>
                  )}
                  {token.description && (
                    <p className="text-gray-300 mt-2 max-w-2xl">{token.description}</p>
                  )}
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-400">Price</div>
                  <div className="text-2xl font-bold text-white">${formatNumber(parseFloat(token.price))}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-400">Market Cap</div>
                  <div className="text-2xl font-bold text-white">${formatNumber(parseFloat(token.marketCap), 'short')}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-400">24h Change</div>
                  <div className={`text-2xl font-bold ${parseFloat(token.change24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(token.change24h) >= 0 ? '+' : ''}{formatNumber(parseFloat(token.change24h))}%
                  </div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-400">24h Volume</div>
                  <div className="text-2xl font-bold text-white">${formatNumber(parseFloat(token.volume24h), 'short')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Share Section */}
          <div className="mb-8">
            <Card className="bg-dark-200/80 backdrop-blur-sm border-brand-400/20 p-6">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Share {token.symbol}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OG Image Preview */}
                <div>
                  <p className="text-sm text-gray-400 mb-3">Social Media Preview:</p>
                  <SilentErrorBoundary>
                    <OGImage
                      src={ogImageUrl}
                      alt={`${token.symbol} Social Preview`}
                      className="w-full h-40"
                      fallbackText={`${token.symbol} preview generating...`}
                    />
                  </SilentErrorBoundary>
                </div>
                
                {/* Share Options */}
                <div>
                  <p className="text-sm text-gray-400 mb-3">Share Options:</p>
                  <div className="space-y-3">
                    <ShareButton
                      platform="twitter"
                      text={`Check out ${token.symbol} on @DegenDuelMe! 📊\n\nPrice: $${formatNumber(parseFloat(token.price))}\n24h Change: ${parseFloat(token.change24h) >= 0 ? '+' : ''}${formatNumber(parseFloat(token.change24h))}%\n\n#${token.symbol} #DegenDuel #CryptoTrading`}
                      url={window.location.href}
                    />
                    <ShareButton
                      platform="copy"
                      text={`${token.symbol} on DegenDuel`}
                      url={window.location.href}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Token Analytics - Placeholder for future implementation */}
          <div className="space-y-8">
            <Card className="bg-dark-200/80 backdrop-blur-sm border-brand-400/20 p-6">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Token Analytics</h3>
              <div className="text-center text-gray-400 py-8">
                <p>📊 Advanced token analytics coming soon!</p>
                <p className="text-sm mt-2">Price charts, trading volumes, holder analytics, and more...</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for token colors
function getTokenColor(symbol: string): string {
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
  return colors[symbol] || '#7F00FF';
}

// Simple share button component
interface ShareButtonProps {
  platform: 'twitter' | 'copy';
  text: string;
  url: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ platform, text, url }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-3 w-full p-3 bg-dark-300/50 hover:bg-dark-300/70 rounded-lg transition-colors"
    >
      {platform === 'twitter' ? (
        <>
          <div className="w-5 h-5 text-blue-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </div>
          <span className="text-white">Share on Twitter</span>
        </>
      ) : (
        <>
          <div className="w-5 h-5 text-gray-400">
            {copied ? (
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <span className="text-white">{copied ? 'Copied!' : 'Copy Link'}</span>
        </>
      )}
    </button>
  );
};

export default TokenDetailPage;