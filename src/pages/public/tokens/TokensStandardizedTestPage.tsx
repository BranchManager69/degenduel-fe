// src/pages/public/tokens/TokensStandardizedTestPage.tsx

/**
 * Test page for the standardized token data components
 * This page demonstrates all the standardized token-related components
 */

import React from 'react';
import { StandardizedHotTokensList } from '../../../components/landing/hot-tokens';
import { StandardizedMarketStatsPanel } from '../../../components/landing/market-stats';
import { useMigratedAuth } from '../../../hooks/auth/useMigratedAuth';

const TokensStandardizedTestPage: React.FC = () => {
  const { isAdmin } = useMigratedAuth();
  const [debugMode, setDebugMode] = React.useState(false);

  return (
    <div className="min-h-screen bg-dark-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Standardized Components Test</h1>
          
          {isAdmin && (
            <button
              className="bg-black/50 text-white text-xs p-1 rounded-md"
              onClick={() => setDebugMode(!debugMode)}
            >
              {debugMode ? "🛠️" : "🐛"}
            </button>
          )}
        </div>
        
        {/* Description */}
        <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-6 border border-dark-300/60 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-3">About This Page</h2>
          <p className="text-gray-300 mb-4">
            This page demonstrates the standardized components for token data visualization.
            These components use a consistent design language, error handling, and data processing.
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Consistent visual appearance across all components</li>
            <li>Standardized loading states and error handling</li>
            <li>Common debug information format</li>
            <li>Shared animation patterns</li>
            <li>Unified WebSocket data handling via useStandardizedTokenData hook</li>
          </ul>
        </div>
        
        {/* Components */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Market Stats Panel</h2>
            <StandardizedMarketStatsPanel />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Hot Tokens List</h2>
            <StandardizedHotTokensList />
          </div>
          
          {/* Example of future standardized components */}
          <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-6 border border-dark-300/60 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-3">Future Standardized Components</h2>
            <div className="text-gray-300">
              <p className="mb-4">The following components will also be standardized:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>TokensPreviewSection</li>
                <li>ContestSection</li>
                <li>All WebSocket status indicators</li>
                <li>Debug panels</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokensStandardizedTestPage;