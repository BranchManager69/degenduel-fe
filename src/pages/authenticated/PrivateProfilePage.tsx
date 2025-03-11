// src/pages/authenticated/Profile.tsx

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { AchievementsSection } from "../../components/achievements/AchievementsSection";
import { UserProgress } from "../../components/achievements/UserProgress";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { ContestHistorySection } from "../../components/profile/contest-history/ContestHistorySection";
import { ProfileHeaderSection } from "../../components/profile/profile-header/ProfileHeaderSection";
import SocialAccountsPanel from "../../components/profile/SocialAccountsPanel";
import { UserStatsSection } from "../../components/profile/user-stats/UserStatsSection";
import { useStore } from "../../store/useStore";

// Profile Page
export const Profile: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <BackgroundEffects />
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

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="relative space-y-8">
          <AnimatePresence mode="wait">
            {/* User Data Section */}
            <motion.div
              key="user-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProfileHeaderSection />
            </motion.div>

            {/* User Leveling Progress Section */}
            <motion.div
              key="user-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserProgress />
            </motion.div>

            {/* Lifetime User Stats Section */}
            <motion.div
              key="user-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserStatsSection />
            </motion.div>

            {/* Social Accounts Panel */}
            <motion.div
              key="social-accounts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                Social Accounts
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
              </h2>
              <SocialAccountsPanel />
            </motion.div>
            
            {/* Two Column Layout for Achievements and History */}
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
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
