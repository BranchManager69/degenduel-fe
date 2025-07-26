// src/components/dynamic/components/TokenDetails.tsx

/**
 * Dynamic Token Details Component
 * 
 * @description Comprehensive token information display with search functionality
 * @author BranchManager69 + Claude Code
 * @version 2.0.0
 * @created 2025-05-25
 * @updated 2025-01-26
 */

import React, { useState, useEffect } from 'react';
import { DynamicComponentProps } from '../types';
import { Button } from '../../ui/Button';
import { TokenSearch } from '../../common/TokenSearch';
import { CopyToClipboard } from '../../common/CopyToClipboard';
import { useIndividualToken } from '../../../hooks/websocket/topic-hooks/useIndividualToken';
import { SearchToken } from '../../../types';

const TokenDetails: React.FC<DynamicComponentProps> = ({ 
  data, 
  className = '' 
}) => {
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string | null>(null);
  
  // Default to DUEL token if no data provided
  const defaultTokenAddress = 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX';
  const tokenAddress = selectedTokenAddress || defaultTokenAddress;
  
  // Use the shared WebSocket hook for real-time data
  const { token, isLoading, error } = useIndividualToken(tokenAddress);

  useEffect(() => {
    // Set initial token from provided data if available
    if (data?.tokens && data.tokens.length > 0) {
      setSelectedTokenAddress(data.tokens[0].address);
    }
  }, [data]);

  // Handle token search selection
  const handleTokenSelect = (searchToken: SearchToken) => {
    setSelectedTokenAddress(searchToken.address);
  };

  // Utility functions (matching TokenWatchlist patterns)
  const formatPrice = (price: number) => {
    if (price === 0) return '—';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume === 0) return '—';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const formatChange = (change: number) => {
    if (change === 0) return '—';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-mauve/20 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-mauve/20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-mauve/10 rounded"></div>
            <div className="h-4 bg-mauve/10 rounded w-2/3"></div>
            <div className="h-4 bg-mauve/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !token) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-red-400 text-center text-sm">
          Error loading token data
          <div className="mt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedTokenAddress(defaultTokenAddress)}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Token Search */}
      <div className="mb-4">
        <TokenSearch
          onSelectToken={handleTokenSelect}
          placeholder="Search for a token to analyze..."
          variant="minimal"
          showPriceData={false}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-mauve/20 pb-4">
        <div className="flex items-center gap-3">
          {token.image_url ? (
            <img 
              src={token.image_url} 
              alt={token.symbol || 'Token'}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-mauve/20 rounded-full flex items-center justify-center ${token.image_url ? 'hidden' : ''}`}>
            <span className="text-sm font-bold">
              {token.symbol?.slice(0, 2) || '??'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {token.symbol || 'Unknown'}
              <span className="text-sm text-gray-400 font-normal">
                {token.name || 'Unknown Token'}
              </span>
            </h2>
            <CopyToClipboard 
              text={token.address} 
              className="text-xs text-gray-500 font-mono"
            >
              {token.address.slice(0, 8)}...{token.address.slice(-8)}
            </CopyToClipboard>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {formatPrice(token.price || 0)}
          </div>
          <div className={`text-sm font-semibold ${getChangeColor(token.change_24h || 0)}`}>
            {formatChange(token.change_24h || 0)}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-darkGrey-dark/30 border border-mauve/10 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">24h Volume</div>
          <div className="text-white font-semibold text-sm">
            {formatVolume(token.volume_24h || 0)}
          </div>
        </div>
        
        <div className="bg-darkGrey-dark/30 border border-mauve/10 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Market Cap</div>
          <div className="text-white font-semibold text-sm">
            {formatVolume(token.market_cap || 0)}
          </div>
        </div>
        
        <div className="bg-darkGrey-dark/30 border border-mauve/10 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">5m Change</div>
          <div className={`font-semibold text-sm ${getChangeColor(token.priceChanges?.m5 || 0)}`}>
            {formatChange(token.priceChanges?.m5 || 0)}
          </div>
        </div>
        
        <div className="bg-darkGrey-dark/30 border border-mauve/10 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">1h Change</div>
          <div className={`font-semibold text-sm ${getChangeColor(token.priceChanges?.h1 || 0)}`}>
            {formatChange(token.priceChanges?.h1 || 0)}
          </div>
        </div>
      </div>

      {/* Token Description */}
      {token.description && (
        <div className="bg-darkGrey-dark/20 border border-mauve/10 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-2">About</div>
          <div className="text-gray-300 text-sm leading-relaxed">
            {token.description}
          </div>
        </div>
      )}

      {/* Social Links */}
      {token.socials && (
        <div className="flex gap-2 flex-wrap">
          {token.socials.website && (
            <a
              href={token.socials.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-2 text-center text-blue-400 text-sm transition-colors"
            >
              🌐 Website
            </a>
          )}
          
          {token.socials.twitter && (
            <a
              href={token.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 rounded-lg px-3 py-2 text-center text-sky-400 text-sm transition-colors"
            >
              🐦 Twitter
            </a>
          )}
          
          {token.socials.telegram && (
            <a
              href={token.socials.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 rounded-lg px-3 py-2 text-center text-cyan-400 text-sm transition-colors"
            >
              💬 Telegram
            </a>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigator.clipboard.writeText(token.address)}
        >
          📋 Copy Address
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setSelectedTokenAddress(defaultTokenAddress)}
        >
          🔄 Reset
        </Button>
      </div>
    </div>
  );
};

export default TokenDetails;