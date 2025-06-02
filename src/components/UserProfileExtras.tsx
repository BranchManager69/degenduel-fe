// src/components/UserProfileExtras.tsx

import React, { lazy, Suspense } from 'react';
import { useStore } from '../store/useStore';

// Lazy load the heavy chart component
const AdminWalletBalanceChart = lazy(() => import('./AdminWalletBalanceChart'));

interface UserProfileExtrasProps {
  walletAddress: string;
  nickname?: string;
  className?: string;
  showWalletSelector?: boolean;
  compareMode?: boolean;
}

/**
 * Component that adds extra features to user profile pages
 * Only displays admin-only features when viewed by admin users
 */
export const UserProfileExtras: React.FC<UserProfileExtrasProps> = ({
  walletAddress,
  nickname,
  className = '',
  showWalletSelector = false,
  compareMode = false
}) => {
  const { user } = useStore();
  
  // Only render for admin users
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Admin-only wallet balance chart with lazy loading */}
      <Suspense fallback={
        <div className="bg-dark-200/30 rounded-lg border border-brand-500/20 p-4 h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400"></div>
        </div>
      }>
        <AdminWalletBalanceChart
          walletAddress={walletAddress}
          title={`${nickname ? nickname + "'s" : 'Wallet'} Balance History`}
          description="Historical SOL balance tracking (admin view only)"
          height={200}
          showControls={true}
          showWalletSelector={showWalletSelector}
          compareMode={compareMode}
        />
      </Suspense>
    </div>
  );
};

export default UserProfileExtras;