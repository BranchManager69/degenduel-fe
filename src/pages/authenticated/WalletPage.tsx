import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DuelBalanceChart } from '../../components/DuelBalanceChart';
import { DuelSnapshotChart } from '../../components/DuelSnapshotChart';
import { DuelSnapshotTable } from '../../components/DuelSnapshotTable';
import { ProfileHeader } from '../../components/ProfileHeader';
import { RevenueShareDiagram } from '../../components/RevenueShareDiagram';
import { WalletPortfolioTable } from '../../components/WalletPortfolioTable';
import { useStore } from '../../store/useStore';
import MiniLogo from '../../components/logo/MiniLogo';

/**
 * Wallet Page Component
 * 
 * Displays the user's wallet balances and transactions with direct blockchain data
 * Now accessible to logged out users with placeholder content
 * 
 * @updated 2025-07-27 - Made accessible to logged out users
 */

const WalletPage: React.FC = () => {
  const { user } = useStore();
  const isLoggedIn = !!user?.wallet_address;
  const [selectedChart, setSelectedChart] = useState<'snapshots' | 'balance'>('snapshots');
  
  // Helper function for admin/superadmin visibility (same pattern as Terminal)
  const isAdministrator = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Reset to snapshots if non-admin user somehow has balance selected
  useEffect(() => {
    if (!isAdministrator && selectedChart === 'balance') {
      setSelectedChart('snapshots');
    }
  }, [isAdministrator, selectedChart]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Degen Dividends</h1>
        </div>
        
        {/* Flashy subheader */}
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-white to-[#14F195]"
              style={{
                textShadow: '0 0 40px rgba(20, 241, 149, 0.5), 0 0 80px rgba(153, 69, 255, 0.3)',
                WebkitTextStroke: '1px rgba(255,255,255,0.1)'
              }}>
              GET PAID TO HOLD
            </span>
          </h2>
          <div className="mt-4 relative">
            {/* Text content */}
            <div className="flex items-center justify-center gap-8 relative z-10">
              {/* Step 1: Hold */}
              <div className="flex items-center gap-2 animate-pulse" style={{ animationDelay: '0s' }}>
              <span className="font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600"
                    style={{ 
                      fontFamily: "'Inter', sans-serif", 
                      textShadow: '0 0 30px rgba(168, 85, 247, 0.8)',
                      filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))'
                    }}>
                Hold
              </span> 
              <div className="transform scale-110"><MiniLogo /></div>
            </div>
            
              {/* Step 2: Earn */}
              <div className="flex items-center gap-2 animate-pulse" style={{ animationDelay: '0.5s' }}>
              <span className="font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ 
                      fontFamily: "'Inter', sans-serif", 
                      textShadow: '0 0 30px rgba(0, 212, 255, 0.8)',
                      filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))'
                    }}>
                Earn
              </span>
              <img src="/assets/media/logos/solana.svg" alt="Solana" className="h-5 w-5 sm:h-6 sm:w-6" 
                   style={{ filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.8))' }} />
            </div>
            
              {/* Step 3: Profit */}
              <div className="flex items-center gap-1 animate-pulse" style={{ animationDelay: '1s' }}>
                <span className="font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ 
                        fontFamily: "'Inter', sans-serif", 
                        textShadow: '0 0 30px rgba(74, 222, 128, 0.8)',
                        filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))'
                      }}>
                  Profit
                </span> 
                <span className="text-green-400 font-bold text-xl"
                      style={{ 
                        textShadow: '0 0 20px rgba(74, 222, 128, 0.8)',
                        filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))'
                      }}>$</span>
              </div>
            </div>
            
            {/* Animated line underneath */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5">
              <div className="h-full w-full bg-gradient-to-r from-purple-500/20 via-cyan-400/20 to-green-500/20 rounded-full overflow-hidden">
                <div className="h-full w-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #a855f7 20%, #00d4ff 50%, #10b981 80%, transparent 100%)',
                    animation: 'flow 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes flow {
              0% { transform: translateX(-100%); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translateX(100%); opacity: 0; }
            }
          `}} />
        </div>
        
        {/* Revenue Share Diagram - Always visible */}
        <RevenueShareDiagram />
        
        {/* Placeholder content for logged out users */}
        <div className="mt-12 bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-8">
          <div className="text-center space-y-6">
            <div className="text-gray-400">
              <h2 className="text-2xl font-semibold mb-4 text-white">Track Your DUEL Holdings & Dividends</h2>
              <p className="text-lg mb-6">
                Monitor your DUEL token balance, view historical snapshots, and track your share of platform revenue.
              </p>
              <p className="text-base mb-8">
                DegenDuel shares 100% of platform revenue with DUEL holders through weekly dividend distributions.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white 
                  bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                  rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25"
              >
                Login to View Your Dividends
              </Link>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-dark-300/50 rounded-lg p-4 border border-gray-700/20">
                <h3 className="text-brand-400 font-semibold mb-2">Weekly Snapshots</h3>
                <p className="text-gray-400 text-sm">
                  Automatic weekly snapshots capture your DUEL balance for dividend calculations
                </p>
              </div>
              <div className="bg-dark-300/50 rounded-lg p-4 border border-gray-700/20">
                <h3 className="text-brand-400 font-semibold mb-2">Revenue Sharing</h3>
                <p className="text-gray-400 text-sm">
                  100% of platform fees distributed proportionally to all DUEL holders
                </p>
              </div>
              <div className="bg-dark-300/50 rounded-lg p-4 border border-gray-700/20">
                <h3 className="text-brand-400 font-semibold mb-2">Portfolio Tracking</h3>
                <p className="text-gray-400 text-sm">
                  View your complete token portfolio and historical balance changes
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Placeholder Charts and Tables for Logged Out Users */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">See How It Works</h3>
            <p className="text-gray-400">Example data showing potential earnings from DUEL holdings</p>
          </div>
          
          {/* Chart selector - only show if admin has multiple options */}
          {isAdministrator && (
            <div className="mb-6 flex justify-center">
              <div className="bg-dark-300/50 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setSelectedChart('snapshots')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedChart === 'snapshots'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  Daily Snapshots
                </button>
                <button
                  onClick={() => setSelectedChart('balance')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedChart === 'balance'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>Balance History</span>
                    <span className="text-red-400 text-xs">ADMIN ONLY</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Single chart - full width */}
          <div className="relative bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
            <div className="opacity-60">
              {selectedChart === 'snapshots' ? (
                <DuelSnapshotChart height={400} demoMode={true} />
              ) : (
                <DuelBalanceChart height={400} demoMode={true} />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-dark-300/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-600/30">
                <p className="text-gray-300 font-semibold">
                  {selectedChart === 'snapshots' ? 'Example Snapshot Data' : 'Example Holdings Chart'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Snapshot Data Table */}
          <div className="mt-8">
            <div className="relative">
              <div className="opacity-60">
                <DuelSnapshotTable demoMode={true} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-dark-300/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-600/30">
                  <p className="text-gray-300 font-semibold">Login to View Your Actual Dividend History</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart selector - only show if admin has multiple options */}
          {isAdministrator && (
            <div className="mt-8 mb-6 flex justify-center">
              <div className="bg-dark-300/50 rounded-lg p-1 flex gap-1">
                <button
                  onClick={() => setSelectedChart('snapshots')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedChart === 'snapshots'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  Daily Snapshots
                </button>
                <button
                  onClick={() => setSelectedChart('balance')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedChart === 'balance'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>Balance History</span>
                    <span className="text-red-400 text-xs">ADMIN ONLY</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Single chart - full width */}
          <div className={`relative bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6 ${isAdministrator ? '' : 'mt-8'}`}>
            <div className="opacity-60">
              {selectedChart === 'snapshots' ? (
                <DuelSnapshotChart height={400} demoMode={true} />
              ) : (
                <DuelBalanceChart height={400} demoMode={true} />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-dark-300/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-600/30">
                <p className="text-gray-300 font-semibold">
                  {selectedChart === 'snapshots' ? 'Example Snapshot Data' : 'Example Holdings Chart'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Portfolio Holdings Table */}
          <div className="mt-8 bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
            <div className="relative">
              <div className="opacity-60">
                <WalletPortfolioTable demoMode={true} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-dark-300/90 backdrop-blur-sm px-6 py-3 rounded-lg border border-gray-600/30">
                  <p className="text-gray-300 font-semibold">Your Portfolio Will Appear Here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with title and profile */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">Degen Dividends</h1>
        <ProfileHeader user={user} />
      </div>
      
      {/* Flashy subheader */}
      <div className="text-center mb-8">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-white to-[#14F195]"
            style={{
              textShadow: '0 0 40px rgba(20, 241, 149, 0.5), 0 0 80px rgba(153, 69, 255, 0.3)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
            GET PAID TO HOLD
          </span>
        </h2>
        <div className="mt-3 flex items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
            <span className="text-gray-200">Hold</span>
            <div className="transform scale-110"><MiniLogo /></div>
          </div>
          
          <div className="flex items-center">
            <div className="h-px w-4 bg-gradient-to-r from-transparent to-purple-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500/50 mx-1"></div>
            <div className="h-px w-4 bg-gradient-to-l from-transparent to-purple-500/50"></div>
          </div>
          
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
            <span className="text-gray-200">Earn</span>
            <img src="/assets/media/logos/solana.svg" alt="Solana" className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          
          <div className="flex items-center">
            <div className="h-px w-4 bg-gradient-to-r from-transparent to-green-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50 mx-1"></div>
            <div className="h-px w-4 bg-gradient-to-l from-transparent to-green-500/50"></div>
          </div>
          
          <div className="text-xl sm:text-2xl font-bold">
            <span className="text-gray-200">Profit</span>
            <span className="text-green-400 ml-1 text-2xl sm:text-3xl">$</span>
          </div>
        </div>
      </div>
      
      {/* Snapshot Data Table */}
      <div className="mt-8">
        <DuelSnapshotTable />
      </div>
      
      {/* Revenue Share Diagram */}
      <RevenueShareDiagram />
      
      {/* Chart selector - only show if admin has multiple options */}
      {isAdministrator && (
        <div className="mt-8 mb-6 flex justify-center">
          <div className="bg-dark-300/50 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setSelectedChart('snapshots')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedChart === 'snapshots'
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              Daily Snapshots
            </button>
            <button
              onClick={() => setSelectedChart('balance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedChart === 'balance'
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>Balance History</span>
                <span className="text-red-400 text-xs">ADMIN ONLY</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Single chart - full width */}
      <div className={`bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6 ${isAdministrator ? '' : 'mt-8'}`}>
        {selectedChart === 'snapshots' ? (
          <DuelSnapshotChart height={400} />
        ) : (
          <DuelBalanceChart height={400} />
        )}
      </div>
      
      {/* Portfolio Holdings Table */}
      <div className="mt-8 bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 shadow-lg p-6">
        <WalletPortfolioTable />
      </div>
    </div>
  );
};

export default WalletPage;