import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { ddApi } from '../../services/dd-api';

// Token interface based on the API response
interface Token {
  id: number;
  address: string;
  symbol: string;
  name: string;
  image_url?: string;
  header_image_url?: string;
  color?: string;
  decimals: number;
  description?: string;
  priority_score?: number;
  degenduel_score?: string;
  is_active?: boolean;
  manually_activated?: boolean;
  metadata_status?: string;
  price?: number;
  change_24h?: number;
  market_cap?: number;
  volume_24h?: number;
  priceChanges?: {
    h1?: number;
    h6?: number;
    m5?: number;
    h24?: number;
  };
  socials?: {
    twitter?: string;
    telegram?: string;
  };
  websites?: Array<{
    label?: string;
    url: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

export const TokenActivationManager: React.FC = () => {
  // Original bulk operations state
  const [tokenAddresses, setTokenAddresses] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mode, setMode] = useState<'activate' | 'deactivate'>('activate');

  // New token management state
  const [activeTab, setActiveTab] = useState<'bulk' | 'managed' | 'search' | 'candidates'>('managed');
  const [managedTokens, setManagedTokens] = useState<Token[]>([]);
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [candidateTokens, setCandidateTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingManaged, setIsLoadingManaged] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'first_seen'>('first_seen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [candidateSortBy, setCandidateSortBy] = useState<'market_cap' | 'volume_24h' | 'first_seen' | 'pair_created_at'>('pair_created_at');
  const [candidateSortOrder, setCandidateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [managedTokensTotal, setManagedTokensTotal] = useState(0);
  const [candidatesTotal, setCandidatesTotal] = useState(0);
  const [candidatesPage, setCandidatesPage] = useState(0);
  const [candidatesPerPage] = useState(20);

  // Fetch active/managed tokens
  const fetchManagedTokens = useCallback(async () => {
    setIsLoadingManaged(true);
    try {
      const response = await ddApi.fetch(`/admin/token-activation/active-tokens?limit=50&sort=${sortBy}&order=${sortOrder}`);
      if (response.ok) {
        const data = await response.json();
        setManagedTokens(data.data.tokens || []);
        setManagedTokensTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch managed tokens:', error);
    } finally {
      setIsLoadingManaged(false);
    }
  }, [sortBy, sortOrder]);

  // Fetch candidate tokens
  const fetchCandidateTokens = useCallback(async () => {
    setIsLoadingCandidates(true);
    try {
      const offset = candidatesPage * candidatesPerPage;
      const response = await ddApi.fetch(`/admin/token-activation/candidates?limit=${candidatesPerPage}&offset=${offset}&sort=${candidateSortBy}&order=${candidateSortOrder}`);
      if (response.ok) {
        const data = await response.json();
        setCandidateTokens(data.data.tokens || []);
        setCandidatesTotal(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch candidate tokens:', error);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [candidateSortBy, candidateSortOrder, candidatesPage, candidatesPerPage]);

  // Search tokens
  const searchTokens = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await ddApi.fetch(`/tokens/search?search=${encodeURIComponent(query)}&limit=20&include_inactive=true`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tokens || []);
      }
    } catch (error) {
      console.error('Failed to search tokens:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Toggle token selection
  const toggleTokenSelection = (address: string) => {
    setSelectedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      return newSet;
    });
  };

  // Bulk activate/deactivate selected tokens
  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedTokens.size === 0) return;
    
    setIsProcessing(true);
    try {
      const endpoint = action === 'activate' 
        ? '/admin/token-activation/activate'
        : '/admin/token-activation/deactivate';

      const response = await ddApi.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: Array.from(selectedTokens) }),
      });

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Successfully ${action}d ${selectedTokens.size} token${selectedTokens.size > 1 ? 's' : ''}`,
        });
        setSelectedTokens(new Set());
        // Refresh data
        if (activeTab === 'managed') {
          fetchManagedTokens();
        } else if (activeTab === 'candidates') {
          fetchCandidateTokens();
        }
      } else {
        throw new Error(`Failed to ${action} tokens`);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : `Failed to ${action} tokens`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    // Always load managed tokens count on mount
    fetchManagedTokens();
    
    // Also load candidates count for the tab badge
    const loadCandidatesCount = async () => {
      try {
        const response = await ddApi.fetch(`/admin/token-activation/candidates?limit=1`);
        if (response.ok) {
          const data = await response.json();
          setCandidatesTotal(data.data.pagination.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch candidates count:', error);
      }
    };
    
    loadCandidatesCount();
  }, []);

  // Load data when tabs change
  useEffect(() => {
    if (activeTab === 'managed') {
      fetchManagedTokens();
    } else if (activeTab === 'candidates') {
      fetchCandidateTokens();
    }
  }, [activeTab, fetchManagedTokens, fetchCandidateTokens]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search') {
        searchTokens(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, searchTokens]);

  const handleSubmit = async () => {
    if (!tokenAddresses.trim()) {
      setResult({ type: 'error', message: 'Please enter at least one token address' });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Parse addresses - support comma, space, or newline separated
      const addresses = tokenAddresses
        .split(/[\s,\n]+/)
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (addresses.length === 0) {
        throw new Error('No valid addresses found');
      }

      const endpoint = mode === 'activate' 
        ? '/admin/token-activation/activate'
        : '/admin/token-activation/deactivate';

      const response = await ddApi.fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Failed to ${mode} tokens`);
      }
      
      setResult({
        type: 'success',
        message: `Successfully ${mode}d ${addresses.length} token${addresses.length > 1 ? 's' : ''}`,
      });
      
      // Clear input on success
      setTokenAddresses('');
    } catch (error) {
      console.error(`Failed to ${mode} tokens:`, error);
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : `Failed to ${mode} tokens`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to format numbers
  const formatNumber = (num: number | undefined): string => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  // Helper function to format percentage
  const formatPercentage = (num: number | undefined): string => {
    if (!num) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  // State for copy feedback
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Render token card component
  const TokenCard: React.FC<{ token: Token; isSelectable?: boolean }> = ({ token, isSelectable = false }) => {
    const isSelected = selectedTokens.has(token.address);
    const isActive = token.is_active ?? false;
    const isCopied = copiedAddress === token.address;
    
    const handleCopyAddress = async () => {
      try {
        await navigator.clipboard.writeText(token.address);
        setCopiedAddress(token.address);
        setTimeout(() => setCopiedAddress(null), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    };
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-dark-300/50 border rounded-lg p-3 transition-all duration-300 overflow-hidden ${
          isSelected ? 'border-brand-500/60 bg-brand-500/10' : 'border-dark-300/50 hover:border-dark-300/70'
        }`}
      >
        {/* Header image background - more visible */}
        {token.header_image_url && (
          <div className="absolute inset-0 opacity-25">
            <img 
              src={token.header_image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/70 via-dark-300/40 to-dark-300/70" />
          </div>
        )}
        
        {/* Content overlay */}
        <div className="relative z-10 flex items-start gap-3">
          {/* Selection checkbox */}
          {isSelectable && (
            <button
              onClick={() => toggleTokenSelection(token.address)}
              className={`mt-1 w-4 h-4 rounded border-2 transition-colors ${
                isSelected 
                  ? 'bg-brand-500 border-brand-500' 
                  : 'border-gray-500 hover:border-brand-500'
              }`}
            >
              {isSelected && <span className="text-white text-xs">✓</span>}
            </button>
          )}

          {/* Token image */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-400/50 flex-shrink-0">
            {token.image_url ? (
              <img 
                src={token.image_url} 
                alt={token.symbol} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiM0Qjc2ODgiLz4KPGI+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNHB4Ij4/PC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                {token.symbol?.charAt(0) || '?'}
              </div>
            )}
          </div>

          {/* Token info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-bold text-white truncate">{token.symbol}</h3>
                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {isActive ? '✓' : '✗'}
                  </div>
                  {token.manually_activated && (
                    <div className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                      M
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{token.name}</p>
              </div>
              {token.price && (
                <div className="text-right ml-2">
                  <div className="text-xs font-mono text-white">${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(6)}</div>
                  {token.change_24h !== undefined && (
                    <div className={`text-xs font-mono ${
                      token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercentage(token.change_24h)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact stats row */}
            <div className="flex items-center gap-3 text-xs mb-1">
              <div>
                <span className="text-gray-500">MC: </span>
                <span className="text-gray-300">${formatNumber(token.market_cap)}</span>
              </div>
              <div>
                <span className="text-gray-500">Vol: </span>
                <span className="text-gray-300">${formatNumber(token.volume_24h)}</span>
              </div>
            </div>

            {/* Address and Social Links */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleCopyAddress}
                className={`text-xs font-mono truncate flex-1 mr-2 text-left transition-all duration-300 cursor-pointer relative ${
                  isCopied 
                    ? 'text-green-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={isCopied ? "Copied!" : "Click to copy address"}
              >
                {isCopied && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -left-5 top-0 text-green-400"
                  >
                    ✓
                  </motion.span>
                )}
                {token.address}
              </button>
              
              {/* Social Media Icons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {token.socials?.twitter && (
                  <a
                    href={token.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Twitter/X"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {token.socials?.telegram && (
                  <a
                    href={token.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-blue-500 hover:text-blue-400 transition-colors"
                    title="Telegram"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                )}
                {token.websites && token.websites.length > 0 && (
                  <a
                    href={token.websites[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-4 h-4 text-gray-400 hover:text-gray-300 transition-colors"
                    title={token.websites[0].label || "Website"}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render tab navigation
  const renderTabs = () => (
    <div className="flex gap-2 mb-6">
      {[
        { id: 'managed', label: 'Managed Tokens', icon: '🎯', count: managedTokensTotal },
        { id: 'candidates', label: 'Candidates', icon: '💎', count: candidatesTotal },
        { id: 'search', label: 'Search Tokens', icon: '🔍' },
        { id: 'bulk', label: 'Bulk Operations', icon: '⚡' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-brand-500/20 border border-brand-500/50 text-brand-300'
              : 'bg-dark-300/30 border border-dark-300/30 text-gray-400 hover:border-brand-500/30'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-brand-500/30' : 'bg-dark-400/50'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Render managed tokens tab
  const renderManagedTokens = () => (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Active Tokens</h3>
          <p className="text-sm text-gray-400">{managedTokensTotal} tokens currently managed</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-1 bg-dark-300/50 border border-dark-300/50 rounded text-sm text-white"
          >
            <option value="first_seen-desc">Newest First</option>
            <option value="first_seen-asc">Oldest First</option>
            <option value="symbol-asc">Symbol A-Z</option>
            <option value="symbol-desc">Symbol Z-A</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
          <button
            onClick={fetchManagedTokens}
            disabled={isLoadingManaged}
            className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            {isLoadingManaged ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Selection and bulk actions */}
      {selectedTokens.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-400/30 border border-brand-500/30 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-300">
              {selectedTokens.size} token{selectedTokens.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={isProcessing}
                className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                🚫 Deactivate
              </button>
              <button
                onClick={() => setSelectedTokens(new Set())}
                className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded text-sm hover:bg-gray-500/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tokens list */}
      {isLoadingManaged ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-dark-300/30 border border-dark-300/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-400/50 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-dark-400/50 rounded w-20 mb-2" />
                  <div className="h-3 bg-dark-400/30 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : managedTokens.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {managedTokens.map(token => (
            <TokenCard key={token.address} token={token} isSelectable />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">🔍</div>
          <p>No managed tokens found</p>
        </div>
      )}
    </div>
  );

  // Render candidate tokens tab
  const renderCandidateTokens = () => (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Activation Candidates</h3>
          <p className="text-sm text-gray-400">{candidatesTotal} inactive tokens with ≥$100K market cap</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={`${candidateSortBy}-${candidateSortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setCandidateSortBy(field as any);
              setCandidateSortOrder(order as any);
              setCandidatesPage(0); // Reset to first page when sorting changes
            }}
            className="px-3 py-1 bg-dark-300/50 border border-dark-300/50 rounded text-sm text-white"
          >
            <option value="pair_created_at-desc">Newest Pairs First</option>
            <option value="pair_created_at-asc">Oldest Pairs First</option>
            <option value="market_cap-desc">Highest Market Cap</option>
            <option value="market_cap-asc">Lowest Market Cap</option>
            <option value="volume_24h-desc">Highest Volume</option>
            <option value="volume_24h-asc">Lowest Volume</option>
            <option value="first_seen-desc">Newest Tokens First</option>
            <option value="first_seen-asc">Oldest Tokens First</option>
          </select>
          <button
            onClick={fetchCandidateTokens}
            disabled={isLoadingCandidates}
            className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded text-sm hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            {isLoadingCandidates ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Selection and bulk actions */}
      {selectedTokens.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-400/30 border border-brand-500/30 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-300">
              {selectedTokens.size} candidate{selectedTokens.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={isProcessing}
                className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                ✅ Activate
              </button>
              <button
                onClick={() => setSelectedTokens(new Set())}
                className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded text-sm hover:bg-gray-500/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Candidates list */}
      {isLoadingCandidates ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-dark-300/30 border border-dark-300/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dark-400/50 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-dark-400/50 rounded w-20 mb-2" />
                  <div className="h-3 bg-dark-400/30 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : candidateTokens.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 mb-3">
            💡 These tokens meet activation criteria but aren't active yet. Great opportunities to spot trending tokens!
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {candidateTokens.map(token => (
              <TokenCard key={token.address} token={token} isSelectable />
            ))}
          </div>
          
          {/* Pagination Controls */}
          {candidatesTotal > candidatesPerPage && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-300/50">
              <div className="text-sm text-gray-400">
                Showing {candidatesPage * candidatesPerPage + 1}-{Math.min((candidatesPage + 1) * candidatesPerPage, candidatesTotal)} of {candidatesTotal.toLocaleString()} candidates
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCandidatesPage(0)}
                  disabled={candidatesPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCandidatesPage(candidatesPage - 1)}
                  disabled={candidatesPage === 0}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="px-3 py-1 text-sm bg-dark-400/50 text-white rounded">
                  Page {candidatesPage + 1} of {Math.ceil(candidatesTotal / candidatesPerPage)}
                </div>
                <button
                  onClick={() => setCandidatesPage(candidatesPage + 1)}
                  disabled={(candidatesPage + 1) * candidatesPerPage >= candidatesTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCandidatesPage(Math.ceil(candidatesTotal / candidatesPerPage) - 1)}
                  disabled={(candidatesPage + 1) * candidatesPerPage >= candidatesTotal}
                  className="px-3 py-1 text-sm bg-dark-300/50 text-gray-300 rounded hover:bg-dark-300/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">💎</div>
          <p>No activation candidates found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting the market cap filter</p>
        </div>
      )}
    </div>
  );

  // Render search tokens tab
  const renderSearchTokens = () => (
    <div className="space-y-4">
      {/* Search input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search Tokens
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol, name, or address..."
            className="w-full px-4 py-2 pl-10 bg-dark-300/50 border border-dark-300/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-brand-500/50 focus:outline-none transition-colors"
          />
          <div className="absolute left-3 top-2.5 text-gray-500">
            {isSearching ? <span className="animate-spin">⏳</span> : '🔍'}
          </div>
        </div>
      </div>

      {/* Selection and bulk actions */}
      {selectedTokens.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-400/30 border border-brand-500/30 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-300">
              {selectedTokens.size} token{selectedTokens.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={isProcessing}
                className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                ✅ Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={isProcessing}
                className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                🚫 Deactivate
              </button>
              <button
                onClick={() => setSelectedTokens(new Set())}
                className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded text-sm hover:bg-gray-500/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search results */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      )}

      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-3xl mb-4">❌</div>
          <p>No tokens found for "{searchQuery}"</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Found {searchResults.length} token{searchResults.length > 1 ? 's' : ''}
          </p>
          {searchResults.map(token => (
            <TokenCard key={token.address} token={token} isSelectable />
          ))}
        </div>
      )}
    </div>
  );

  // Render bulk operations tab (original functionality)
  const renderBulkOperations = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Bulk Token Operations</h3>
        <p className="text-sm text-gray-400">Manually activate or deactivate tokens by address</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('activate')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            mode === 'activate'
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'bg-dark-300/30 border border-dark-300/30 text-gray-400 hover:border-green-500/30'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span>✅</span>
            <span>Activate</span>
          </span>
        </button>
        <button
          onClick={() => setMode('deactivate')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
            mode === 'deactivate'
              ? 'bg-red-500/20 border border-red-500/50 text-red-300'
              : 'bg-dark-300/30 border border-dark-300/30 text-gray-400 hover:border-red-500/30'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span>🚫</span>
            <span>Deactivate</span>
          </span>
        </button>
      </div>

      {/* Token Input */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5">
          Token Addresses
          <span className="text-xs text-gray-500 ml-1">
            (comma, space, or newline separated)
          </span>
        </label>
        <textarea
          value={tokenAddresses}
          onChange={(e) => setTokenAddresses(e.target.value)}
          placeholder={`Enter token addresses...\nExample: So11111111111111111111111111111111111111112`}
          className="w-full h-32 px-3 py-2 bg-dark-300/50 border border-dark-300/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-brand-500/50 focus:outline-none transition-colors font-mono text-xs"
          disabled={isProcessing}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || !tokenAddresses.trim()}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'activate'
            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50'
            : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-1.5">
            <span className="animate-spin">⚡</span>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <span>{mode === 'activate' ? '🚀' : '⛔'}</span>
            {mode === 'activate' ? 'ACTIVATE' : 'DEACTIVATE'} TOKENS
          </span>
        )}
      </button>

      {/* Info Box */}
      <div className="p-3 bg-dark-300/30 rounded-lg border border-dark-300/50">
        <div className="flex items-start gap-2">
          <span className="text-blue-400 text-sm">ℹ️</span>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Bulk operations - multiple tokens at once</p>
            <p>• Token is added immediately, metadata populated within 5 minutes</p>
            <p>• Use the Managed/Search tabs for visual token management</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
            Token Activation Manager
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage active tokens, search for new ones, or perform bulk operations
          </p>
        </div>
        {selectedTokens.size > 0 && (
          <div className="text-sm text-brand-300">
            {selectedTokens.size} selected
          </div>
        )}
      </div>

      {/* Global result message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg border ${
              result.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {result.type === 'success' ? '✅' : '❌'}
              </span>
              <p className="text-sm">{result.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      {renderTabs()}

      {/* Tab Content */}
      <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
        {activeTab === 'managed' && renderManagedTokens()}
        {activeTab === 'candidates' && renderCandidateTokens()}
        {activeTab === 'search' && renderSearchTokens()}
        {activeTab === 'bulk' && renderBulkOperations()}
      </div>
    </div>
  );
};