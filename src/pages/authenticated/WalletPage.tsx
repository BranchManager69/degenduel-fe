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
import NanoLogo from '../../components/logo/NanoLogo';

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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-4 md:gap-6">
            <div className="scale-100 sm:scale-125 md:scale-150">
              <NanoLogo />
            </div>
            <span className="whitespace-nowrap">Degen Dividends</span>
          </h1>
        </div>
        
        {/* Flashy subheader */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
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
            <div className="flex items-center justify-center gap-4 md:gap-8 relative z-10">
              {/* Step 1: Hold */}
              <div className="flex items-center gap-1 animate-pulse" style={{ animationDelay: '0s' }}>
                <span className="uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{ 
                        fontFamily: "'Inter', sans-serif", 
                        textShadow: '0 0 30px rgba(168, 85, 247, 0.8)',
                        filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))'
                      }}>
                  Hold
                </span> 
                <div className="transform scale-75"><MiniLogo /></div>
              </div>
              
              <span className="text-gray-600">•</span>
              
              {/* Step 2: Earn */}
              <div className="flex items-center gap-1 animate-pulse" style={{ animationDelay: '0.5s' }}>
                <span className="uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ 
                        fontFamily: "'Inter', sans-serif", 
                        textShadow: '0 0 30px rgba(0, 212, 255, 0.8)',
                        filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))'
                      }}>
                  Earn
                </span>
                <img src="/assets/media/logos/solana.svg" alt="Solana" className="h-4 w-4" 
                     style={{ filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.8))' }} />
              </div>
              
              <span className="text-gray-600">•</span>
              
              {/* Step 3: Profit */}
              <div className="flex items-center gap-1 animate-pulse" style={{ animationDelay: '1s' }}>
                <span className="uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ 
                        fontFamily: "'Inter', sans-serif", 
                        textShadow: '0 0 30px rgba(74, 222, 128, 0.8)',
                        filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))'
                      }}>
                  Profit
                </span> 
                <span className="text-green-400 text-lg"
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
        
        {/* Demo mode header with CTA */}
        <div className="mt-8 p-6 mb-6">
          <div className="text-center space-y-4">
            <div className="text-gray-400">
              <h2 className="text-xl font-semibold mb-2 text-white">Track Your Revenue Share</h2>
              <p className="text-sm mb-2">
                DegenDuel shares 100% of platform revenue with DUEL holders through daily dividend distributions.
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white 
                  bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                  rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25"
              >
                Login to View Your Dividends
              </Link>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Example data showing potential earnings
            </p>
          </div>
        </div>
        
        {/* Snapshot Data Table */}
        <div>
          <DuelSnapshotTable demoMode={true} />
        </div>
        
        {/* Revenue Share Diagram - Always visible */}
        <RevenueShareDiagram />
        
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with title and profile */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="scale-100 sm:scale-125 md:scale-150">
            <NanoLogo />
          </div>
          <span className="whitespace-nowrap">Degen Dividends</span>
        </h1>
        <ProfileHeader user={user} />
      </div>
      
      {/* Flashy subheader */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-white to-[#14F195]"
            style={{
              textShadow: '0 0 40px rgba(20, 241, 149, 0.5), 0 0 80px rgba(153, 69, 255, 0.3)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
            GET PAID TO HOLD
          </span>
        </h2>
        <div className="mt-3 flex items-center justify-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1 text-lg sm:text-xl">
            <span className="text-gray-200">Hold</span>
            <div className="transform scale-75"><MiniLogo /></div>
          </div>
          
          <span className="text-gray-600">•</span>
          
          <div className="flex items-center gap-1 text-lg sm:text-xl">
            <span className="text-gray-200">Earn</span>
            <img src="/assets/media/logos/solana.svg" alt="Solana" className="h-4 w-4" />
          </div>
          
          <span className="text-gray-600">•</span>
          
          <div className="flex items-center gap-1 text-lg sm:text-xl">
            <span className="text-gray-200">Profit</span>
            <span className="text-green-400 text-xl">$</span>
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