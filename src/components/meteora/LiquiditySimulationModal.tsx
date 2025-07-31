import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';

interface SimulationData {
  pool: string;
  user: string;
  strategy: string;
  activeBin: number;
  currentPrice: string;
  priceRange: {
    minBinId: number;
    maxBinId: number;
    minPrice: string;
    maxPrice: string;
  };
  amounts: {
    tokenX: number;
    tokenY: number;
  };
  estimatedFees: {
    positionCreation: number;
    binArrayCreation: number;
    total: number;
  };
  slippage: number;
}

interface LiquiditySimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiquiditySimulationModal: React.FC<LiquiditySimulationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useStore();
  const [poolAddress, setPoolAddress] = useState('');
  const [amountX, setAmountX] = useState('');
  const [amountY, setAmountY] = useState('');
  const [strategy, setStrategy] = useState<'SpotBalanced' | 'CurveBalanced' | 'BidAskBalanced'>('SpotBalanced');
  const [slippage, setSlippage] = useState(1);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleAddress = '4pcVHM897jCfcckYQVwbWgaJJ7dCHRBPKu4NW4ppRJkE';

  const strategyDescriptions = {
    SpotBalanced: 'Concentrates liquidity around current price (±50 bins) for maximum efficiency',
    CurveBalanced: 'Wider distribution across price range (±100 bins) for reduced impermanent loss',
    BidAskBalanced: 'Separate bid/ask distributions (±25 bins) for directional strategies'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.wallet_address) {
      toast.error('Please login to simulate liquidity positions');
      return;
    }

    if (!poolAddress.trim()) {
      toast.error('Please enter a pool address');
      return;
    }

    if (!amountX && !amountY) {
      toast.error('Please enter at least one token amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSimulationData(null);

    try {
      const requestBody = {
        poolAddress: poolAddress.trim(),
        strategy,
        slippage,
        ...(amountX && { amountX: parseFloat(amountX) }),
        ...(amountY && { amountY: parseFloat(amountY) })
      };

      const response = await fetch('/api/meteora/liquidity/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate liquidity position');
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from API');
      }

      setSimulationData(data.simulation);
      toast.success('Simulation completed successfully');
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'Failed to simulate liquidity position');
      toast.error(err.message || 'Failed to simulate liquidity position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPoolAddress('');
    setAmountX('');
    setAmountY('');
    setStrategy('SpotBalanced');
    setSlippage(1);
    setSimulationData(null);
    setError(null);
    onClose();
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
            className="relative w-full max-w-3xl z-10"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-green-400/30 via-transparent to-emerald-400/30 blur-md rounded-xl"></div>
            
            {/* Modal content */}
            <div className="relative bg-dark-800 backdrop-blur-sm rounded-xl border border-green-400/30 shadow-xl shadow-dark-900/50 p-6 max-h-[90vh] overflow-y-auto">
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
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Simulate LP Position
                </h3>
                <p className="text-gray-400 text-sm">
                  Test different liquidity strategies and amounts before committing funds
                </p>
              </div>

              {!user?.wallet_address ? (
                /* Not Logged In State */
                <div className="text-center py-8">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-white mb-2">Login Required</h4>
                    <p className="text-gray-400">
                      Please login to access liquidity simulation tools
                    </p>
                  </div>
                  <a
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white 
                      bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                      rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25"
                  >
                    Connect Wallet
                  </a>
                </div>
              ) : (
                <>
                  {/* Input Form */}
                  <form onSubmit={handleSubmit} className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
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
                            className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
                            disabled={isLoading}
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Example:</span>
                            <button
                              type="button"
                              onClick={() => setPoolAddress(exampleAddress)}
                              className="text-xs text-green-400 hover:text-green-300 underline"
                              disabled={isLoading}
                            >
                              Use test pool
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Amount X
                            </label>
                            <input
                              type="number"
                              value={amountX}
                              onChange={(e) => setAmountX(e.target.value)}
                              placeholder="0.0"
                              min="0"
                              step="any"
                              className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Amount Y
                            </label>
                            <input
                              type="number"
                              value={amountY}
                              onChange={(e) => setAmountY(e.target.value)}
                              placeholder="0.0"
                              min="0"
                              step="any"
                              className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Slippage Tolerance: {slippage}%
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value))}
                            className="w-full h-2 bg-dark-200/50 rounded-lg appearance-none cursor-pointer slider"
                            disabled={isLoading}
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0.1%</span>
                            <span>5%</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Liquidity Strategy
                          </label>
                          <div className="space-y-2">
                            {(['SpotBalanced', 'CurveBalanced', 'BidAskBalanced'] as const).map((strat) => (
                              <label key={strat} className="flex items-start gap-3 p-3 bg-dark-200/30 rounded-lg cursor-pointer hover:bg-dark-200/50 transition-colors">
                                <input
                                  type="radio"
                                  name="strategy"
                                  value={strat}
                                  checked={strategy === strat}
                                  onChange={(e) => setStrategy(e.target.value as any)}
                                  className="mt-1 text-green-400 focus:ring-green-400"
                                  disabled={isLoading}
                                />
                                <div className="flex-1">
                                  <div className="text-white font-medium">{strat}</div>
                                  <div className="text-xs text-gray-400">{strategyDescriptions[strat]}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !poolAddress.trim() || (!amountX && !amountY)}
                      className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        isLoading || !poolAddress.trim() || (!amountX && !amountY)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/30'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Running Simulation...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Run Simulation
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
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
                        <span className="font-medium">Simulation Error</span>
                      </div>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  )}

                  {/* Simulation Results */}
                  {simulationData && (
                    <div className="space-y-4">
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Simulation Results</h4>
                      </div>

                      {/* Strategy and Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-dark-200/40 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Strategy</h5>
                          <div className="text-white font-semibold">{simulationData.strategy}</div>
                        </div>
                        <div className="bg-dark-200/40 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Active Bin</h5>
                          <div className="text-white font-semibold">{simulationData.activeBin}</div>
                        </div>
                        <div className="bg-dark-200/40 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Current Price</h5>
                          <div className="text-white font-semibold">{formatPrice(simulationData.currentPrice)}</div>
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="bg-dark-200/40 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-300 mb-3">Price Range</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-400">Min Bin ID</div>
                            <div className="text-white font-medium">{simulationData.priceRange.minBinId}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Max Bin ID</div>
                            <div className="text-white font-medium">{simulationData.priceRange.maxBinId}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Min Price</div>
                            <div className="text-white font-medium">{formatPrice(simulationData.priceRange.minPrice)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Max Price</div>
                            <div className="text-white font-medium">{formatPrice(simulationData.priceRange.maxPrice)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Amounts and Fees */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-dark-200/40 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-3">Token Amounts</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Token X:</span>
                              <span className="text-white font-medium">{simulationData.amounts.tokenX}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Token Y:</span>
                              <span className="text-white font-medium">{simulationData.amounts.tokenY}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-dark-200/40 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-3">Estimated Fees</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Position:</span>
                              <span className="text-white font-medium">{simulationData.estimatedFees.positionCreation} SOL</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Bin Array:</span>
                              <span className="text-white font-medium">{simulationData.estimatedFees.binArrayCreation} SOL</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-600 pt-2">
                              <span className="text-white font-medium">Total:</span>
                              <span className="text-green-400 font-bold">{simulationData.estimatedFees.total} SOL</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LiquiditySimulationModal;