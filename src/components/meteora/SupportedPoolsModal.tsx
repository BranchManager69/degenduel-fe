import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface PoolInfo {
  address: string;
  name: string;
  tokenX: string;
  tokenY: string;
  tvl: string;
  volume24h: string;
  apy: string;
}

interface SupportedPoolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPool?: (poolAddress: string) => void;
}

const SupportedPoolsModal: React.FC<SupportedPoolsModalProps> = ({
  isOpen,
  onClose,
  onSelectPool
}) => {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/meteora/supported-pools');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supported pools');
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from API');
      }

      setPools(data.pools || []);
      if (data.pools?.length === 0) {
        toast('No supported pools found', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      console.error('Supported pools error:', err);
      setError(err.message || 'Failed to fetch supported pools');
      toast.error(err.message || 'Failed to fetch supported pools');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pools when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPools();
    }
  }, [isOpen]);

  const handleClose = () => {
    setPools([]);
    setError(null);
    onClose();
  };

  const handleSelectPool = (poolAddress: string) => {
    if (onSelectPool) {
      onSelectPool(poolAddress);
    }
    toast.success(`Pool ${poolAddress.slice(0, 8)}... selected`);
    handleClose();
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatAPY = (apy: string) => {
    const num = parseFloat(apy);
    if (isNaN(num)) return apy;
    return `${num.toFixed(1)}%`;
  };

  // Close on ESC key press
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.4,
              ease: [0.19, 1.0, 0.22, 1.0],
            }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400/30 via-transparent to-teal-400/30 blur-md rounded-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-dark-800 backdrop-blur-sm rounded-xl overflow-hidden border border-cyan-400/30 shadow-xl shadow-dark-900/50 p-6">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 bg-dark-300/70 flex items-center justify-center text-white/70 hover:text-white transition-all z-10 rounded"
              >
                <span className="transform translate-y-[-1px]">&times;</span>
              </button>
              
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  Supported Pools
                </h3>
                <p className="text-gray-400 text-sm">
                  Explore curated list of supported DLMM pools with TVL, volume, and APY metrics
                </p>
              </div>

              {/* Refresh Button */}
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {pools.length > 0 && `${pools.length} pool${pools.length !== 1 ? 's' : ''} available`}
                </div>
                <button
                  onClick={fetchPools}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-400/30'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </span>
                  )}
                </button>
              </div>

              {/* Loading State */}
              {isLoading && pools.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading supported pools...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error Loading Pools</span>
                  </div>
                  <p className="text-red-300 text-sm mb-3">{error}</p>
                  <button
                    onClick={fetchPools}
                    className="text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Pools Grid */}
              {pools.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pools.map((pool, index) => (
                    <motion.div
                      key={pool.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-dark-200/40 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer group"
                      onClick={() => handleSelectPool(pool.address)}
                    >
                      {/* Pool Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {pool.name}
                        </h4>
                        <div className="text-xs text-gray-400 group-hover:text-gray-300">
                          Select →
                        </div>
                      </div>

                      {/* Token Pair */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-cyan-400">{pool.tokenX.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-white">{pool.tokenX}</span>
                        </div>
                        <span className="text-gray-500">/</span>
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-teal-400/20 to-teal-600/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-teal-400">{pool.tokenY.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-white">{pool.tokenY}</span>
                        </div>
                      </div>

                      {/* Pool Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">TVL</div>
                          <div className="text-sm font-semibold text-white">{formatNumber(pool.tvl)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                          <div className="text-sm font-semibold text-white">{formatNumber(pool.volume24h)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">APY</div>
                          <div className="text-sm font-semibold text-green-400">{formatAPY(pool.apy)}</div>
                        </div>
                      </div>

                      {/* Pool Address */}
                      <div className="mt-3 pt-3 border-t border-gray-700/30">
                        <div className="text-xs text-gray-500 mb-1">Pool Address</div>
                        <div className="font-mono text-xs text-gray-400 break-all group-hover:text-gray-300">
                          {pool.address}
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-teal-400/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && pools.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">No Pools Available</h4>
                  <p className="text-gray-400 mb-4">
                    No supported pools found at this time
                  </p>
                  <button
                    onClick={fetchPools}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Footer */}
              {pools.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700/30">
                  <div className="text-xs text-gray-500 text-center">
                    {onSelectPool ? 'Click on any pool to select it for your LP operations' : 'Pool information displayed for reference'}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupportedPoolsModal;