import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import NanoLogo from '../../components/logo/NanoLogo';
import PoolInformationModal from '../../components/meteora/PoolInformationModal';
import LiquiditySimulationModal from '../../components/meteora/LiquiditySimulationModal';
import CreatePositionModal from '../../components/meteora/CreatePositionModal';
import SupportedPoolsModal from '../../components/meteora/SupportedPoolsModal';

/**
 * LP Page Component
 * 
 * Meteora DLMM Liquidity Provider Interface
 * Provides access to advanced liquidity provision tools and pool management
 * 
 * @created 2025-07-31
 */

const LPPage: React.FC = () => {
  const { user } = useStore();
  const isLoggedIn = !!user?.wallet_address;
  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [activeTab, setActiveTab] = useState<'exchange' | 'information'>('exchange');
  
  // Modal states
  const [poolInfoModalOpen, setPoolInfoModalOpen] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [createPositionModalOpen, setCreatePositionModalOpen] = useState(false);
  const [supportedPoolsModalOpen, setSupportedPoolsModalOpen] = useState(false);
  
  // Removed unused wallet hook variables
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="scale-100 sm:scale-125 md:scale-150">
            <NanoLogo />
          </div>
          <span className="whitespace-nowrap">Liquidity Provider</span>
        </h1>
      </div>
      
      {/* Hero */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-white to-[#14F195]"
            style={{
              textShadow: '0 0 40px rgba(20, 241, 149, 0.5), 0 0 80px rgba(153, 69, 255, 0.3)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
            METEORA DLMM
          </span>
        </h2>
      </div>
      
      {/* Introduction Section */}
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg max-w-3xl mx-auto">
          Advanced liquidity provision tools for Meteora's Dynamic Liquidity Market Maker. Manage positions with multiple strategies and real-time pool data.
        </p>
      </div>
      
      {/* Tab Selector */}
      {isAdminOrSuperAdmin ? (
        <div className="mb-8 flex justify-center">
          <div className="bg-dark-300/50 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'exchange'
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              LP Tools
            </button>
            <button
              onClick={() => setActiveTab('information')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'information'
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
              }`}
            >
              Pool Info
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8"></div>
      )}
      
      {/* Tab Content */}
      {(activeTab === 'exchange' || !isAdminOrSuperAdmin) ? (
        <div>
          {isLoggedIn ? (
            <>
              {/* LP Tools Grid */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Pool Information Tool */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Pool Information</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Get detailed information about any Meteora DLMM pool including price, liquidity, and status.
                    </p>
                    <button 
                      onClick={() => setPoolInfoModalOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-102 hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <span className="flex items-center justify-center gap-2">
                        View Pool Data
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </div>

                  {/* Liquidity Simulation Tool */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Simulate LP Position</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Test different liquidity strategies and amounts before committing funds to any position.
                    </p>
                    <button 
                      onClick={() => setSimulationModalOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-102 hover:shadow-lg hover:shadow-green-500/30"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Run Simulation
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                    </button>
                  </div>

                  {/* Create Position Tool */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Create LP Position</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Build and submit transactions to create new liquidity positions with your preferred strategy.
                    </p>
                    <button 
                      onClick={() => isLoggedIn && setCreatePositionModalOpen(true)}
                      disabled={!isLoggedIn}
                      className={`w-full py-3 font-bold rounded-lg transition-all duration-200 transform ${
                        isLoggedIn 
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white hover:scale-102 hover:shadow-lg hover:shadow-purple-500/30' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isLoggedIn ? 'Create Position' : 'Login Required'}
                        {isLoggedIn && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Supported Pools Tool */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Browse Pools</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Explore curated list of supported DLMM pools with TVL, volume, and APY metrics.
                    </p>
                    <button 
                      onClick={() => setSupportedPoolsModalOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-102 hover:shadow-lg hover:shadow-cyan-500/30"
                    >
                      <span className="flex items-center justify-center gap-2">
                        View All Pools
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </span>
                    </button>
                  </div>

                </div>
              </div>
              
              {/* Liquidity Strategies Info */}
              <div className="mt-12 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-4">Liquidity Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">SpotBalanced</h4>
                    <p className="text-gray-400 text-sm">Concentrates liquidity around current price (±50 bins) for maximum efficiency.</p>
                  </div>
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">CurveBalanced</h4>
                    <p className="text-gray-400 text-sm">Wider distribution across price range (±100 bins) for reduced impermanent loss.</p>
                  </div>
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">BidAskBalanced</h4>
                    <p className="text-gray-400 text-sm">Separate bid/ask distributions (±25 bins) for directional strategies.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Not Logged In State */
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Login to Access LP Tools
                </h3>
                <p className="text-gray-400 mb-6">
                  Connect your wallet to access advanced liquidity provision tools and manage your Meteora positions.
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white 
                    bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                    rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25"
                >
                  Connect Wallet
                </a>
              </div>
            </div>
          )}
        </div>
      ) : isAdminOrSuperAdmin ? (
        /* Pool Information Tab - Admin/SuperAdmin Only */
        <div className="max-w-4xl mx-auto">
          {/* API Endpoints Overview */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Meteora DLMM API Endpoints</h3>
            <p className="text-gray-400 mb-6">
              Our integration provides access to four powerful endpoints for managing liquidity on Meteora's Dynamic Liquidity Market Maker.
            </p>
          </div>
          
          {/* Endpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Pool Information Endpoint */}
            <div className="bg-dark-200/40 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-mono rounded">GET</span>
                <h4 className="text-lg font-semibold text-white">Pool Information</h4>
              </div>
              <p className="text-sm font-mono text-gray-400 mb-3">/api/meteora/pools/&#123;poolAddress&#125;</p>
              <p className="text-gray-400 text-sm mb-4">
                Retrieve detailed information about any DLMM pool including current price, active bin, fees, and liquidity status.
              </p>
              <div className="bg-dark-300/50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Returns:</p>
                <p className="text-xs text-gray-400">Price data, bin information, fee rates, pool status</p>
              </div>
            </div>

            {/* Simulate Liquidity Endpoint */}
            <div className="bg-dark-200/40 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-mono rounded">POST</span>
                <h4 className="text-lg font-semibold text-white">Simulate Position</h4>
              </div>
              <p className="text-sm font-mono text-gray-400 mb-3">/api/meteora/liquidity/simulate</p>
              <p className="text-gray-400 text-sm mb-4">
                Test different liquidity strategies and amounts before committing funds. Supports SpotBalanced, CurveBalanced, and BidAskBalanced strategies.
              </p>
              <div className="bg-dark-300/50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Auth Required:</p>
                <p className="text-xs text-gray-400">✅ JWT token needed</p>
              </div>
            </div>

            {/* Create Transaction Endpoint */}
            <div className="bg-dark-200/40 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-purple-600 text-white text-xs font-mono rounded">POST</span>
                <h4 className="text-lg font-semibold text-white">Create Transaction</h4>
              </div>
              <p className="text-sm font-mono text-gray-400 mb-3">/api/meteora/liquidity/create-transaction</p>
              <p className="text-gray-400 text-sm mb-4">
                Build unsigned transactions for adding liquidity to DLMM pools. Returns serialized transaction for wallet signing.
              </p>
              <div className="bg-dark-300/50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Auth Required:</p>
                <p className="text-xs text-gray-400">✅ JWT token needed</p>
              </div>
            </div>

            {/* Supported Pools Endpoint */}
            <div className="bg-dark-200/40 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-mono rounded">GET</span>
                <h4 className="text-lg font-semibold text-white">Supported Pools</h4>
              </div>
              <p className="text-sm font-mono text-gray-400 mb-3">/api/meteora/supported-pools</p>
              <p className="text-gray-400 text-sm mb-4">
                Get curated list of supported DLMM pools with TVL, 24h volume, and APY metrics for easy pool discovery.
              </p>
              <div className="bg-dark-300/50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Public:</p>
                <p className="text-xs text-gray-400">No authentication required</p>
              </div>
            </div>

          </div>

          {/* Technical Details */}
          <div className="bg-dark-200/40 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Technical Implementation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-white mb-2">Key Features</h5>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• Real-time pool data from Solana RPC</li>
                  <li>• Multiple liquidity strategies</li>
                  <li>• Accurate fee estimation</li>
                  <li>• Unsigned transaction building</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-white mb-2">Dependencies</h5>
                <ul className="space-y-1 text-gray-400 text-sm">
                  <li>• @meteora-ag/dlmm@1.6.0</li>
                  <li>• @solana/web3.js</li>
                  <li>• Production-ready endpoints</li>
                  <li>• Comprehensive error handling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fallback for non-admin users */
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Access Restricted
            </h3>
            <p className="text-gray-400">
              Pool information is only available to administrators.
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <PoolInformationModal 
        isOpen={poolInfoModalOpen}
        onClose={() => setPoolInfoModalOpen(false)}
      />
      
      <LiquiditySimulationModal 
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
      />
      
      <CreatePositionModal 
        isOpen={createPositionModalOpen}
        onClose={() => setCreatePositionModalOpen(false)}
      />
      
      <SupportedPoolsModal 
        isOpen={supportedPoolsModalOpen}
        onClose={() => setSupportedPoolsModalOpen(false)}
      />
    </div>
  );
};

export default LPPage;