// src/components/dynamic/components/TokenWatchlist.tsx

/**
 * Dynamic Token Watchlist Component
 * 
 * @description AI-generated token monitoring component with live prices
 * @author BranchManager69 + Claude Code
 * @version 2.0.0
 * @created 2025-05-25
 * @updated 2025-01-26
 */

import React, { useState } from 'react';
import { DynamicComponentProps, TokenWatchlistData } from '../types';
import { Button } from '../../ui/Button';
import { useIndividualToken } from '../../../hooks/websocket/topic-hooks/useIndividualToken';
import { TokenSearch } from '../../common/TokenSearch';
import { SearchToken } from '../../../types';
import { config } from '../../../config/config';

// Default token addresses for the watchlist
const DEFAULT_TOKENS = [
  { address: config.SOLANA.DEGEN_TOKEN_ADDRESS, symbol: 'DUEL' },
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL' },
  { address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'ETH' },
  { address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', symbol: 'BTC' },
];

// Individual token item with real-time data
const TokenItem: React.FC<{
  tokenAddress: string;
  compact: boolean;
  showAlerts?: boolean;
  onRemove?: () => void;
}> = ({ tokenAddress, compact, showAlerts, onRemove }) => {
  const { token, isLoading, error } = useIndividualToken(tokenAddress);

  if (isLoading) {
    return (
      <div className="p-3 border-b border-mauve/10 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-mauve/20 rounded-full"></div>
            <div>
              <div className="h-4 w-12 bg-mauve/20 rounded mb-1"></div>
              <div className="h-3 w-16 bg-mauve/10 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-12 bg-mauve/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="p-3 border-b border-red-500/20 text-red-400 text-xs">
        Error loading token {tokenAddress.slice(0, 8)}...
      </div>
    );
  }

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

  if (compact) {
    return (
      <div className="p-3 border-b border-mauve/10 hover:bg-darkGrey-dark/30 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token.image_url ? (
              <img 
                src={token.image_url} 
                alt={token.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-8 h-8 bg-mauve/20 rounded-full flex items-center justify-center ${token.image_url ? 'hidden' : ''}`}>
              <span className="text-xs font-bold">
                {token.symbol.slice(0, 2)}
              </span>
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                {token.name || token.symbol} {token.name && `(${token.symbol})`}
              </div>
              <div className="text-xs text-gray-400">
                {formatPrice(token.price || 0)}
              </div>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <div className={`text-sm font-semibold ${
                (token.change_24h || 0) === 0 ? 'text-gray-400' : (token.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatChange(token.change_24h || 0)}
              </div>
              {showAlerts && (
                <div className="text-xs text-yellow-400 ">🔔</div>
              )}
            </div>
            {onRemove && (
              <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm transition-all"
                title="Remove token"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border-b border-mauve/10 hover:bg-darkGrey-dark/30 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {token.image_url ? (
            <img 
              src={token.image_url} 
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-10 h-10 bg-mauve/20 rounded-full flex items-center justify-center ${token.image_url ? 'hidden' : ''}`}>
            <span className="text-sm  font-bold">
              {token.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-semibold text-white">
              {token.name || token.symbol} {token.name && `(${token.symbol})`}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(token.address)}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              title="Click to copy address"
            >
              {token.address.slice(0, 6)}...{token.address.slice(-6)}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showAlerts && (
            <div className="text-yellow-400 text-sm">🔔 Alert Active</div>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 px-2 py-1 rounded transition-all"
              title="Remove token"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {token.market_cap && token.market_cap > 0 && token.symbol !== 'SOL' && (
          <div>
            <div className="text-gray-400 text-xs">Market Cap</div>
            <div className="font-semibold text-white">
              {formatVolume(token.market_cap)}
            </div>
          </div>
        )}
        <div>
          <div className="text-gray-400 text-xs">Price</div>
          <div className="font-semibold text-white">
            {formatPrice(token.price || 0)}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">24h Change</div>
          <div className={`font-semibold ${
            (token.change_24h || 0) === 0 ? 'text-gray-400' : (token.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatChange(token.change_24h || 0)}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Volume 24h</div>
          <div className="font-semibold text-white">
            {formatVolume(token.volume_24h || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

const TokenWatchlist: React.FC<DynamicComponentProps> = ({
  id,
  data,
  onClose: _onClose,
  onUpdate,
  className = ''
}) => {
  const watchlistData = data as TokenWatchlistData;
  const [compact, setCompact] = useState(watchlistData?.compact || false);
  const [showAddToken, setShowAddToken] = useState(false);
  
  // Use default tokens if none provided, then manage state
  const [tokenAddresses, setTokenAddresses] = useState<string[]>(() => {
    if (watchlistData?.tokens?.length) {
      const providedAddresses = watchlistData.tokens.map(t => t.address).filter(Boolean);
      console.log('[TokenWatchlist] Using provided tokens:', providedAddresses);
      return providedAddresses;
    }
    console.log('[TokenWatchlist] Using default tokens:', DEFAULT_TOKENS);
    return DEFAULT_TOKENS.map(t => t.address);
  });

  // Add token to watchlist
  const handleAddToken = (token: SearchToken) => {
    if (!tokenAddresses.includes(token.address)) {
      const newAddresses = [...tokenAddresses, token.address];
      setTokenAddresses(newAddresses);
      
      // Update parent component with new data
      onUpdate?.({
        ...watchlistData,
        tokens: newAddresses.map(addr => ({ address: addr }))
      });
    }
    setShowAddToken(false);
  };

  // Remove token from watchlist
  const handleRemoveToken = (addressToRemove: string) => {
    const newAddresses = tokenAddresses.filter(addr => addr !== addressToRemove);
    setTokenAddresses(newAddresses);
    
    onUpdate?.({
      ...watchlistData,
      tokens: newAddresses.map(addr => ({ address: addr }))
    });
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-mauve/20">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg text-white font-semibold">
            Token Watchlist
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAddToken(true)}
              className="text-xs px-3"
            >
              Add Token
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Set alerts functionality doesn't work yet
              }}
              className="text-xs px-2 opacity-50 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              🔔
            </Button>
            <Button
              size="sm"
              variant={compact ? "primary" : "secondary"}
              onClick={() => {
                setCompact(!compact);
                onUpdate?.({ ...watchlistData, compact: !compact });
              }}
              className="text-xs px-2"
              title={compact ? "Switch to expanded view" : "Switch to compact view"}
            >
              {compact ? '⊞' : '☰'}
            </Button>
          </div>
        </div>

      </div>

      {/* Add Token Search */}
      {showAddToken && (
        <div className="p-4 border-b border-mauve/20 bg-darkGrey-dark/20">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-white">Add Token</h4>
            <button
              onClick={() => setShowAddToken(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <TokenSearch
            onSelectToken={handleAddToken}
            placeholder="Search for a token to add..."
            variant="minimal"
            clearOnSelect={true}
          />
        </div>
      )}

      {/* Token List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {tokenAddresses.map((address, index) => (
          <TokenItem
            key={`${id}-${address}-${index}`}
            tokenAddress={address}
            compact={compact}
            showAlerts={false}
            onRemove={() => handleRemoveToken(address)}
          />
        ))}
      </div>

    </div>
  );
};

export default TokenWatchlist;