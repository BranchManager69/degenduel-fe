// src/components/WalletBalanceAnalytics.tsx

import React, { useState, useEffect } from 'react';
import WalletBalanceChart from './WalletBalanceChart';
import { useUnifiedWebSocket, DDExtendedMessageType } from '../hooks/websocket';

interface WalletBalanceAnalyticsProps {
  className?: string;
  walletAddress?: string;
  title?: string;
  showControls?: boolean;
  showInsights?: boolean;
}

interface BalanceInsight {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  description: string;
  color: string;
}

export const WalletBalanceAnalytics: React.FC<WalletBalanceAnalyticsProps> = ({
  className = '',
  walletAddress,
  title = 'Wallet Balance Analytics',
  showControls = true,
  showInsights = true
}) => {
  const [activeView, setActiveView] = useState<string>(walletAddress ? 'specific' : 'total');
  const [searchWallet, setSearchWallet] = useState<string>(walletAddress || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [insights, setInsights] = useState<BalanceInsight[]>([]);
  // Provide the required parameters to useUnifiedWebSocket
  const { isConnected, isAuthenticated, request } = useUnifiedWebSocket(
    'wallet-balance-analytics', // Unique ID for this component
    [DDExtendedMessageType.DATA], // Message types to listen for
    () => {} // Empty callback since we're not using the subscription directly
  );
  
  // Set up default insights
  useEffect(() => {
    setInsights([
      {
        id: 'growth',
        title: 'Balance Growth',
        value: '+12.4%',
        subtitle: 'last 30 days',
        description: 'Total SOL balance has increased by 12.4% in the last month.',
        color: 'brand'
      },
      {
        id: 'trend',
        title: 'Balance Trend',
        value: '+5.7%',
        subtitle: 'weekly average',
        description: 'Weekly growth has averaged 5.7% over the last month.',
        color: 'amber'
      },
      {
        id: 'activity',
        title: 'Transaction Activity',
        value: '27',
        subtitle: 'transactions, 7d',
        description: '27 transactions recorded in the last 7 days.',
        color: 'emerald'
      },
      {
        id: 'change',
        title: 'Largest Change',
        value: '+42.5 SOL',
        subtitle: 'single day, 24h',
        description: 'The largest single-day balance increase was 42.5 SOL.',
        color: 'purple'
      }
    ]);
  }, []);
  
  // Handle data loading from chart to update insights
  const handleDataLoaded = (data: any) => {
    if (!data || !data.insights) return;
    
    // Update insights based on actual data
    setInsights(prevInsights => 
      prevInsights.map(insight => {
        // Find matching insight from data
        const dataInsight = data.insights.find((di: any) => di.id === insight.id);
        
        // Update if found, otherwise return original
        return dataInsight ? {
          ...insight,
          value: dataInsight.value,
          subtitle: dataInsight.subtitle || insight.subtitle,
          description: dataInsight.description || insight.description
        } : insight;
      })
    );
  };
  
  const views = [
    { id: 'total', label: 'Total Balance' },
    { id: 'average', label: 'Average Balance' },
    { id: 'top', label: 'Top Wallets' },
    { id: 'specific', label: 'Specific Wallet' },
  ];
  
  const handleSearch = async () => {
    if (!searchWallet) return;
    
    setIsSearching(true);
    
    try {
      // First try WebSocket if connected
      if (isConnected && isAuthenticated) {
        try {
          // Check if wallet exists first via WebSocket with proper type assertion
          const walletExists = await request('admin', 'wallet-balance/exists', { 
            wallet: searchWallet 
          }) as unknown as { 
            success: boolean; 
            data: { exists: boolean } 
          };
          
          // Check if the response has the expected properties
          if (walletExists && 
              walletExists.success === true && 
              walletExists.data && 
              walletExists.data.exists === true) {
            // If wallet exists, switch to specific wallet view
            setActiveView('specific');
            return;
          }
        } catch (wsError) {
          console.warn('WebSocket wallet check failed, trying REST API fallback:', wsError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API
      try {
        // Try to fetch data for this wallet as a validation check
        const response = await fetch(`/api/admin/wallet-monitoring/balances/${searchWallet}?limit=1`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          // If we get a successful response, the wallet exists
          setActiveView('specific');
        } else {
          throw new Error('Wallet not found or has no balance history');
        }
      } catch (restError) {
        console.error('Error checking wallet via REST API:', restError);
        throw restError;
      }
    } catch (error) {
      console.error('Error searching for wallet:', error);
      
      // You could implement a toast notification here
      // toast.error(error instanceof Error ? error.message : 'Error searching for wallet');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Map view types to chart view types
  const getViewType = () => {
    switch (activeView) {
      case 'specific': return 'single';
      case 'top': return 'top';
      case 'total': return 'total';
      case 'average': return 'average';
      default: return 'total';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with view selectors */}
      {showControls && (
        <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
          <h2 className="text-xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent mb-4">
            {title}
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'bg-dark-300/50 text-gray-400 border border-dark-400/30 hover:bg-dark-300/80'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          
          {/* Wallet search input for specific wallet view */}
          {activeView === 'specific' && (
            <div className="mb-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                  placeholder="Enter wallet address..."
                  className="flex-1 bg-dark-300/50 border border-dark-400/50 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchWallet || isSearching}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !searchWallet || isSearching
                      ? 'bg-brand-500/20 text-brand-400/50 cursor-not-allowed'
                      : 'bg-brand-500/30 hover:bg-brand-500/40 text-brand-300'
                  }`}
                >
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Balance Chart */}
      <WalletBalanceChart
        title={
          activeView === 'total' ? 'Total Platform Balance' :
          activeView === 'average' ? 'Average User Balance' :
          activeView === 'top' ? 'Top 10 Wallets by Balance' :
          `Wallet Balance: ${searchWallet && searchWallet.length > 10 ? 
            `${searchWallet.slice(0, 6)}...${searchWallet.slice(-4)}` : 
            searchWallet}`
        }
        description={
          activeView === 'specific' 
            ? 'Balance history for the specified wallet address'
            : 'SOL balances tracked over time across the platform'
        }
        walletAddress={activeView === 'specific' ? searchWallet : undefined}
        viewType={getViewType()}
        height={300}
        showControls={showControls}
        onDataLoaded={handleDataLoaded}
      />
      
      {/* Balance Insights Panel */}
      {showInsights && (
        <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            Balance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => {
              // Map color names to Tailwind classes
              const colorClass = {
                'brand': 'text-brand-400',
                'amber': 'text-amber-400',
                'emerald': 'text-emerald-400',
                'purple': 'text-purple-400',
                'cyan': 'text-cyan-400',
                'red': 'text-red-400'
              }[insight.color] || 'text-brand-400';
              
              const valueColorClass = {
                'brand': 'text-brand-300',
                'amber': 'text-amber-300',
                'emerald': 'text-emerald-300',
                'purple': 'text-purple-300',
                'cyan': 'text-cyan-300',
                'red': 'text-red-300'
              }[insight.color] || 'text-brand-300';
              
              return (
                <div key={insight.id} className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
                  <h4 className={`${colorClass} font-medium text-sm mb-2`}>{insight.title}</h4>
                  <div className="flex justify-between items-baseline">
                    <span className={`text-2xl font-bold ${valueColorClass}`}>{insight.value}</span>
                    <span className="text-xs text-gray-400">{insight.subtitle}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {insight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletBalanceAnalytics;