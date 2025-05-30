import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminWallet } from '../../pages/admin/AdminWalletDashboard';

interface VolumeBotFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'core' | 'automation' | 'jupiter' | 'safety';
  isActive: boolean;
}

const VOLUME_BOT_FEATURES: VolumeBotFeature[] = [
  // Core Features
  { id: 'jumbler', name: 'Jumbler', icon: '🎵', description: 'Musical chairs chaos - randomize SOL distribution across wallets', category: 'core', isActive: true },
  { id: 'disperser', name: 'Disperser', icon: '💨', description: 'Split one wallet\'s balance across multiple wallets evenly', category: 'core', isActive: true },
  { id: 'concentrator', name: 'Concentrator', icon: '🌪️', description: 'Pull all balances into one main wallet', category: 'core', isActive: false },
  { id: 'balancer', name: 'Balancer', icon: '⚖️', description: 'Make all selected wallets have identical SOL amounts', category: 'core', isActive: false },
  { id: 'sniper', name: 'Sniper', icon: '🎯', description: 'Rapid-fire micro transactions between wallets', category: 'core', isActive: false },
  { id: 'pattern-gen', name: 'Pattern Generator', icon: '📊', description: 'Create specific balance patterns (pyramid, random, stepped)', category: 'core', isActive: false },
  { id: 'dust-collector', name: 'Dust Collector', icon: '🧹', description: 'Gather all tiny balances automatically', category: 'core', isActive: false },
  { id: 'gas-station', name: 'Gas Station', icon: '⛽', description: 'Distribute just enough SOL for fees across wallets', category: 'core', isActive: false },

  // Automation Features
  { id: 'scheduler', name: 'Scheduler', icon: '⏰', description: 'Time-delayed operations with cron-like scheduling', category: 'automation', isActive: false },
  { id: 'recycler', name: 'Recycler', icon: '🔄', description: 'Continuous low-level transaction loops', category: 'automation', isActive: false },
  { id: 'randomizer', name: 'Randomizer', icon: '🎲', description: 'Random operations on random intervals', category: 'automation', isActive: false },
  { id: 'vol-simulator', name: 'Volume Simulator', icon: '📈', description: 'Simulate realistic trading patterns', category: 'automation', isActive: false },
  { id: 'treasury-mgr', name: 'Treasury Manager', icon: '💰', description: 'Smart fund allocation from main treasury', category: 'automation', isActive: false },
  { id: 'preset-mgr', name: 'Preset Manager', icon: '📋', description: 'Save/load wallet selection sets and operation configs', category: 'automation', isActive: false },
  { id: 'analytics', name: 'Analytics', icon: '📊', description: 'Track wallet performance and operation history', category: 'automation', isActive: false },
  { id: 'health-monitor', name: 'Health Monitor', icon: '⚠️', description: 'Track wallet states and alert on issues', category: 'automation', isActive: false },

  // Jupiter Trading Features
  { id: 'jupiter-swap', name: 'Jupiter Swapper', icon: '🪐', description: 'Swap tokens across selected wallets via Jupiter', category: 'jupiter', isActive: true },
  { id: 'multi-swap', name: 'Multi-Swap', icon: '📊', description: 'Execute same swap across multiple wallets simultaneously', category: 'jupiter', isActive: false },
  { id: 'arbitrage', name: 'Arbitrage Hunter', icon: '🎯', description: 'Find and execute arbitrage opportunities', category: 'jupiter', isActive: false },
  { id: 'dca-bot', name: 'DCA Bot', icon: '💰', description: 'Dollar-cost-average into positions across wallets', category: 'jupiter', isActive: false },
  { id: 'bulk-buyer', name: 'Bulk Buyer', icon: '🛒', description: 'Buy same token across multiple wallets', category: 'jupiter', isActive: true },
  { id: 'bulk-seller', name: 'Bulk Seller', icon: '💸', description: 'Sell positions across multiple wallets', category: 'jupiter', isActive: false },
  { id: 'rebalancer', name: 'Portfolio Rebalancer', icon: '⚖️', description: 'Maintain target allocations via Jupiter', category: 'jupiter', isActive: false },
  { id: 'random-trader', name: 'Random Trader', icon: '🎲', description: 'Random buy/sell for volume generation', category: 'jupiter', isActive: false },

  // Safety Features
  { id: 'emergency-stop', name: 'Emergency Stop', icon: '🚨', description: 'Kill switch for all operations', category: 'safety', isActive: false },
  { id: 'operation-history', name: 'Operation History', icon: '📝', description: 'Detailed logs with replay capability', category: 'safety', isActive: false },
  { id: 'backup-recovery', name: 'Backup & Recovery', icon: '🔒', description: 'Wallet state snapshots', category: 'safety', isActive: false },
  { id: 'stop-loss', name: 'Stop Loss Manager', icon: '📉', description: 'Automated stop losses via Jupiter', category: 'safety', isActive: false },
  { id: 'liquidity-provider', name: 'Liquidity Provider', icon: '🌊', description: 'Add/remove liquidity across protocols', category: 'safety', isActive: false },
  { id: 'mev-protector', name: 'MEV Protector', icon: '⚡', description: 'Anti-MEV trading strategies', category: 'safety', isActive: false },
  { id: 'market-maker', name: 'Market Maker', icon: '🎪', description: 'Provide liquidity and capture spreads', category: 'safety', isActive: false },
  { id: 'price-tracker', name: 'Price Tracker', icon: '📈', description: 'Monitor token prices and set alerts', category: 'safety', isActive: false },
];

