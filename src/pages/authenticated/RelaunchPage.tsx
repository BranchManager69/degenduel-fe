import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import NanoLogo from '../../components/logo/NanoLogo';
import { useWallet } from '../../hooks/websocket/topic-hooks/useWallet';

/**
 * Relaunch Page Component
 * 
 * Handles the token relaunch with 1-to-1 exchange
 * Two audiences: existing holders (exchange) and future holders (information)
 * 
 * @created 2025-07-31
 */

const RelaunchPage: React.FC = () => {
  const { user } = useStore();
  const isLoggedIn = !!user?.wallet_address;
  const [activeTab, setActiveTab] = useState<'exchange' | 'information'>('exchange');
  
  // Get real-time wallet data including DUEL balance
  const { getTokenBalance, isLoading: walletLoading, refreshWallet } = useWallet();
  const userDuelBalance = getTokenBalance('DUEL');
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="scale-100 sm:scale-125 md:scale-150">
            <NanoLogo />
          </div>
          <span className="whitespace-nowrap">Token Relaunch</span>
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
            GRAND OPENING
          </span>
        </h2>
      </div>
      
      {/* Introduction Section */}
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg max-w-3xl mx-auto">
          [Introduction text placeholder - explain the relaunch purpose and process]
        </p>
      </div>
      
      {/* Tab Selector */}
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
            Existing Holders
          </button>
          <button
            onClick={() => setActiveTab('information')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'information'
                ? 'bg-brand-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
            }`}
          >
            Learn More
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'exchange' ? (
        <div>
          {isLoggedIn ? (
            <>
              {/* Balance Display */}
              <div className="mb-8 text-center">
                <p className="text-gray-400 mb-2">Your Current Balance</p>
                <div className="flex items-center justify-center gap-2">
                  {walletLoading ? (
                    <div className="animate-pulse flex items-center gap-2">
                      <div className="h-8 w-32 bg-gray-700/50 rounded"></div>
                      <span className="text-xl text-gray-400">DUEL</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-white">
                        {userDuelBalance.toLocaleString()}
                      </span>
                      <span className="text-xl text-gray-400">DUEL</span>
                    </>
                  )}
                </div>
                {/* Refresh Button */}
                <button
                  onClick={refreshWallet}
                  disabled={walletLoading}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-400 disabled:opacity-50 
                    flex items-center justify-center gap-1 mx-auto transition-colors"
                  title="Refresh balance"
                >
                  <span className={`inline-block ${walletLoading ? 'animate-spin' : ''}`}>↻</span>
                  {walletLoading ? 'Refreshing...' : 'Refresh Balance'}
                </button>
              </div>

              {/* Exchange Component */}
              <div className="max-w-2xl mx-auto">
                {/* Exchange Button */}
                <div className="flex justify-center mb-6">
                  <button
                    disabled={walletLoading || userDuelBalance === 0}
                    className={`px-8 py-4 font-bold rounded-lg transition-all duration-300 transform
                      flex items-center justify-center gap-2 relative overflow-hidden ${
                        walletLoading || userDuelBalance === 0
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 via-brand-500 to-cyan-500 hover:from-purple-500 hover:via-brand-400 hover:to-cyan-400 text-white hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 animate-pulse'
                      }`}
                    style={walletLoading || userDuelBalance === 0 ? {} : {
                      boxShadow: '0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(20, 241, 149, 0.2)',
                      textShadow: '0 0 10px rgba(255,255,255,0.5)'
                    }}
                  >
                  {walletLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span>Loading...</span>
                    </>
                  ) : userDuelBalance === 0 ? (
                    <span>No DUEL Tokens to Exchange</span>
                  ) : (
                    <>
                      <span>Exchange All Tokens</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
                </div>

                {/* Exchange Details */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-6 text-center">
                      <div className="flex-1 max-w-32">
                        <p className="text-gray-500 text-sm mb-1">You Send</p>
                        {walletLoading ? (
                          <div className="animate-pulse h-6 w-20 bg-gray-700/50 rounded mx-auto"></div>
                        ) : (
                          <p className="text-white font-semibold">{userDuelBalance.toLocaleString()} DUEL</p>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div className="flex-1 max-w-32">
                        <p className="text-gray-500 text-sm mb-1">You Receive</p>
                        {walletLoading ? (
                          <div className="animate-pulse h-6 w-20 bg-gray-700/50 rounded mx-auto"></div>
                        ) : (
                          <p className="text-green-400 font-semibold">{userDuelBalance.toLocaleString()} DUEL</p>
                        )}
                      </div>
                    </div>
                  </div>
                
                {/* Info Text */}
                <p className="text-gray-500 text-xs text-center mt-4">
                  This will send all your DUEL tokens to the airdrop exchange collection address
                </p>
              </div>
              
              {/* Additional Info for Logged In Users */}
              <div className="mt-12 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-4">What Happens Next?</h3>
                <div className="space-y-4 text-gray-400">
                  <p>[Placeholder for explaining the exchange process]</p>
                  <p>[Placeholder for timeline and expectations]</p>
                  <p>[Placeholder for benefits of the new token]</p>
                </div>
              </div>
            </>
          ) : (
            /* Not Logged In State */
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Login to Exchange Your Tokens
                </h3>
                <p className="text-gray-400 mb-6">
                  Connect your wallet to see your DUEL balance and exchange for the new token
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white 
                    bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                    rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25"
                >
                  Login to Exchange
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Information Tab */
        <div className="max-w-4xl mx-auto">
          {/* Article-style content */}
          <article className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-bold text-white mb-6">The DegenDuel Relaunch Story</h3>
            
            {/* Section 1 */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">What Happened?</h4>
              <p className="text-gray-400 mb-4">
                [Placeholder for explaining what led to the relaunch]
              </p>
              <div className="bg-dark-200/40 rounded-lg p-4 my-4">
                <p className="text-sm text-gray-500">
                  [Placeholder for key facts or timeline]
                </p>
              </div>
            </section>
            
            {/* Section 2 */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">Why Relaunch?</h4>
              <p className="text-gray-400 mb-4">
                [Placeholder for explaining the benefits and reasons]
              </p>
              {/* Placeholder for image */}
              <div className="bg-dark-300/30 rounded-lg h-48 flex items-center justify-center my-4">
                <span className="text-gray-600">[Image placeholder]</span>
              </div>
            </section>
            
            {/* Section 3 */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">The New Token</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-200/40 rounded-lg p-6">
                  <h5 className="font-semibold text-white mb-2">Old DUEL</h5>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>[Placeholder for old token details]</li>
                    <li>[Placeholder for issues]</li>
                    <li>[Placeholder for limitations]</li>
                  </ul>
                </div>
                <div className="bg-dark-200/40 rounded-lg p-6">
                  <h5 className="font-semibold text-white mb-2">New Token</h5>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li>[Placeholder for new token features]</li>
                    <li>[Placeholder for improvements]</li>
                    <li>[Placeholder for benefits]</li>
                  </ul>
                </div>
              </div>
            </section>
            
            {/* Section 4 */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">Community & Safety</h4>
              <p className="text-gray-400 mb-4">
                [Placeholder for explaining why it's safe and community-focused]
              </p>
              <blockquote className="border-l-4 border-brand-500 pl-4 my-4">
                <p className="text-gray-300 italic">
                  "[Placeholder for community quote or testimonial]"
                </p>
              </blockquote>
            </section>
            
            {/* FAQ Section */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h4>
              <div className="space-y-4">
                <div className="bg-dark-200/40 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">When does the exchange period end?</h5>
                  <p className="text-gray-400 text-sm">[Placeholder answer]</p>
                </div>
                <div className="bg-dark-200/40 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">What if I miss the exchange window?</h5>
                  <p className="text-gray-400 text-sm">[Placeholder answer]</p>
                </div>
                <div className="bg-dark-200/40 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Is this a taxable event?</h5>
                  <p className="text-gray-400 text-sm">[Placeholder answer]</p>
                </div>
              </div>
            </section>
          </article>
        </div>
      )}
    </div>
  );
};

export default RelaunchPage;