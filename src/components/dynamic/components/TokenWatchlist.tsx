// src/components/dynamic/components/TokenWatchlist.tsx

/**
 * Dynamic Token Watchlist Component
 * 
 * @description AI-generated token monitoring component with live prices
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

import React, { useState, useMemo } from 'react';
import { DynamicComponentProps, TokenWatchlistData } from '../types';
import { Button } from '../../ui/Button';

const TokenWatchlist: React.FC<DynamicComponentProps> = ({
  id,
  data,
  onClose: _onClose,
  onUpdate,
  className = ''
}) => {
  const watchlistData = data as TokenWatchlistData;
  const [sortBy, setSortBy] = useState(watchlistData?.sortBy || 'change');
  const [compact, setCompact] = useState(watchlistData?.compact || false);

  const sortedTokens = useMemo(() => {
    if (!watchlistData?.tokens?.length) return [];

    return [...watchlistData.tokens].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.change_24h - a.change_24h;
        case 'volume':
          return b.volume_24h - a.volume_24h;
        case 'market_cap':
          return (b.market_cap || 0) - (a.market_cap || 0);
        default:
          return 0;
      }
    });
  }, [watchlistData?.tokens, sortBy]);

  if (!watchlistData?.tokens?.length) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 text-sm font-mono mb-4">
          No tokens in watchlist
        </div>
        <Button
          size="sm"
          onClick={() => onUpdate?.({ 
            tokens: [
              { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', price: 23.45, change_24h: 5.2, volume_24h: 1234567890 },
              { symbol: 'ETH', address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', price: 1650.30, change_24h: -2.1, volume_24h: 987654321 }
            ]
          })}
        >
          Add Sample Tokens
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-mauve/20">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-mono text-white font-semibold">
            Token Watchlist
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={compact ? "primary" : "outline"}
              onClick={() => {
                setCompact(!compact);
                onUpdate?.({ ...watchlistData, compact: !compact });
              }}
              className="text-xs"
            >
              {compact ? 'Expanded' : 'Compact'}
            </Button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          {(['price', 'change', 'volume', 'market_cap'] as const).map((sort) => (
            <Button
              key={sort}
              size="sm"
              variant={sortBy === sort ? "primary" : "outline"}
              onClick={() => {
                setSortBy(sort);
                onUpdate?.({ ...watchlistData, sortBy: sort });
              }}
              className="text-xs capitalize"
            >
              {sort.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Token List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedTokens.map((token, index) => (
          <div
            key={`${id}-${token.symbol}-${index}`}
            className="p-3 border-b border-mauve/10 hover:bg-darkGrey-dark/30 transition-colors"
          >
            {compact ? (
              /* Compact View */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-mauve/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-mono font-bold">
                      {token.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-white text-sm">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      {formatPrice(token.price)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono font-semibold ${
                    token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                  </div>
                  {token.alerts && (
                    <div className="text-xs text-yellow-400 font-mono">🔔</div>
                  )}
                </div>
              </div>
            ) : (
              /* Expanded View */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-mauve/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-mono font-bold">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono font-semibold text-white">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {token.address.slice(0, 8)}...{token.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                  {token.alerts && (
                    <div className="text-yellow-400 text-sm">🔔 Alert Active</div>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs font-mono">Price</div>
                    <div className="font-mono font-semibold text-white">
                      {formatPrice(token.price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs font-mono">24h Change</div>
                    <div className={`font-mono font-semibold ${
                      token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs font-mono">Volume 24h</div>
                    <div className="font-mono font-semibold text-white">
                      {formatVolume(token.volume_24h)}
                    </div>
                  </div>
                  {token.market_cap && (
                    <div>
                      <div className="text-gray-400 text-xs font-mono">Market Cap</div>
                      <div className="font-mono font-semibold text-white">
                        {formatVolume(token.market_cap)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-mauve/20 flex gap-2 bg-darkGrey-dark/20">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Add new token functionality
            console.log('Add new token to watchlist');
          }}
          className="text-xs"
        >
          + Add Token
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Set alerts functionality
            console.log('Set alerts for watchlist');
          }}
          className="text-xs"
        >
          🔔 Set Alerts
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Refresh prices
            console.log('Refresh token prices');
          }}
          className="text-xs"
        >
          ↻ Refresh
        </Button>
      </div>
    </div>
  );
};

export default TokenWatchlist;