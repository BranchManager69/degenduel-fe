import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { config } from "../../config/config";

interface ReferralProgressCardProps {
  className?: string;
}

export const ReferralProgressCard: React.FC<ReferralProgressCardProps> = ({
  className = ""
}) => {
  const { user, isAuthenticated } = useMigratedAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get referral data from user object with safe fallbacks for different schema formats
  const contestCredits = (user as any)?.contestCredits || (user as any)?.contest_credits || 0;
  const pendingReferrals = (user as any)?.pendingReferrals || (user as any)?.pending_referrals || 0;
  const totalReferrals = (user as any)?.totalReferrals || (user as any)?.total_referrals || 0;
  const qualifiedReferrals = (user as any)?.qualifiedReferrals || (user as any)?.qualified_referrals || 0;

  // Calculate progress to next credit (3 qualifications = 1 credit)
  const progressToNext = qualifiedReferrals % 3;
  
  // Generate referral link (assuming user has a referral_code field)
  const userReferralCode = (user as any)?.referral_code || (user as any)?.wallet_address?.slice(0, 8).toUpperCase();
  const referralLink = `${window.location.origin}?ref=${userReferralCode}`;
  
  // Copy functionality
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className={`space-y-6 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300 ${className}`}>
      <h3 className="text-xl font-bold text-gray-100">Contest Credits</h3>
      
      {/* Simple credit display */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-400">{contestCredits}</span>
            <span className="text-sm text-gray-400">credits available</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Invite friends to earn more credits
          </p>
        </div>
        {contestCredits > 0 && (
          <Link
            to="/contests/create"
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Create Contest
          </Link>
        )}
      </div>

      {/* Clean progress indicator */}
      {progressToNext > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress to next credit</span>
            <span className="text-brand-300">{progressToNext}/3</span>
          </div>
          <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-400 transition-all duration-500"
              style={{ width: `${(progressToNext / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Referral Link Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Your Referral Link</span>
          <Link to="/referrals" className="text-xs text-brand-400 hover:text-brand-300">
            View Details →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-dark-400/50 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono truncate">
            {referralLink}
          </div>
          <button
            onClick={copyReferralLink}
            className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Minimal stats */}
      <div className="flex items-center justify-around text-center">
        <div>
          <div className="text-lg font-semibold text-gray-300">{totalReferrals}</div>
          <div className="text-xs text-gray-500">Invited</div>
        </div>
        <div className="w-px h-8 bg-dark-400" />
        <div>
          <div className="text-lg font-semibold text-gray-300">{pendingReferrals}</div>
          <div className="text-xs text-gray-500">Joined</div>
        </div>
        <div className="w-px h-8 bg-dark-400" />
        <div>
          <div className="text-lg font-semibold text-brand-300">{qualifiedReferrals}</div>
          <div className="text-xs text-gray-500">Qualified</div>
        </div>
      </div>

      {/* Jupiter Special Promotion */}
      <div className="border-t border-dark-400 pt-4">
        <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-lg p-4 border border-emerald-500/30 relative overflow-hidden">
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
                  className="w-full text-left flex items-center justify-between py-2 px-3 bg-dark-400/30 hover:bg-dark-400/50 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
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
                        <div className="relative bg-dark-400/50 rounded-lg p-3 border border-emerald-500/20">
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
                className="group mt-3 w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-green-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-sm shadow-xl hover:shadow-emerald-500/30 hover:shadow-2xl flex items-center justify-center gap-3 border border-emerald-400/20 hover:border-emerald-300/40 hover:scale-[1.02] active:scale-[0.98]"
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
    </div>
  );
};