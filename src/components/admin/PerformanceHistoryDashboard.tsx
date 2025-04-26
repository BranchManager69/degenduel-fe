// src/components/admin/PerformanceHistoryDashboard.tsx

import React, { useState } from 'react';
import RPCBenchmarkHistoricalView from './RPCBenchmarkHistoricalView';
import WalletBalanceHistoricalView from './WalletBalanceHistoricalView';

export const PerformanceHistoryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rpc' | 'wallets'>('rpc');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          PERFORMANCE HISTORY DASHBOARD
        </h1>
        
        <div className="flex space-x-1 bg-dark-200/80 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab('rpc')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'rpc'
                ? 'bg-brand-500/20 text-brand-300'
                : 'hover:bg-dark-300/50 text-gray-400'
            }`}
          >
            RPC Performance
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'wallets'
                ? 'bg-brand-500/20 text-brand-300'
                : 'hover:bg-dark-300/50 text-gray-400'
            }`}
          >
            Wallet Balances
          </button>
        </div>
      </div>
      
      {/* Description based on active tab */}
      <div className="bg-dark-300/30 backdrop-blur-sm border border-dark-400/30 rounded-lg p-4">
        {activeTab === 'rpc' ? (
          <div className="flex items-start">
            <div className="mr-3 text-brand-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-200 font-medium text-lg">RPC Performance Monitoring</h3>
              <p className="text-gray-400 mt-1">
                Track and compare latency metrics across multiple RPC providers over time. Identify trends, performance degradation, or improvements to optimize your infrastructure.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start">
            <div className="mr-3 text-brand-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-200 font-medium text-lg">Wallet Balance Tracking</h3>
              <p className="text-gray-400 mt-1">
                Monitor SOL balances across user wallets to track platform growth, identify patterns, and detect unusual activity. View aggregated statistics or zoom in on specific wallets.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Main content based on active tab */}
      {activeTab === 'rpc' ? (
        <RPCBenchmarkHistoricalView />
      ) : (
        <WalletBalanceHistoricalView />
      )}
    </div>
  );
};

export default PerformanceHistoryDashboard;