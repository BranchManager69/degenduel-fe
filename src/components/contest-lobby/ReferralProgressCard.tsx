import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

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
  const creditsFromReferrals = Math.floor(qualifiedReferrals / 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-400/20 rounded-lg p-4 backdrop-blur-sm ${className}`}
    >
      <div className="space-y-4">
        {/* Header with Better Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500/30 to-brand-600/30 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {/* Animated Badge for Credits */}
              {contestCredits > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                >
                  {contestCredits}
                </motion.div>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Contest Credits</h3>
              <p className="text-xs text-gray-400">Create your own contests & duels!</p>
            </div>
          </div>
        </div>

        {/* Main Value Proposition */}
        <div className="bg-gradient-to-r from-brand-500/20 to-brand-600/20 rounded-lg p-4 border border-brand-400/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{contestCredits}</span>
                <span className="text-sm text-gray-400">credits</span>
              </div>
              <p className="text-xs text-brand-300 mt-1">
                Create {contestCredits} public contest{contestCredits !== 1 ? 's' : ''} or duel{contestCredits !== 1 ? 's' : ''}!
              </p>
            </div>
            {contestCredits > 0 && (
              <Link
                to="/contests/create"
                className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white text-sm px-4 py-2 rounded-lg transition-all font-medium shadow-lg"
              >
                Create Contest
              </Link>
            )}
          </div>
        </div>

        {/* Progress with Clear Explanation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Next Contest Credit</span>
            <span className="text-sm text-brand-300 font-bold">
              {3 - progressToNext} more friend{3 - progressToNext !== 1 ? 's' : ''} needed
            </span>
          </div>
          
          {/* Visual Progress */}
          <div className="relative">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1">
                  <div className={`h-3 rounded-full transition-all duration-500 ${
                    step <= progressToNext 
                      ? 'bg-gradient-to-r from-brand-400 to-brand-500' 
                      : 'bg-dark-400'
                  }`} />
                </div>
              ))}
            </div>
            {/* Progress Labels */}
            <div className="flex items-center justify-between mt-1">
              {[1, 2, 3].map((step) => (
                <div key={step} className="text-center flex-1">
                  <span className={`text-xs ${step <= progressToNext ? 'text-brand-300' : 'text-gray-500'}`}>
                    {step === 3 ? '🎉' : step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clear Explanation */}
          <div className="bg-dark-400/30 rounded-lg p-3 border border-dark-300">
            <p className="text-xs text-gray-300 leading-relaxed">
              <span className="font-medium text-brand-300">How it works:</span> When 3 friends you invite join AND play in any contest, you get 1 contest credit to create your own contest!
            </p>
          </div>
        </div>

        {/* Stats with Better Labels */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-brand-400/10">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{totalReferrals}</div>
            <div className="text-xs text-gray-400">Invited</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">{pendingReferrals}</div>
            <div className="text-xs text-gray-400">Joined</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">{qualifiedReferrals}</div>
            <div className="text-xs text-gray-400">Played</div>
          </div>
        </div>

        {/* Clear Status Messages */}
        {pendingReferrals > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <div className="animate-pulse">
                <svg className="h-4 w-4 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-300 mb-1">
                  {pendingReferrals} friend{pendingReferrals !== 1 ? 's' : ''} ready to qualify!
                </div>
                <div className="text-xs text-yellow-400/80">
                  They've joined - once they play their first contest, you'll earn a contest credit!
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Compelling CTA */}
        <div className="bg-gradient-to-r from-dark-300/50 to-dark-400/50 rounded-lg p-4 text-center border border-brand-400/20">
          <p className="text-sm text-white font-medium mb-2">
            {contestCredits === 0 
              ? "Start earning contest credits!" 
              : `You've earned ${creditsFromReferrals} contest credit${creditsFromReferrals !== 1 ? 's' : ''} so far!`}
          </p>
          <Link
            to="/referrals"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white px-5 py-2.5 rounded-lg transition-all font-medium group"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Shill Your Ref Link</span>
            <svg className="h-3 w-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}; 