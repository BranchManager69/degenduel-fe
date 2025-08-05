import React, { useState } from 'react';
import { config } from '../../config/config';

export const JupiterPromotion: React.FC = () => {
  const [showSteps, setShowSteps] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <h3 className="text-xl font-bold text-gray-100 mb-6">Free Contest Credit</h3>
      
      {/* Jupiter Special Promotion */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-xl p-4 border border-emerald-500/30 relative overflow-hidden hover:border-emerald-500/50 transition-all duration-200">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            {/* Left side - Title with Jupiter logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-black/40 backdrop-blur-sm border border-emerald-400/50 rounded-full p-1.5 shadow-lg">
                  <img
                    src="/assets/media/logos/jup.png"
                    alt="Jupiter"
                    className="w-full h-full object-contain opacity-90"
                  />
                </div>
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md" />
              </div>
              
              <h4 className="text-white font-bold text-base">
                Free Contest Credit
              </h4>
            </div>
            
            {/* Right side - Limited Time */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-300 font-semibold text-sm">Limited Time</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-300 text-sm leading-relaxed">
              Give DegenDuel a like on Jupiter to earn a free Contest Credit 🎉
            </p>
            
            {/* Expandable Steps Section */}
            <div className="mt-3">
              <button
                onClick={() => {
                  setShowSteps(!showSteps);
                  setAnimationKey(prev => prev + 1); // Force re-trigger animation
                }}
                className="w-full text-left flex items-center justify-between py-2 px-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-sm text-gray-300 hover:text-white hover:scale-[1.01]"
              >
                <span className="font-medium">How to get your free credit</span>
                <svg 
                  className={`w-4 h-4 transform transition-transform ${showSteps ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSteps && (
                <div className="mt-2 space-y-3 px-3 pb-3">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-white">Link X/Twitter to DegenDuel</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Connect your Twitter account in your profile settings
                      </p>
                    </div>
                  </div>
                  
                  {/* Step 2 with Jupiter screenshot */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="font-medium text-white">Like DUEL on Jupiter</span>
                      </p>
                      
                      {/* Jupiter Screenshot with Animated Zoom Focus */}
                      <div className="relative bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200">
                        <div className="relative overflow-hidden rounded-md">
                          <img 
                            key={animationKey} // Force re-render to restart animation
                            src="/assets/media/other/JLS.png"
                            alt="Jupiter Screenshot"
                            className={`w-full h-32 object-cover ${showSteps ? `zoom-to-bottom-left-${animationKey}` : ''}`}
                          />
                          
                          {/* Highlight overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-transparent to-transparent opacity-60" />
                          
                          {/* Animated pointer */}
                          <div className="absolute bottom-4 left-4">
                            <div className="relative">
                              <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-lg" />
                              <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-emerald-400 rounded-full animate-ping" />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          Click the ♡ Like button in the Community Metrics section
                        </p>
                      </div>
                      
                      {/* Dynamic CSS for zoom animation - updates every time */}
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          .zoom-to-bottom-left-${animationKey} {
                            animation: zoomToBottomLeft-${animationKey} 4s ease-in-out forwards;
                            transform-origin: 0% 100%; /* Bottom left corner */
                          }
                          
                          @keyframes zoomToBottomLeft-${animationKey} {
                            0% {
                              transform: scale(1);
                            }
                            100% {
                              transform: scale(6);
                            }
                          }
                        `
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => window.open(`https://jup.ag/tokens/${config.SOLANA.DEGEN_TOKEN_ADDRESS}`, '_blank')}
              className="group mt-3 w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-green-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-sm shadow-xl hover:shadow-emerald-500/30 hover:shadow-2xl flex items-center justify-center gap-3 border border-emerald-400/20 hover:border-emerald-300/40 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <div className="w-5 h-5 bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors">
                <img
                  src="/assets/media/logos/jup.png"
                  alt="Jupiter"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="tracking-wide">Like on Jupiter</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};