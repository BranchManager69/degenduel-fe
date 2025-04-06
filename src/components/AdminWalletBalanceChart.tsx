// src/components/AdminWalletBalanceChart.tsx

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import WalletBalanceChart from './WalletBalanceChart';


interface AdminWalletBalanceChartProps {
  walletAddress: string;
  height?: number | string;
  title?: string;
  description?: string;
  showControls?: boolean;
  className?: string;
  fallbackComponent?: React.ReactNode;
}

/**
 * A wrapper around WalletBalanceChart that only renders for admin/superadmin users
 * Can be safely included on any user profile page
 */
export const AdminWalletBalanceChart: React.FC<AdminWalletBalanceChartProps> = ({
  walletAddress,
  height = 250,
  title = 'Wallet Balance History',
  description = 'Historical SOL balance for this wallet',
  showControls = true,
  className = '',
  fallbackComponent = null
}) => {
  const { user } = useStore();
  const [error, setError] = useState<string | null>(null);
  
  // Check if current user has admin or superadmin role
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
  
  // If not an admin user, render fallback or nothing
  if (!isAdminUser) {
    return <>{fallbackComponent}</>;
  }
  
  // If there was an error loading data, show a simplified error message (only for admins)
  if (error) {
    return (
      <div className={`rounded-lg overflow-hidden ${className}`}>
        <div className="bg-red-500/20 border border-red-500/30 rounded px-3 py-2 mb-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm text-red-300">Error loading wallet data: {error}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // No wallet address provided
  if (!walletAddress) {
    return (
      <div className={`rounded-lg overflow-hidden ${className}`}>
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded px-3 py-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-300">No wallet address provided</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle data loading errors
  // const handleError = (errorMsg: string) => {
  // setError(errorMsg);
  // };
  
  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="bg-dark-200/50 border-l-4 border-brand-500 px-3 py-2 mb-2">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-brand-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-300">Admin-only wallet monitoring</span>
        </div>
      </div>
      
      <WalletBalanceChart
        walletAddress={walletAddress}
        viewType="single"
        height={height}
        title={title}
        description={description}
        showControls={showControls}
        className={className}
        onDataLoaded={() => setError(null)} // Clear error on successful data load
        onError={(errorMsg) => setError(errorMsg)} // Handle error from chart component
      />
    </div>
  );
};

export default AdminWalletBalanceChart;