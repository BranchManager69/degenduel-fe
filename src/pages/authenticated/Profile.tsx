// src/pages/authenticated/Profile.tsx

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { AchievementsSection } from "../../components/achievements/AchievementsSection";
import { UserProgress } from "../../components/achievements/UserProgress";
import { ContestHistorySection } from "../../components/profile/ContestHistorySection";
import { ProfileHeaderSection } from "../../components/profile/ProfileHeaderSection";
import { UserStatsSection } from "../../components/profile/UserStatsSection";
import { useStore } from "../../store/useStore";

// Profile Page
export const Profile: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex h-[50vh] items-center justify-center"
      >
        <div className="text-center relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <h2 className="text-xl font-semibold text-gray-200 group-hover:animate-glitch">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-gray-400 group-hover:animate-cyber-pulse">
            Connect your wallet to view your profile
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Cosmic effects container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Solar flares */}
        <div className="absolute -top-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Star field */}
        <div
          className="absolute inset-0 animate-float"
          style={{ animationDuration: "15s" }}
        >
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[15%] left-[35%] animate-sparkle"
            style={{ animationDelay: "-2s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[45%] left-[75%] animate-sparkle"
            style={{ animationDelay: "-1s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/20 rounded-full top-[65%] left-[25%] animate-sparkle"
            style={{ animationDelay: "-3s" }}
          />
          <div
            className="absolute h-1 w-1 bg-white/30 rounded-full top-[85%] left-[65%] animate-sparkle"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        {/* Energy waves */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"
            style={{ animationDuration: "10s" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-vertical opacity-20"
            style={{ animationDuration: "15s" }}
          />
        </div>
      </div>

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

          {/* User Progress Section */}
          <motion.div
            key="user-progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <UserProgress />
          </motion.div>

          {/* User Stats Section */}
          <motion.div
            key="user-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <UserStatsSection />
          </motion.div>

          {/* Two Column Layout for Achievements and History */}
          <motion.div
            key="columns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
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
  );
};
