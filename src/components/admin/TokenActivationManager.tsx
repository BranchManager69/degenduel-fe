import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { ddApi } from '../../services/dd-api';

export const TokenActivationManager: React.FC = () => {
  const [tokenAddresses, setTokenAddresses] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mode, setMode] = useState<'activate' | 'deactivate'>('activate');

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

  return (
    <div className="bg-dark-200/50 backdrop-blur-lg p-4 rounded-lg border border-dark-300/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
            Token Activation Control
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Bulk activate or deactivate tokens
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${mode === 'activate' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-xs font-mono text-gray-400 uppercase">{mode}</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
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
      <div className="space-y-3">
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
            className="w-full h-20 px-3 py-2 bg-dark-300/50 border border-dark-300/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-brand-500/50 focus:outline-none transition-colors font-mono text-xs"
            disabled={isProcessing}
          />
        </div>

        {/* Result Message */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-2.5 rounded-lg border ${
                result.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {result.type === 'success' ? '✅' : '❌'}
                </span>
                <p className="text-xs">{result.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !tokenAddresses.trim()}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
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
      </div>

      {/* Info Box */}
      <div className="mt-3 p-2.5 bg-dark-300/30 rounded-lg border border-dark-300/50">
        <div className="flex items-start gap-1.5">
          <span className="text-blue-400 text-xs">ℹ️</span>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>• Bulk operations - multiple tokens at once</p>
            <p>• Token is added immediately, metadata populated within 5 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
};