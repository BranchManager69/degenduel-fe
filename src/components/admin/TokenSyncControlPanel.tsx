import React, { useState } from 'react';
import axios from 'axios';

interface TokenSyncControlPanelProps {
  onSyncChange?: () => void;
}

const TokenSyncControlPanel: React.FC<TokenSyncControlPanelProps> = ({ onSyncChange }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startSync = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post('/admin/token-sync/start');

      setSuccess(response.data.message || 'Token sync started successfully');

      // Notify parent component that sync state changed
      if (onSyncChange) onSyncChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start token sync');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelSync = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post('/admin/token-sync/cancel');

      setSuccess(response.data.message || 'Token sync cancelled successfully');

      // Notify parent component that sync state changed
      if (onSyncChange) onSyncChange();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel token sync');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-sync-controls">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Token Sync Controls</h3>

      {/* Error/Success messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 text-green-400">
          {success}
        </div>
      )}

      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={startSync}
          disabled={loading}
          className="py-3 px-4 bg-brand-500/20 hover:bg-brand-500/30 border-2 border-brand-500/40 
                     hover:border-brand-500/50 transition-all duration-300 rounded-lg text-brand-300 
                     font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-brand-300 rounded-full border-t-transparent"></div>
              <span>Processing...</span>
            </div>
          ) : 'Start Token Sync'}
        </button>

        <button 
          onClick={cancelSync}
          disabled={loading}
          className="py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/40 
                     hover:border-red-500/50 transition-all duration-300 rounded-lg text-red-300 
                     font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel Current Sync
        </button>
      </div>

      {/* Info notes */}
      <div className="bg-dark-300/50 border border-dark-100/10 rounded-lg p-4">
        <h4 className="text-md font-semibold mb-2 text-gray-300">Important Notes:</h4>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-brand-400">•</span>
            <span>Each sync processes up to 20,000 tokens at a time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400">•</span>
            <span>For complete synchronization of all tokens, you may need to run multiple syncs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400">•</span>
            <span>Syncs run in the background and won't affect server performance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400">•</span>
            <span>Expect approximately 10-20 tokens per second depending on server load</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TokenSyncControlPanel;