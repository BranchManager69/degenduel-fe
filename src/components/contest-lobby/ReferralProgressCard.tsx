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
  const progressPercentage = (progressToNext / 3) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-400/20 rounded-lg p-4 backdrop-blur-sm ${className}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-brand-300 font-semibold text-sm">Contest Credits</h3>
              <p className="text-xs text-gray-400">Earn by referring friends</p>
            </div>
          </div>
          <Link
            to="/referrals"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Credits Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-brand-300">
              {contestCredits}
            </div>
            <div className="text-xs text-gray-400">Available Credits</div>
          </div>
          {contestCredits > 0 && (
            <Link
              to="/contests/create"
              className="bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-xs px-3 py-1 rounded-lg transition-colors"
            >
              Use Credits
            </Link>
          )}
        </div>

        {/* Progress to Next Credit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Progress to next credit</span>
            <span className="text-brand-300 font-medium">
              {progressToNext}/3 qualified
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-dark-300/50 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-brand-500 to-brand-400 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-400/10">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-300">{totalReferrals}</div>
            <div className="text-xs text-gray-400">Total Invited</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-brand-300">{qualifiedReferrals}</div>
            <div className="text-xs text-gray-400">Qualified</div>
          </div>
        </div>

        {/* Pending Referrals (if any) */}
        {pendingReferrals > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <div className="text-xs font-medium text-yellow-300">
                  {pendingReferrals} Pending
                </div>
                <div className="text-xs text-yellow-400/80">
                  Friends joined, waiting for contest participation
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        {contestCredits === 0 && totalReferrals === 0 && (
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400 mb-2">
              Invite friends to earn contest credits!
            </p>
            <Link
              to="/referrals"
              className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              <span>Get Your Invite Link</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 