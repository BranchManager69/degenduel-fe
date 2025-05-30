import { motion } from 'framer-motion';
import React, { useCallback, useState } from 'react';
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaLock,
    FaPlus,
    FaShieldAlt,
    FaTimesCircle,
    FaWallet
} from 'react-icons/fa';

interface EnforcementRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'warning' | 'blocking';
  icon: React.ReactNode;
}

interface WalletGenerationConfig {
  count: number;
  namePrefix: string;
  initialFunding: number;
  autoDistribute: boolean;
}

interface DegenProtocolEnforcementProps {
  onGenerateWallets: (config: WalletGenerationConfig) => void;
  onUpdateWalletTitle: (walletId: string, title: string) => void;
  isConnected: boolean;
}

export const DegenProtocolEnforcement: React.FC<DegenProtocolEnforcementProps> = ({
  onGenerateWallets,
  onUpdateWalletTitle: _onUpdateWalletTitle,
  isConnected
}) => {
  const [enforcementRules, setEnforcementRules] = useState<EnforcementRule[]>([
    {
      id: 'no-direct-transfers',
      name: 'Block Direct Wallet Transfers',
      description: 'Prevents direct transfers between managed wallets to avoid Bubblemaps clustering',
      enabled: true,
      severity: 'blocking',
      icon: <FaLock />
    },
    {
      id: 'max-wallet-uses',
      name: 'Enforce Wallet Burn Limit',
      description: 'Automatically marks wallets for burning after 5 operations',
      enabled: true,
      severity: 'warning',
      icon: <FaExclamationTriangle />
    },
    {
      id: 'randomize-amounts',
      name: 'Force Amount Randomization',
      description: 'Adds ±13% variance to all transaction amounts',
      enabled: true,
      severity: 'blocking',
      icon: <FaShieldAlt />
    },
    {
      id: 'time-delays',
      name: 'Enforce Minimum Time Delays',
      description: 'Requires minimum 30s delay between operations on same wallet',
      enabled: false,
      severity: 'warning',
      icon: <FaTimesCircle />
    },
    {
      id: 'prevent-dust-all',
      name: 'Prevent Dust All Wallets',
      description: 'Blocks operations that would dust all wallets simultaneously',
      enabled: true,
      severity: 'blocking',
      icon: <FaLock />
    }
  ]);

  const [walletGenConfig, setWalletGenConfig] = useState<WalletGenerationConfig>({
    count: 10,
    namePrefix: 'DEGEN',
    initialFunding: 0.05,
    autoDistribute: false
  });

  const [isGenerating, setIsGenerating] = useState(false);
  // Future use for wallet title editing
  // const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  // const [editingTitle, setEditingTitle] = useState('');

  const toggleRule = useCallback((ruleId: string) => {
    setEnforcementRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  }, []);

  const handleGenerateWallets = useCallback(() => {
    if (!isConnected) return;
    
    setIsGenerating(true);
    onGenerateWallets(walletGenConfig);
    
    // Simulate generation completion
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  }, [walletGenConfig, onGenerateWallets, isConnected]);

  // Note: handleSaveWalletTitle is available for future use
  // const handleSaveWalletTitle = useCallback(() => {
  //   if (editingWalletId && editingTitle) {
  //     onUpdateWalletTitle(editingWalletId, editingTitle);
  //     setEditingWalletId(null);
  //     setEditingTitle('');
  //   }
  // }, [editingWalletId, editingTitle, onUpdateWalletTitle]);

  return (
    <div className="space-y-6">
      {/* Enforcement Rules Section */}
      <div className="bg-dark-200/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-purple-400" />
          Protocol Enforcement Rules
        </h3>
        
        <div className="space-y-3">
          {enforcementRules.map((rule) => (
            <motion.div
              key={rule.id}
              whileHover={{ scale: 1.01 }}
              className={`
                border rounded-lg p-4 transition-all cursor-pointer
                ${rule.enabled 
                  ? 'bg-black/30 border-purple-500/30' 
                  : 'bg-black/10 border-gray-700'
                }
              `}
              onClick={() => toggleRule(rule.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${rule.enabled ? 'text-purple-400' : 'text-gray-500'}`}>
                    {rule.icon}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {rule.name}
                      {rule.severity === 'blocking' && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          BLOCKING
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-400">{rule.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {rule.enabled ? (
                    <FaCheckCircle className="text-green-400 text-xl" />
                  ) : (
                    <FaTimesCircle className="text-gray-500 text-xl" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200 flex items-start gap-2">
            <FaExclamationTriangle className="mt-0.5" />
            <span>
              Enforcement rules help prevent accidental exposure of wallet relationships. 
              Blocking rules will prevent operations entirely, while warnings allow override with confirmation.
            </span>
          </p>
        </div>
      </div>

      {/* Wallet Generation Section */}
      <div className="bg-dark-200/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaWallet className="text-green-400" />
          Wallet Generation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Number of Wallets</label>
            <input
              type="number"
              min="1"
              max="50"
              value={walletGenConfig.count}
              onChange={(e) => setWalletGenConfig(prev => ({ 
                ...prev, 
                count: Math.min(50, Math.max(1, parseInt(e.target.value) || 1))
              }))}
              className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Name Prefix</label>
            <input
              type="text"
              value={walletGenConfig.namePrefix}
              onChange={(e) => setWalletGenConfig(prev => ({ 
                ...prev, 
                namePrefix: e.target.value.slice(0, 20)
              }))}
              placeholder="e.g., DEGEN, TRADER, SNIPER"
              className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Initial Funding (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={walletGenConfig.initialFunding}
              onChange={(e) => setWalletGenConfig(prev => ({ 
                ...prev, 
                initialFunding: Math.min(1, Math.max(0.01, parseFloat(e.target.value) || 0.01))
              }))}
              className="w-full bg-black/30 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={walletGenConfig.autoDistribute}
                onChange={(e) => setWalletGenConfig(prev => ({ 
                  ...prev, 
                  autoDistribute: e.target.checked
                }))}
                className="w-4 h-4 text-purple-500"
              />
              <span className="text-sm text-gray-300">Auto-distribute from Treasury</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleGenerateWallets}
          disabled={!isConnected || isGenerating}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
            ${isConnected && !isGenerating
              ? 'bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30'
              : 'bg-gray-700/20 border border-gray-700/40 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
              Generating Wallets...
            </>
          ) : (
            <>
              <FaPlus />
              Generate {walletGenConfig.count} Wallets
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-gray-400">
          <p>Generated wallets will follow DEGEN Protocol naming convention:</p>
          <p className="font-mono text-purple-300 mt-1">
            {walletGenConfig.namePrefix}-001, {walletGenConfig.namePrefix}-002, etc.
          </p>
        </div>
      </div>

      {/* Active Enforcement Status */}
      <div className="bg-dark-200/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              enforcementRules.some(r => r.enabled) ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <span className="text-sm font-mono text-gray-300">
              Protocol Enforcement: {enforcementRules.filter(r => r.enabled).length} rules active
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaLock className="text-purple-400" />
            <span>Protecting against wallet clustering</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 