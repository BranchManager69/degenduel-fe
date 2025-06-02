// src/pages/authenticated/Profile.tsx

/**
 * This page is used to display a private profile.
 * 
 * It looks great! Just a few minor touch-ups needed.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import { motion } from "framer-motion";
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
import { MCPTokenManagement } from "../../components/mcp/MCPTokenManagement";
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
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Profile Page */}
        <div className="relative space-y-6">
          {/* Profile Header Section */}
          <ProfileHeaderSection />

          {/* Degen Level Progress */}
          <UserProgress />

          {/* Lifetime User Stats */}
          <UserStatsSection />
          
          {/* Contest Credits */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-300">Contest Credits</h2>
            <div className="bg-dark-200/30 rounded-lg border border-brand-500/20 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Create Your Own Contests</h3>
                  <p className="text-gray-400 text-sm">
                    Purchase credits to create custom contests. Each contest creation requires one credit.
                  </p>
                </div>
                <Link to="/contest-credits" className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center whitespace-nowrap">
                  <span>Manage Credits</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Social Accounts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-300">Social Accounts</h2>
            <SocialAccountsPanel />
          </div>

          {/* AI Assistant Access */}
          <div className="space-y-4">
            <MCPTokenManagement />
          </div>

          {/* Achievements & Contest History Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements Column */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brand-300">Achievements</h2>
              <AchievementsSection />
            </div>

            {/* Contest History Column */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brand-300">Contest History</h2>
              <ContestHistorySection />
            </div>
          </div>
          
          {/* Admin Wallet Monitoring */}
          {user?.wallet_address && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brand-300">Wallet Monitoring</h2>
              <UserProfileExtras 
                walletAddress={user.wallet_address}
                nickname={user.nickname || undefined}
                showWalletSelector={true}
                compareMode={true}
              />
            </div>
          )}
          
          {/* Auth Debug Panel */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-300">Auth Debug</h2>
            <AuthDebugPanel position="floating" />
          </div>
        </div>

      </motion.div>
    </div>

  );
};
