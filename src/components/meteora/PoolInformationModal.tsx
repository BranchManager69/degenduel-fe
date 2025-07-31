import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface PoolData {
  address: string;
  tokenX: {
    mint: string;
    symbol: string;
  };
  tokenY: {
    mint: string;
    symbol: string;
  };
  activeBin: number;
  currentPrice: string;
  binStep: number;
  baseFeeRate: number;
  maxFeeRate: number;
  protocolFeeRate: number;
  status: string;
  totalLiquidity: {
    tokenX: string;
    tokenY: string;
  };
}

interface PoolInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PoolInformationModal: React.FC<PoolInformationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [poolAddress, setPoolAddress] = useState('');
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleAddress = '4pcVHM897jCfcckYQVwbWgaJJ7dCHRBPKu4NW4ppRJkE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poolAddress.trim()) {
      toast.error('Please enter a pool address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPoolData(null);

    try {
      const response = await fetch(`/api/meteora/pools/${poolAddress.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pool information');
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from API');
      }

      setPoolData(data.pool);
      toast.success('Pool information loaded successfully');
    } catch (err: any) {
      console.error('Pool information error:', err);
      setError(err.message || 'Failed to fetch pool information');
      toast.error(err.message || 'Failed to fetch pool information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPoolAddress('');
    setPoolData(null);
    setError(null);
    onClose();
  };

  const formatFeeRate = (rate: number) => {
    // Meteora uses basis points where 10000 = 100%
    return (rate / 10000).toFixed(2) + '%';
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num === 0) return '0';
    if (num < 0.000001) return num.toExponential(4);
    if (num < 1) return num.toFixed(8);
    return num.toFixed(6);
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
            className="relative w-full max-w-2xl z-10"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/30 via-transparent to-blue-400/30 blur-md rounded-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-dark-800 backdrop-blur-sm rounded-xl border border-blue-400/30 shadow-xl shadow-dark-900/50 p-6 max-h-[90vh] overflow-y-auto">
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
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Pool Information
                </h3>
                <p className="text-gray-400 text-sm">
                  Get detailed information about any Meteora DLMM pool
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Pool Address
                    </label>
                    <input
                      type="text"
                      value={poolAddress}
                      onChange={(e) => setPoolAddress(e.target.value)}
                      placeholder="Enter pool address..."
                      className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                      disabled={isLoading}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Example:</span>
                      <button
                        type="button"
                        onClick={() => setPoolAddress(exampleAddress)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                        disabled={isLoading}
                      >
                        {exampleAddress}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !poolAddress.trim()}
                  className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isLoading || !poolAddress.trim()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Fetching Pool Data...
                    </span>
                  ) : (
                    'Get Pool Information'
                  )}
                </button>
              </form>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Pool Data Display */}
              {poolData && (
                <div className="space-y-4">
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Pool Details</h4>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-200/40 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Token Pair</h5>
                      <div className="text-white">
                        <div className="mb-1">
                          <span className="text-sm text-gray-400">Token X:</span> {poolData.tokenX.symbol || 'Unknown'}
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Token Y:</span> {poolData.tokenY.symbol || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-200/40 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Pool Status</h5>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          poolData.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                        }`}></div>
                        <span className="text-white capitalize">{poolData.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-200/40 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Current Price</h5>
                      <div className="text-lg font-semibold text-white">
                        {formatPrice(poolData.currentPrice)}
                      </div>
                    </div>

                    <div className="bg-dark-200/40 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Active Bin</h5>
                      <div className="text-lg font-semibold text-white">
                        {poolData.activeBin}
                      </div>
                    </div>
                  </div>

                  {/* Fee Structure */}
                  <div className="bg-dark-200/40 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Fee Structure</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Bin Step</div>
                        <div className="text-white font-medium">{poolData.binStep}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Base Fee</div>
                        <div className="text-white font-medium">{formatFeeRate(poolData.baseFeeRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Max Fee</div>
                        <div className="text-white font-medium">{formatFeeRate(poolData.maxFeeRate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Protocol Fee</div>
                        <div className="text-white font-medium">{formatFeeRate(poolData.protocolFeeRate)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="bg-dark-200/40 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Addresses</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Pool:</span>
                        <div className="text-white font-mono text-xs mt-1 break-all">{poolData.address}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Token X Mint:</span>
                        <div className="text-white font-mono text-xs mt-1 break-all">{poolData.tokenX.mint}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Token Y Mint:</span>
                        <div className="text-white font-mono text-xs mt-1 break-all">{poolData.tokenY.mint}</div>
                      </div>
                    </div>
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

export default PoolInformationModal;