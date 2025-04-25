// src/components/UserProfileExtras.tsx

import React from 'react';
import AdminWalletBalanceChart from './AdminWalletBalanceChart';

interface UserProfileExtrasProps {
  walletAddress: string;
  nickname?: string;
  className?: string;
}

/**
 * Component that adds extra features to user profile pages
 * Only displays admin-only features when viewed by admin users
 */
export const UserProfileExtras: React.FC<UserProfileExtrasProps> = ({
  walletAddress,
  nickname,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Admin-only wallet balance chart */}
      <AdminWalletBalanceChart
        walletAddress={walletAddress}
        title={`${nickname ? nickname + "'s" : 'Wallet'} Balance History`}
        description="Historical SOL balance tracking (admin view only)"
        height={250}
        showControls={true}
      />
      
      {/* Other profile extras can be added here */}
    </div>
  );
};

export default UserProfileExtras;