interface VolumeBotToolsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWallets: AdminWallet[];
  onJumble: (walletIds: string[], rounds: number, minSol: number) => void;
  onDisperse: (sourceWalletId: string, targetWalletIds: string[], amountPerWallet: number) => void;
  onJupiterSwap: (walletIds: string[], inputMint: string, outputMint: string, amount: number, slippageBps: number) => void;
  onBulkBuy: (walletIds: string[], targetMint: string, solPercentage: number, slippageBps: number, executionStrategy: string, staggerDelay: number) => void;
  isConnected: boolean;
  userRole: 'admin' | 'superadmin';
  jumbleProgress?: {
    phase: 'collecting_balances' | 'executing' | 'complete';
    round?: number;
    totalRounds?: number;
    transactionsExecuted?: number;
    status?: string;
  };
  disperseProgress?: {
    phase: 'validating' | 'executing' | 'complete';
    transactionsCompleted?: number;
    totalTransactions?: number;
    status?: string;
  };
  jupiterSwapProgress?: {
    phase: 'getting_quotes' | 'executing' | 'complete';
    swapsCompleted?: number;
    totalSwaps?: number;
    status?: string;
  };
  isJumbling: boolean;
  isDispersing: boolean;
  isJupiterSwapping: boolean;
  isBulkBuying: boolean;
  bulkBuyProgress?: {
    phase: 'calculating_amounts' | 'getting_quotes' | 'executing' | 'complete';
    buysCompleted?: number;
    totalBuys?: number;
    status?: string;
  };
}

