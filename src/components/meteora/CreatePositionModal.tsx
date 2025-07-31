import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { useSolanaKitWallet } from '../../hooks/wallet/useSolanaKitWallet';

interface TransactionData {
  serialized: string;
  message: string;
  estimatedFees: {
    network: number;
    positionCreation: number;
    total: number;
  };
}

interface CreatePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePositionModal: React.FC<CreatePositionModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useStore();
  const { signAndSendBlinkTransaction, isConnected, publicKey } = useSolanaKitWallet();
  
  const [poolAddress, setPoolAddress] = useState('');
  const [amountX, setAmountX] = useState('');
  const [amountY, setAmountY] = useState('');
  const [strategy, setStrategy] = useState<'SpotBalanced' | 'CurveBalanced' | 'BidAskBalanced'>('SpotBalanced');
  const [slippage, setSlippage] = useState(1);
  const [positionPublicKey, setPositionPublicKey] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'creating' | 'signing' | 'success' | 'error'>('idle');

  const exampleAddress = '4pcVHM897jCfcckYQVwbWgaJJ7dCHRBPKu4NW4ppRJkE';

  const strategyDescriptions = {
    SpotBalanced: 'Concentrates liquidity around current price (±50 bins) for maximum efficiency',
    CurveBalanced: 'Wider distribution across price range (±100 bins) for reduced impermanent loss',
    BidAskBalanced: 'Separate bid/ask distributions (±25 bins) for directional strategies'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.wallet_address) {
      toast.error('Please login to create liquidity positions');
      return;
    }

    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first');
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
    setTransactionSignature(null);
    setTransactionStatus('creating');

    try {
      // Step 1: Create transaction
      const requestBody = {
        poolAddress: poolAddress.trim(),
        strategy,
        slippage,
        ...(amountX && { amountX: parseFloat(amountX) }),
        ...(amountY && { amountY: parseFloat(amountY) }),
        ...(positionPublicKey && { positionPublicKey: positionPublicKey.trim() })
      };

      const response = await fetch('/api/meteora/liquidity/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from API');
      }

      const transactionData: TransactionData = data.transaction;
      
      toast.success('Transaction created, please sign with your wallet');
      setTransactionStatus('signing');

      // Step 2: Sign and send transaction
      console.log('Signing transaction with wallet...');
      const signature = await signAndSendBlinkTransaction(transactionData.serialized);
      
      setTransactionSignature(signature);
      setTransactionStatus('success');
      
      toast.success(`Position created successfully! Signature: ${signature.slice(0, 8)}...`, {
        duration: 8000
      });

    } catch (err: any) {
      console.error('Create position error:', err);
      setError(err.message || 'Failed to create liquidity position');
      setTransactionStatus('error');
      toast.error(err.message || 'Failed to create liquidity position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing during transaction
    
    setPoolAddress('');
    setAmountX('');
    setAmountY('');
    setStrategy('SpotBalanced');
    setSlippage(1);
    setPositionPublicKey('');
    setError(null);
    setTransactionSignature(null);
    setTransactionStatus('idle');
    onClose();
  };

  const handleTryAgain = () => {
    setError(null);
    setTransactionSignature(null);
    setTransactionStatus('idle');
  };

  // Close on ESC key press (only if not loading)
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) handleClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLoading]);

  // Close modal when clicking outside (only if not loading)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) handleClose();
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
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Outer glow effect */}
            <div className={`absolute -inset-1 blur-md rounded-xl ${
              transactionStatus === 'success' 
                ? 'bg-gradient-to-br from-green-400/40 via-transparent to-green-400/40'
                : transactionStatus === 'error'
                ? 'bg-gradient-to-br from-red-400/40 via-transparent to-red-400/40'
                : 'bg-gradient-to-br from-purple-400/30 via-transparent to-violet-400/30'
            }`}></div>
            
            {/* Modal content */}
            <div className={`relative bg-dark-800 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl shadow-dark-900/50 p-6 ${
              transactionStatus === 'success' 
                ? 'border border-green-400/30'
                : transactionStatus === 'error'
                ? 'border border-red-400/30'
                : 'border border-purple-400/30'
            }`}>
              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={isLoading}
                className={`absolute top-4 right-4 w-8 h-8 bg-dark-300/70 flex items-center justify-center transition-all z-10 rounded ${
                  isLoading 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <span className="transform translate-y-[-1px]">&times;</span>
              </button>
              
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    transactionStatus === 'success' 
                      ? 'bg-green-500/20'
                      : transactionStatus === 'error'
                      ? 'bg-red-500/20'
                      : 'bg-purple-500/20'
                  }`}>
                    {transactionStatus === 'success' ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : transactionStatus === 'error' ? (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                  {transactionStatus === 'success' ? 'Position Created!' : 'Create LP Position'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {transactionStatus === 'success' 
                    ? 'Your liquidity position has been created successfully'
                    : 'Build and submit transactions to create new liquidity positions'
                  }
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
                      Please login to create liquidity positions
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
              ) : transactionStatus === 'success' && transactionSignature ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">Position Created Successfully!</h4>
                    <p className="text-gray-400 mb-4">
                      Your liquidity position has been added to the Meteora DLMM pool
                    </p>
                  </div>

                  <div className="bg-dark-200/40 rounded-lg p-4 mb-6">
                    <div className="text-sm text-gray-400 mb-1">Transaction Signature</div>
                    <div className="font-mono text-sm text-white break-all">{transactionSignature}</div>
                    <div className="mt-2">
                      <a
                        href={`https://solscan.io/tx/${transactionSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm underline"
                      >
                        View on Solscan →
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setTransactionStatus('idle');
                        setTransactionSignature(null);
                        setError(null);
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Create Another Position
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 bg-dark-300/80 rounded border border-dark-300 hover:border-purple-400/30 transition-all duration-300 text-white/70 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
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
                            className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                            disabled={isLoading}
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Example:</span>
                            <button
                              type="button"
                              onClick={() => setPoolAddress(exampleAddress)}
                              className="text-xs text-purple-400 hover:text-purple-300 underline"
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
                              className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
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
                              className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Position Public Key (Optional)
                          </label>
                          <input
                            type="text"
                            value={positionPublicKey}
                            onChange={(e) => setPositionPublicKey(e.target.value)}
                            placeholder="Leave empty to create new position..."
                            className="w-full px-4 py-3 bg-dark-200/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Provide an existing position address to add liquidity to it
                          </p>
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
                                  className="mt-1 text-purple-400 focus:ring-purple-400"
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

                        {/* Wallet Status */}
                        <div className="bg-dark-200/30 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Wallet Status</h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Connected:</span>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-white text-sm">{isConnected ? 'Yes' : 'No'}</span>
                              </div>
                            </div>
                            {publicKey && (
                              <div className="text-xs text-gray-400 break-all">
                                {publicKey.toBase58()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !poolAddress.trim() || (!amountX && !amountY) || !isConnected}
                      className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                        isLoading || !poolAddress.trim() || (!amountX && !amountY) || !isConnected
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30'
                      }`}
                    >
                      {transactionStatus === 'creating' ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Creating Transaction...
                        </span>
                      ) : transactionStatus === 'signing' ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Please Sign in Wallet...
                        </span>
                      ) : !isConnected ? (
                        'Connect Wallet First'
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create Position
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </form>

                  {/* Error Display */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Transaction Error</span>
                      </div>
                      <p className="text-red-300 text-sm mb-3">{error}</p>
                      <button
                        onClick={handleTryAgain}
                        className="text-sm text-red-400 hover:text-red-300 underline"
                      >
                        Try Again
                      </button>
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

export default CreatePositionModal;