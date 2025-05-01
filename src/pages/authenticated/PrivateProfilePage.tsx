// src/pages/authenticated/Profile.tsx

/**
 * This page is used to display a private profile.
 * 
 * It looks great! Just a few minor touch-ups needed.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";

import { AchievementsSection } from "../../components/achievements/AchievementsSection";
import { UserProgress } from "../../components/achievements/UserProgress";
import { ContestHistorySection } from "../../components/profile/contest-history/ContestHistorySection";
import { ProfileHeaderSection } from "../../components/profile/profile-header/ProfileHeaderSection";
import SocialAccountsPanel from "../../components/profile/SocialAccountsPanel";
import { UserStatsSection } from "../../components/profile/user-stats/UserStatsSection";
import UserProfileExtras from "../../components/UserProfileExtras";
import { AuthDebugPanel } from "../../components/debug";
import { useStore } from "../../store/useStore";

// Private Profile Page
export const PrivateProfilePage: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex h-[50vh] items-center justify-center"
        >
          <div className="text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <h2 className="text-xl font-semibold text-gray-200 group-hover:animate-glitch">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-gray-400 group-hover:animate-cyber-pulse">
              Connect your wallet to view your private profile
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile Page
  return (
    <div className="flex flex-col min-h-screen">

      {/* Content Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Profile Page */}
        <div className="relative space-y-8">
          <AnimatePresence mode="wait">

            {/* User Data Section */}
            <motion.div
              key="user-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Profile Header Section */}
              <ProfileHeaderSection />
            </motion.div>

            {/* Degen Level Progress */}
            <motion.div
              key="user-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserProgress />
            </motion.div>

            {/* Lifetime User Stats */}
            <motion.div
              key="user-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserStatsSection />
            </motion.div>
            
            {/* Contest Credits */}
            <motion.div
              key="contest-credits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                Contest Credits
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
              </h2>
              
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden border border-brand-500/20">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Create Your Own Contests</h3>
                      <p className="text-gray-400 max-w-xl">
                        Purchase credits to create custom contests that are available to all users.
                        Each contest creation requires one credit.
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Link to="/contest-credits" className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-full transition-colors flex items-center">
                        <span>Manage Credits</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Accounts */}
            <motion.div
              key="social-accounts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >

              {/* Social Accounts */}
              <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                Social Accounts
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
              </h2>

              {/* Social Accounts Panel */}
              <SocialAccountsPanel />

            </motion.div>

            {/* Achievements & Contest History (2 columns) */}
            <motion.div
              key="columns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 gap-8"
            >
              {/* Achievements Column */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                  Achievements
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
                </h2>
                <AchievementsSection />
              </div>

              {/* Contest History Column */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                  Contest History
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
                </h2>
                <ContestHistorySection />
              </div>
              
              {/* Admin Wallet Monitoring */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                  Wallet Monitoring
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
                </h2>
                {user?.wallet_address && (
                  <UserProfileExtras 
                    walletAddress={user.wallet_address}
                    nickname={user.nickname || undefined}
                    showWalletSelector={true}
                    compareMode={true}
                  />
                )}
              </div>
              
              {/* Auth Debug Panel */}
              <div className="space-y-4 mt-8">
                <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                  Auth Debug
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
                </h2>
                <AuthDebugPanel position="floating" showByDefault={true} />
              </div>
              
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </div>

  );
};
