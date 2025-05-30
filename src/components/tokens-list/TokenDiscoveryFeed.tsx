/**
 * TokenDiscoveryFeed Component
 * 
 * Real-time feed of newly discovered tokens from DexScreener
 * Uses the useTokenProfiles hook for live WebSocket updates
 * 
 * @author Branch Manager
 * @created 2025-05-29
 */

import React, { useState } from 'react';
import { useTokenProfiles } from '../../hooks/websocket/topic-hooks/useTokenProfiles';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TokenDiscoveryFeedProps {
  /** Maximum number of tokens to display */
  maxDisplay?: number;
  /** Whether to show the header with stats */
  showHeader?: boolean;
  /** Whether to show chain badges */
  showChainBadges?: boolean;
  /** Whether to auto-scroll to new tokens */
  autoScroll?: boolean;
  /** Custom CSS class */
  className?: string;
}

export const TokenDiscoveryFeed: React.FC<TokenDiscoveryFeedProps> = ({
  maxDisplay = 20,
  showHeader = true,
  showChainBadges = true,
  // autoScroll = true, // TODO: Implement auto-scroll feature
  className = ''
}) => {
  const { 
    profiles, 
    latestProfile, 
    isConnected, 
    isSubscribed, 
    stats,
    clearProfiles,
    getRecentProfiles,
    error 
  } = useTokenProfiles();

  const [isExpanded, setIsExpanded] = useState(false);

  // Get the tokens to display
  const tokensToShow = isExpanded ? profiles : getRecentProfiles(maxDisplay);

  // Format time since discovery
  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get chain color for badges
  const getChainColor = (chainId: string) => {
    switch (chainId) {
      case 'solana': return 'bg-purple-500';
      case 'ethereum': return 'bg-blue-500';
      case 'bsc': return 'bg-yellow-500';
      case 'polygon': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  // Truncate address for display
  const truncateAddress = (address: string, length = 8) => {
    if (address.length <= length) return address;
    return `${address.slice(0, length/2)}...${address.slice(-length/2)}`;
  };

  return (
    <Card className={`p-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Token Discovery Feed</h3>
            <p className="text-sm text-gray-400">
              Real-time discoveries from DexScreener
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected && isSubscribed ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-400">
                {isConnected && isSubscribed ? 'Live' : 'Disconnected'}
              </span>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {stats.totalDiscovered} discovered
              </div>
              <div className="text-xs text-gray-400">
                {stats.chainsDiscovered} chains
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">
            Error: {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {!isConnected && !error && (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Connecting to token discovery feed...</p>
        </div>
      )}

      {/* Connected but no data */}
      {isConnected && isSubscribed && tokensToShow.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">👀</div>
          <p className="text-sm text-gray-400">
            Waiting for new token discoveries...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            New tokens will appear here automatically
          </p>
        </div>
      )}

      {/* Token List */}
      {tokensToShow.length > 0 && (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tokensToShow.map((profile, index) => (
              <div 
                key={`${profile.tokenAddress}-${profile.timestamp}`}
                className={`p-3 rounded-lg border transition-all ${
                  index === 0 && profile === latestProfile 
                    ? 'bg-green-900/20 border-green-500/30 animate-pulse' 
                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Token Address & Chain */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono text-blue-400 truncate">
                        {truncateAddress(profile.tokenAddress)}
                      </code>
                      {showChainBadges && (
                        <Badge className={`${getChainColor(profile.chainId)} text-white text-xs`}>
                          {profile.chainId}
                        </Badge>
                      )}
                      {index === 0 && profile === latestProfile && (
                        <Badge className="bg-green-500 text-white text-xs animate-pulse">
                          NEW
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {profile.description && (
                      <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                        {profile.description}
                      </p>
                    )}

                    {/* Links */}
                    {profile.links && profile.links.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {profile.links.slice(0, 3).map((link, linkIndex) => (
                          <a
                            key={linkIndex}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            {link.label || link.type}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-3">
                    <div className="text-xs text-gray-400">
                      {formatTimeSince(profile.discoveredAt)}
                    </div>
                    {profile.url && (
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex gap-2">
              {profiles.length > maxDisplay && (
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isExpanded ? 'Show Less' : `Show All (${profiles.length})`}
                </Button>
              )}
              
              {profiles.length > 0 && (
                <Button
                  onClick={clearProfiles}
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-400 border-red-400/30 hover:bg-red-400/10"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {tokensToShow.length} of {profiles.length} shown
            </div>
          </div>
        </>
      )}
    </Card>
  );
};