const VolumeBotToolsCenter: React.FC<VolumeBotToolsCenterProps> = ({
  isOpen,
  onClose,
  selectedWallets,
  onJumble,
  onDisperse,
  onJupiterSwap,
  onBulkBuy,
  isConnected,
  userRole,
  jumbleProgress,
  disperseProgress,
  jupiterSwapProgress,
  bulkBuyProgress,
  isJumbling,
  isDispersing,
  isJupiterSwapping,
  isBulkBuying
}) => {
  const [jumbleRounds, setJumbleRounds] = useState(10);
  const [minSolPerWallet, setMinSolPerWallet] = useState(0.01);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'core' | 'automation' | 'jupiter' | 'safety'>('core');
  const [showJumblerConfig, setShowJumblerConfig] = useState(false);
  const [showDisperserConfig, setShowDisperserConfig] = useState(false);
  const [showJupiterSwapConfig, setShowJupiterSwapConfig] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [disperseSourceWallet, setDisperseSourceWallet] = useState<string>('');
  const [disperseAmountPerWallet, setDisperseAmountPerWallet] = useState(0.1);
  const [jupiterInputMint, setJupiterInputMint] = useState<string>('So11111111111111111111111111111111111111112'); // SOL
  const [jupiterOutputMint, setJupiterOutputMint] = useState<string>('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
  const [jupiterAmount, setJupiterAmount] = useState(0.1);
  const [jupiterSlippageBps, setJupiterSlippageBps] = useState(50); // 0.5%
  const [showBulkBuyConfig, setShowBulkBuyConfig] = useState(false);
  const [bulkBuyTargetMint, setBulkBuyTargetMint] = useState<string>('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC default
  const [bulkBuySolPercentage, setBulkBuySolPercentage] = useState(50); // 50% of SOL balance
  const [bulkBuySlippageBps, setBulkBuySlippageBps] = useState(100); // 1%
  const [bulkBuyExecutionStrategy, setBulkBuyExecutionStrategy] = useState<'staggered' | 'simultaneous' | 'hybrid'>('staggered');
  const [bulkBuyStaggerDelay, setBulkBuyStaggerDelay] = useState(200); // 200ms default

  useEffect(() => {
    if (isJumbling || isDispersing || isJupiterSwapping || isBulkBuying) {
      setIsMobileExpanded(false);
      setShowJumblerConfig(false);
      setShowDisperserConfig(false);
      setShowJupiterSwapConfig(false);
      setShowBulkBuyConfig(false);
    }
  }, [isJumbling, isDispersing, isJupiterSwapping, isBulkBuying]);

  const handleStartJumble = useCallback(() => {
    if (selectedWallets.length === 0) return;
    
    onJumble(
      selectedWallets.map(w => w.id),
      jumbleRounds,
      minSolPerWallet
    );
    setShowJumblerConfig(false);
  }, [selectedWallets, jumbleRounds, minSolPerWallet, onJumble]);

  const handleStartDisperse = useCallback(() => {
    if (!disperseSourceWallet || selectedWallets.length <= 1) return;
    
    const targetWallets = selectedWallets
      .filter(w => w.id !== disperseSourceWallet)
      .map(w => w.id);
    
    if (targetWallets.length === 0) return;
    
    onDisperse(
      disperseSourceWallet,
      targetWallets,
      disperseAmountPerWallet
    );
    setShowDisperserConfig(false);
  }, [disperseSourceWallet, selectedWallets, disperseAmountPerWallet, onDisperse]);

  const handleStartJupiterSwap = useCallback(() => {
    if (selectedWallets.length === 0) return;
    
    onJupiterSwap(
      selectedWallets.map(w => w.id),
      jupiterInputMint,
      jupiterOutputMint,
      jupiterAmount,
      jupiterSlippageBps
    );
    setShowJupiterSwapConfig(false);
  }, [selectedWallets, jupiterInputMint, jupiterOutputMint, jupiterAmount, jupiterSlippageBps, onJupiterSwap]);

  const handleStartBulkBuy = useCallback(() => {
    if (selectedWallets.length === 0) return;
    
    onBulkBuy(
      selectedWallets.map(w => w.id),
      bulkBuyTargetMint,
      bulkBuySolPercentage,
      bulkBuySlippageBps,
      bulkBuyExecutionStrategy,
      bulkBuyStaggerDelay
    );
    setShowBulkBuyConfig(false);
  }, [selectedWallets, bulkBuyTargetMint, bulkBuySolPercentage, bulkBuySlippageBps, bulkBuyExecutionStrategy, bulkBuyStaggerDelay, onBulkBuy]);

  const handleFeatureClick = useCallback((feature: VolumeBotFeature) => {
    if (feature.isActive) {
      // Close all other configs first
      setShowJumblerConfig(false);
      setShowDisperserConfig(false);
      setShowJupiterSwapConfig(false);
      setShowBulkBuyConfig(false);
      
      if (feature.id === 'jumbler') {
        setShowJumblerConfig(true);
      } else if (feature.id === 'disperser') {
        setShowDisperserConfig(true);
        // Auto-select first wallet as source if none selected
        if (!disperseSourceWallet && selectedWallets.length > 0) {
          setDisperseSourceWallet(selectedWallets[0].id);
        }
      } else if (feature.id === 'jupiter-swap') {
        setShowJupiterSwapConfig(true);
      } else if (feature.id === 'bulk-buyer') {
        setShowBulkBuyConfig(true);
      }
    }
  }, [disperseSourceWallet, selectedWallets]);

  const totalSOL = selectedWallets.reduce((sum, w) => sum + (w.balance_sol || 0), 0);
  const isSuperAdmin = userRole === 'superadmin';
  const featuresInCategory = VOLUME_BOT_FEATURES.filter(f => f.category === selectedCategory);
  const sourceWallet = selectedWallets.find(w => w.id === disperseSourceWallet);
  const targetWalletsCount = selectedWallets.filter(w => w.id !== disperseSourceWallet).length;
  const totalDisperseAmount = targetWalletsCount * disperseAmountPerWallet;
  
  // Bulk buy calculations
  const totalBulkBuySOL = selectedWallets.reduce((sum, w) => {
    const walletSOL = w.balance_sol || 0;
    return sum + (walletSOL * bulkBuySolPercentage / 100);
  }, 0);
  const avgSolPerWallet = selectedWallets.length > 0 ? totalBulkBuySOL / selectedWallets.length : 0;

  const categoryLabels = {
    core: '🎵 Core',
    automation: '🤖 Automation', 
    jupiter: '🪐 Jupiter',
    safety: '🛡️ Safety'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop: Right Side Panel */}
      <div className="hidden lg:block">
        <AnimatePresence>
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-dark-200/95 backdrop-blur-lg border-l border-brand-500/40 shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-600/40">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-cyber tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  🚀 VOLUME BOT TOOLS CENTER
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              
              {isSuperAdmin && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mb-3">
                  <div className="text-yellow-400 text-xs font-mono">⚡ SUPERADMIN AUTHORITY</div>
                  <div className="text-yellow-300 text-xs">Full cross-ownership control</div>
                </div>
              )}

              <div className="text-gray-400 text-sm font-mono">
                {selectedWallets.length} wallets • {totalSOL.toFixed(4)} SOL
              </div>
            </div>

            {/* Category Tabs */}
            <div className="px-6 py-3 border-b border-gray-600/40">
              <div className="flex gap-2 overflow-x-auto">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key as any)}
                    className={`
                      px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all
                      ${selectedCategory === key 
                        ? 'bg-brand-500/30 text-brand-300 border border-brand-500/50' 
                        : 'bg-dark-300/30 text-gray-400 hover:text-gray-300 border border-gray-600/30'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 gap-3">
                {featuresInCategory.map((feature) => (
                  <div key={feature.id} className="relative">
                    <motion.button
                      onClick={() => handleFeatureClick(feature)}
                      onMouseEnter={() => setHoveredFeature(feature.id)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className={`
                        w-full aspect-square rounded-lg border-2 p-2 text-center transition-all duration-200
                        ${feature.isActive 
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400' 
                          : 'bg-dark-300/20 border-gray-600/30 opacity-40 hover:opacity-60 hover:border-gray-500/50'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!feature.isActive}
                    >
                      <div className={`text-lg mb-1 ${feature.isActive ? '' : 'grayscale'}`}>
                        {feature.icon}
                      </div>
                      <div className={`text-xs font-mono leading-tight ${feature.isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                        {feature.name}
                      </div>
                      {!feature.isActive && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      )}
                    </motion.button>

                    {/* Desktop Tooltip */}
                    <AnimatePresence>
                      {hoveredFeature === feature.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                        >
                          <div className="bg-dark-100 border border-gray-500/50 rounded-lg p-2 max-w-48">
                            <div className="text-xs font-mono text-gray-300">
                              {feature.description}
                            </div>
                            {!feature.isActive && (
                              <div className="text-xs text-orange-400 mt-1">Coming Soon</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Configurations */}
            <AnimatePresence>
              {showJumblerConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-600/40 p-6 bg-dark-300/20"
                >
                  <h3 className="text-lg font-cyber text-purple-300 mb-4">🎵 Jumbler Configuration</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Rounds</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={jumbleRounds}
                          onChange={(e) => setJumbleRounds(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJumbling}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Min SOL</label>
                        <input
                          type="number"
                          min="0.001"
                          max="1"
                          step="0.001"
                          value={minSolPerWallet}
                          onChange={(e) => setMinSolPerWallet(Math.max(0.001, parseFloat(e.target.value) || 0.01))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJumbling}
                        />
                      </div>
                    </div>

                    {/* Progress Display */}
                    {jumbleProgress && (
                      <div className="bg-dark-300/50 rounded-lg p-4 border border-purple-500/30">
                        <h4 className="font-mono text-sm text-purple-300 mb-2">Progress</h4>
                        
                        {jumbleProgress.round && jumbleProgress.totalRounds && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                              <span>Round {jumbleProgress.round}/{jumbleProgress.totalRounds}</span>
                              <span>{Math.round((jumbleProgress.round / jumbleProgress.totalRounds) * 100)}%</span>
                            </div>
                            <div className="w-full bg-dark-400 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(jumbleProgress.round / jumbleProgress.totalRounds) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="text-xs font-mono text-gray-300">
                          {jumbleProgress.status || 'Running...'}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStartJumble}
                        disabled={!isConnected || selectedWallets.length === 0 || isJumbling}
                        className={`
                          flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300
                          ${isJumbling 
                            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                          }
                        `}
                      >
                        {isJumbling ? 'JUMBLING...' : '🎵 START'}
                      </button>
                      
                      <button
                        onClick={() => setShowJumblerConfig(false)}
                        className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {showDisperserConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-600/40 p-6 bg-dark-300/20"
                >
                  <h3 className="text-lg font-cyber text-blue-300 mb-4">💨 Disperser Configuration</h3>
                  
                  <div className="space-y-4">
                    {/* Source Wallet Selection */}
                    <div>
                      <label className="block text-gray-400 text-sm font-mono mb-2">Source Wallet</label>
                      <select
                        value={disperseSourceWallet}
                        onChange={(e) => setDisperseSourceWallet(e.target.value)}
                        className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                        disabled={isDispersing}
                      >
                        <option value="">Select source wallet...</option>
                        {selectedWallets.map(wallet => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name || wallet.wallet_address?.slice(0, 8) + '...'} ({(wallet.balance_sol || 0).toFixed(4)} SOL)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">SOL per Wallet</label>
                        <input
                          type="number"
                          min="0.001"
                          max={sourceWallet?.balance_sol || 1}
                          step="0.001"
                          value={disperseAmountPerWallet}
                          onChange={(e) => setDisperseAmountPerWallet(Math.max(0.001, parseFloat(e.target.value) || 0.1))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isDispersing}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Target Wallets</label>
                        <div className="bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono">
                          {targetWalletsCount} wallets
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-dark-300/50 rounded-lg p-3 border border-blue-500/30">
                      <div className="text-blue-300 text-xs font-mono mb-1">Operation Summary</div>
                      <div className="text-xs font-mono text-gray-300 space-y-1">
                        <div>Source: {sourceWallet?.balance_sol?.toFixed(4) || '0.0000'} SOL available</div>
                        <div>Distribution: {disperseAmountPerWallet.toFixed(4)} SOL × {targetWalletsCount} = {totalDisperseAmount.toFixed(4)} SOL</div>
                        <div className={totalDisperseAmount > (sourceWallet?.balance_sol || 0) ? 'text-red-400' : 'text-green-400'}>
                          Remaining: {((sourceWallet?.balance_sol || 0) - totalDisperseAmount).toFixed(4)} SOL
                        </div>
                      </div>
                    </div>

                    {/* Progress Display */}
                    {disperseProgress && (
                      <div className="bg-dark-300/50 rounded-lg p-4 border border-blue-500/30">
                        <h4 className="font-mono text-sm text-blue-300 mb-2">Progress</h4>
                        
                        {disperseProgress.transactionsCompleted !== undefined && disperseProgress.totalTransactions && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                              <span>Transaction {disperseProgress.transactionsCompleted}/{disperseProgress.totalTransactions}</span>
                              <span>{Math.round((disperseProgress.transactionsCompleted / disperseProgress.totalTransactions) * 100)}%</span>
                            </div>
                            <div className="w-full bg-dark-400 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(disperseProgress.transactionsCompleted / disperseProgress.totalTransactions) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="text-xs font-mono text-gray-300">
                          {disperseProgress.status || 'Running...'}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStartDisperse}
                        disabled={!isConnected || !disperseSourceWallet || targetWalletsCount === 0 || totalDisperseAmount > (sourceWallet?.balance_sol || 0) || isDispersing}
                        className={`
                          flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300
                          ${isDispersing || !disperseSourceWallet || targetWalletsCount === 0 || totalDisperseAmount > (sourceWallet?.balance_sol || 0)
                            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                          }
                        `}
                      >
                        {isDispersing ? 'DISPERSING...' : '💨 START'}
                      </button>
                      
                      <button
                        onClick={() => setShowDisperserConfig(false)}
                        className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {showJupiterSwapConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-600/40 p-6 bg-dark-300/20"
                >
                  <h3 className="text-lg font-cyber text-purple-300 mb-4">🪐 Jupiter Swapper Configuration</h3>
                  
                  <div className="space-y-4">
                    {/* Token Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Input Token</label>
                        <select
                          value={jupiterInputMint}
                          onChange={(e) => setJupiterInputMint(e.target.value)}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJupiterSwapping}
                        >
                          <option value="So11111111111111111111111111111111111111112">SOL</option>
                          <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                          <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                          <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                          <option value="7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs">ETH</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Output Token</label>
                        <select
                          value={jupiterOutputMint}
                          onChange={(e) => setJupiterOutputMint(e.target.value)}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJupiterSwapping}
                        >
                          <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                          <option value="So11111111111111111111111111111111111111112">SOL</option>
                          <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                          <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                          <option value="7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs">ETH</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Amount</label>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={jupiterAmount}
                          onChange={(e) => setJupiterAmount(Math.max(0.001, parseFloat(e.target.value) || 0.1))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJupiterSwapping}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Slippage %</label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={jupiterSlippageBps}
                          onChange={(e) => setJupiterSlippageBps(Math.max(10, parseInt(e.target.value) || 50))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isJupiterSwapping}
                        />
                        <div className="text-xs text-gray-500 mt-1">{(jupiterSlippageBps / 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/30">
                      <div className="text-purple-300 text-xs font-mono mb-1">Swap Summary</div>
                      <div className="text-xs font-mono text-gray-300 space-y-1">
                        <div>Wallets: {selectedWallets.length} wallets will execute this swap</div>
                        <div>Amount: {jupiterAmount} tokens per wallet</div>
                        <div>Total Volume: {(jupiterAmount * selectedWallets.length).toFixed(4)} tokens</div>
                        <div>Max Slippage: {(jupiterSlippageBps / 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Progress Display */}
                    {jupiterSwapProgress && (
                      <div className="bg-dark-300/50 rounded-lg p-4 border border-purple-500/30">
                        <h4 className="font-mono text-sm text-purple-300 mb-2">Progress</h4>
                        
                        {jupiterSwapProgress.swapsCompleted !== undefined && jupiterSwapProgress.totalSwaps && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                              <span>Swap {jupiterSwapProgress.swapsCompleted}/{jupiterSwapProgress.totalSwaps}</span>
                              <span>{Math.round((jupiterSwapProgress.swapsCompleted / jupiterSwapProgress.totalSwaps) * 100)}%</span>
                            </div>
                            <div className="w-full bg-dark-400 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(jupiterSwapProgress.swapsCompleted / jupiterSwapProgress.totalSwaps) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="text-xs font-mono text-gray-300">
                          {jupiterSwapProgress.status || 'Running...'}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStartJupiterSwap}
                        disabled={!isConnected || selectedWallets.length === 0 || jupiterInputMint === jupiterOutputMint || isJupiterSwapping}
                        className={`
                          flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300
                          ${isJupiterSwapping || !isConnected || selectedWallets.length === 0 || jupiterInputMint === jupiterOutputMint
                            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                          }
                        `}
                      >
                        {isJupiterSwapping ? 'SWAPPING...' : '🪐 START SWAP'}
                      </button>
                      
                      <button
                        onClick={() => setShowJupiterSwapConfig(false)}
                        className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {showBulkBuyConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-600/40 p-6 bg-dark-300/20"
                >
                  <h3 className="text-lg font-cyber text-green-300 mb-4">🛒 Bulk Buyer Configuration</h3>
                  
                  <div className="space-y-4">
                    {/* Target Token Selection */}
                    <div>
                      <label className="block text-gray-400 text-sm font-mono mb-2">Target Token</label>
                      <select
                        value={bulkBuyTargetMint}
                        onChange={(e) => setBulkBuyTargetMint(e.target.value)}
                        className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                        disabled={isBulkBuying}
                      >
                        <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                        <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                        <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                        <option value="7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs">ETH</option>
                        <option value="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263">BONK</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">SOL % per Wallet</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={bulkBuySolPercentage}
                          onChange={(e) => setBulkBuySolPercentage(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isBulkBuying}
                        />
                        <div className="text-xs text-gray-500 mt-1">{bulkBuySolPercentage}% of each wallet's SOL</div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">Slippage %</label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="10"
                          value={bulkBuySlippageBps}
                          onChange={(e) => setBulkBuySlippageBps(Math.max(10, parseInt(e.target.value) || 100))}
                          className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                          disabled={isBulkBuying}
                        />
                        <div className="text-xs text-gray-500 mt-1">{(bulkBuySlippageBps / 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Execution Strategy */}
                    <div>
                      <label className="block text-gray-400 text-sm font-mono mb-2">Execution Strategy</label>
                      <select
                        value={bulkBuyExecutionStrategy}
                        onChange={(e) => setBulkBuyExecutionStrategy(e.target.value as 'staggered' | 'simultaneous' | 'hybrid')}
                        className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono"
                        disabled={isBulkBuying}
                      >
                        <option value="staggered">⏱️ Staggered (Stealth Volume)</option>
                        <option value="simultaneous">🎯 Simultaneous (Max Impact)</option>
                        <option value="hybrid">🌊 Hybrid (Momentum Building)</option>
                      </select>
                    </div>

                    {/* Stagger Delay Control */}
                    {bulkBuyExecutionStrategy === 'staggered' && (
                      <div>
                        <label className="block text-gray-400 text-sm font-mono mb-2">
                          Stagger Delay: {bulkBuyStaggerDelay}ms
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="2000"
                          step="50"
                          value={bulkBuyStaggerDelay}
                          onChange={(e) => setBulkBuyStaggerDelay(parseInt(e.target.value))}
                          className="w-full"
                          disabled={isBulkBuying}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>50ms (Fast)</span>
                          <span>2000ms (Slow)</span>
                        </div>
                      </div>
                    )}

                    {/* Volume Summary */}
                    <div className="bg-dark-300/50 rounded-lg p-3 border border-green-500/30">
                      <div className="text-green-300 text-xs font-mono mb-1">Volume Summary</div>
                      <div className="text-xs font-mono text-gray-300 space-y-1">
                        <div>Wallets: {selectedWallets.length} wallets buying simultaneously</div>
                        <div>Total SOL: {totalBulkBuySOL.toFixed(4)} SOL ({bulkBuySolPercentage}% of {totalSOL.toFixed(4)} SOL)</div>
                        <div>Avg per Wallet: {avgSolPerWallet.toFixed(4)} SOL each</div>
                        <div>Max Slippage: {(bulkBuySlippageBps / 100).toFixed(2)}%</div>
                      </div>
                    </div>

                    {/* Progress Display */}
                    {bulkBuyProgress && (
                      <div className="bg-dark-300/50 rounded-lg p-4 border border-green-500/30">
                        <h4 className="font-mono text-sm text-green-300 mb-2">Progress</h4>
                        
                        {bulkBuyProgress.buysCompleted !== undefined && bulkBuyProgress.totalBuys && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                              <span>Buy {bulkBuyProgress.buysCompleted}/{bulkBuyProgress.totalBuys}</span>
                              <span>{Math.round((bulkBuyProgress.buysCompleted / bulkBuyProgress.totalBuys) * 100)}%</span>
                            </div>
                            <div className="w-full bg-dark-400 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(bulkBuyProgress.buysCompleted / bulkBuyProgress.totalBuys) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="text-xs font-mono text-gray-300">
                          {bulkBuyProgress.status || 'Running...'}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStartBulkBuy}
                        disabled={!isConnected || selectedWallets.length === 0 || totalBulkBuySOL === 0 || isBulkBuying}
                        className={`
                          flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300
                          ${isBulkBuying || !isConnected || selectedWallets.length === 0 || totalBulkBuySOL === 0
                            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                          }
                        `}
                      >
                        {isBulkBuying ? 'BUYING...' : '🛒 START BULK BUY'}
                      </button>
                      
                      <button
                        onClick={() => setShowBulkBuyConfig(false)}
                        className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile: Bottom Sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isMobileExpanded ? "5%" : "60%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 bg-dark-200/95 backdrop-blur-lg border-t border-brand-500/40 shadow-2xl z-40 rounded-t-xl"
            style={{ height: "95%" }}
          >
            {/* Mobile Header */}
            <div 
              className="p-4 border-b border-gray-600/40 cursor-pointer"
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-cyber tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    🚀 VOLUME BOT
                  </h2>
                  <div className="text-xs text-gray-400 font-mono">
                    {selectedWallets.length} wallets • {featuresInCategory.filter(f => f.isActive).length}/{featuresInCategory.length} active
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Progress indicator when jumbling */}
                  {jumbleProgress && (
                    <div className="text-xs font-mono text-purple-300">
                      {jumbleProgress.round && jumbleProgress.totalRounds ? 
                        `${jumbleProgress.round}/${jumbleProgress.totalRounds}` : 
                        'Running...'
                      }
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Content */}
            <AnimatePresence>
              {isMobileExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Category Tabs */}
                  <div className="px-4 py-3 border-b border-gray-600/40">
                    <div className="flex gap-2 overflow-x-auto">
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedCategory(key as any)}
                          className={`
                            px-3 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap transition-all
                            ${selectedCategory === key 
                              ? 'bg-brand-500/30 text-brand-300 border border-brand-500/50' 
                              : 'bg-dark-300/30 text-gray-400 hover:text-gray-300 border border-gray-600/30'
                            }
                          `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Tools Grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {featuresInCategory.map((feature) => (
                        <motion.button
                          key={feature.id}
                          onClick={() => {
                            handleFeatureClick(feature);
                            if (!feature.isActive) {
                              // Show mobile tooltip
                              alert(`${feature.name}\n\nComing Soon: ${feature.description}`);
                            }
                          }}
                          className={`
                            aspect-square rounded-lg border-2 p-3 text-center transition-all duration-200
                            ${feature.isActive 
                              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50' 
                              : 'bg-dark-300/20 border-gray-600/30 opacity-40'
                            }
                          `}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`text-xl mb-1 ${feature.isActive ? '' : 'grayscale'}`}>
                            {feature.icon}
                          </div>
                          <div className={`text-xs font-mono leading-tight ${feature.isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                            {feature.name}
                          </div>
                          {!feature.isActive && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Jumbler Config */}
                  <AnimatePresence>
                    {showJumblerConfig && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-600/40 p-4 bg-dark-300/20"
                      >
                        <h3 className="text-lg font-cyber text-purple-300 mb-3">🎵 Jumbler</h3>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Rounds</label>
                              <input
                                type="number"
                                min="1"
                                max="50"
                                value={jumbleRounds}
                                onChange={(e) => setJumbleRounds(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJumbling}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Min SOL</label>
                              <input
                                type="number"
                                min="0.001"
                                max="1"
                                step="0.001"
                                value={minSolPerWallet}
                                onChange={(e) => setMinSolPerWallet(Math.max(0.001, parseFloat(e.target.value) || 0.01))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJumbling}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleStartJumble}
                              disabled={!isConnected || selectedWallets.length === 0 || isJumbling}
                              className={`
                                flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300 text-sm
                                ${isJumbling 
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                }
                              `}
                            >
                              {isJumbling ? 'JUMBLING...' : '🎵 START'}
                            </button>
                            
                            <button
                              onClick={() => setShowJumblerConfig(false)}
                              className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {showDisperserConfig && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-600/40 p-4 bg-dark-300/20"
                      >
                        <h3 className="text-lg font-cyber text-blue-300 mb-3">💨 Disperser</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-400 text-sm font-mono mb-1">Source Wallet</label>
                            <select
                              value={disperseSourceWallet}
                              onChange={(e) => setDisperseSourceWallet(e.target.value)}
                              className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                              disabled={isDispersing}
                            >
                              <option value="">Select source...</option>
                              {selectedWallets.map(wallet => (
                                <option key={wallet.id} value={wallet.id}>
                                  {wallet.name || wallet.wallet_address?.slice(0, 6) + '...'} ({(wallet.balance_sol || 0).toFixed(3)} SOL)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">SOL per Wallet</label>
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={disperseAmountPerWallet}
                                onChange={(e) => setDisperseAmountPerWallet(Math.max(0.001, parseFloat(e.target.value) || 0.1))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isDispersing}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Targets</label>
                              <div className="bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm">
                                {targetWalletsCount}
                              </div>
                            </div>
                          </div>

                          <div className="bg-dark-300/50 rounded p-2 border border-blue-500/30">
                            <div className="text-xs font-mono text-gray-300">
                              Total: {totalDisperseAmount.toFixed(3)} SOL
                              <span className={totalDisperseAmount > (sourceWallet?.balance_sol || 0) ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                                ({((sourceWallet?.balance_sol || 0) - totalDisperseAmount).toFixed(3)} remaining)
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleStartDisperse}
                              disabled={!isConnected || !disperseSourceWallet || targetWalletsCount === 0 || totalDisperseAmount > (sourceWallet?.balance_sol || 0) || isDispersing}
                              className={`
                                flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300 text-sm
                                ${isDispersing || !disperseSourceWallet || targetWalletsCount === 0 || totalDisperseAmount > (sourceWallet?.balance_sol || 0)
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                                }
                              `}
                            >
                              {isDispersing ? 'DISPERSING...' : '💨 START'}
                            </button>
                            
                            <button
                              onClick={() => setShowDisperserConfig(false)}
                              className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {showJupiterSwapConfig && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-600/40 p-4 bg-dark-300/20"
                      >
                        <h3 className="text-lg font-cyber text-purple-300 mb-3">🪐 Jupiter Swapper</h3>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Input Token</label>
                              <select
                                value={jupiterInputMint}
                                onChange={(e) => setJupiterInputMint(e.target.value)}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJupiterSwapping}
                              >
                                <option value="So11111111111111111111111111111111111111112">SOL</option>
                                <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                                <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                                <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Output Token</label>
                              <select
                                value={jupiterOutputMint}
                                onChange={(e) => setJupiterOutputMint(e.target.value)}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJupiterSwapping}
                              >
                                <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                                <option value="So11111111111111111111111111111111111111112">SOL</option>
                                <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                                <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Amount</label>
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={jupiterAmount}
                                onChange={(e) => setJupiterAmount(Math.max(0.001, parseFloat(e.target.value) || 0.1))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJupiterSwapping}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Slippage</label>
                              <input
                                type="number"
                                min="10"
                                max="1000"
                                step="10"
                                value={jupiterSlippageBps}
                                onChange={(e) => setJupiterSlippageBps(Math.max(10, parseInt(e.target.value) || 50))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isJupiterSwapping}
                              />
                            </div>
                          </div>

                          <div className="bg-dark-300/50 rounded p-2 border border-purple-500/30">
                            <div className="text-xs font-mono text-gray-300">
                              {selectedWallets.length} wallets • {jupiterAmount} tokens each
                              <div className="text-purple-400">
                                {(jupiterSlippageBps / 100).toFixed(2)}% max slippage
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleStartJupiterSwap}
                              disabled={!isConnected || selectedWallets.length === 0 || jupiterInputMint === jupiterOutputMint || isJupiterSwapping}
                              className={`
                                flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300 text-sm
                                ${isJupiterSwapping || !isConnected || selectedWallets.length === 0 || jupiterInputMint === jupiterOutputMint
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                }
                              `}
                            >
                              {isJupiterSwapping ? 'SWAPPING...' : '🪐 SWAP'}
                            </button>
                            
                            <button
                              onClick={() => setShowJupiterSwapConfig(false)}
                              className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {showBulkBuyConfig && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-600/40 p-4 bg-dark-300/20"
                      >
                        <h3 className="text-lg font-cyber text-green-300 mb-3">🛒 Bulk Buyer</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-400 text-sm font-mono mb-1">Target Token</label>
                            <select
                              value={bulkBuyTargetMint}
                              onChange={(e) => setBulkBuyTargetMint(e.target.value)}
                              className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                              disabled={isBulkBuying}
                            >
                              <option value="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v">USDC</option>
                              <option value="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB">USDT</option>
                              <option value="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So">mSOL</option>
                              <option value="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263">BONK</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">SOL %</label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                step="5"
                                value={bulkBuySolPercentage}
                                onChange={(e) => setBulkBuySolPercentage(Math.max(1, Math.min(100, parseInt(e.target.value) || 50)))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isBulkBuying}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-gray-400 text-sm font-mono mb-1">Slippage</label>
                              <input
                                type="number"
                                min="10"
                                max="1000"
                                step="10"
                                value={bulkBuySlippageBps}
                                onChange={(e) => setBulkBuySlippageBps(Math.max(10, parseInt(e.target.value) || 100))}
                                className="w-full bg-dark-300/50 border border-gray-600/40 rounded px-3 py-2 text-gray-300 font-mono text-sm"
                                disabled={isBulkBuying}
                              />
                            </div>
                          </div>

                          <div className="bg-dark-300/50 rounded p-2 border border-green-500/30">
                            <div className="text-xs font-mono text-gray-300">
                              {selectedWallets.length} wallets • {totalBulkBuySOL.toFixed(3)} SOL total
                              <div className="text-green-400">
                                {bulkBuySolPercentage}% • {(bulkBuySlippageBps / 100).toFixed(1)}% slippage
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleStartBulkBuy}
                              disabled={!isConnected || selectedWallets.length === 0 || totalBulkBuySOL === 0 || isBulkBuying}
                              className={`
                                flex-1 py-2 rounded-lg font-cyber tracking-wider transition-all duration-300 text-sm
                                ${isBulkBuying || !isConnected || selectedWallets.length === 0 || totalBulkBuySOL === 0
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                                }
                              `}
                            >
                              {isBulkBuying ? 'BUYING...' : '🛒 BUY'}
                            </button>
                            
                            <button
                              onClick={() => setShowBulkBuyConfig(false)}
                              className="px-4 py-2 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default VolumeBotToolsCenter;