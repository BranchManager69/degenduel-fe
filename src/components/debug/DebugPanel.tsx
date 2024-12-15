import React from 'react';
import { useStore } from '../../store/useStore';
import { isAdminWallet } from '../../lib/auth';

export const DebugPanel: React.FC = () => {
  const { user, debugConfig, setDebugConfig } = useStore();

  if (!isAdminWallet(user?.wallet_address)) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-dark-200 p-4 rounded-lg border border-dark-300 z-50">
      <h3 className="text-sm font-semibold text-gray-100 mb-2">Debug Panel</h3>
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={debugConfig.forceWalletNotFound}
            onChange={(e) => setDebugConfig({ forceWalletNotFound: e.target.checked })}
          />
          <span className="text-sm text-gray-400">Force Wallet Not Found</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={debugConfig.forceUserRejection}
            onChange={(e) => setDebugConfig({ forceUserRejection: e.target.checked })}
          />
          <span className="text-sm text-gray-400">Force User Rejection</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={debugConfig.forceAPIError}
            onChange={(e) => setDebugConfig({ forceAPIError: e.target.checked })}
          />
          <span className="text-sm text-gray-400">Force API Error</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={debugConfig.forceUnauthorized}
            onChange={(e) => setDebugConfig({ forceUnauthorized: e.target.checked })}
          />
          <span className="text-sm text-gray-400">Force Unauthorized</span>
        </label>
      </div>
    </div>
  );
};
