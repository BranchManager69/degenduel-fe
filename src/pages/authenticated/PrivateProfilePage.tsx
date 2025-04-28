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

import { AchievementsSection } from "../../components/achievements/AchievementsSection";
import { UserProgress } from "../../components/achievements/UserProgress";
import SimpleAvatar from "../../components/character-avatars";
import { ContestHistorySection } from "../../components/profile/contest-history/ContestHistorySection";
import { ProfileHeaderSection } from "../../components/profile/profile-header/ProfileHeaderSection";
import SocialAccountsPanel from "../../components/profile/SocialAccountsPanel";
import { UserStatsSection } from "../../components/profile/user-stats/UserStatsSection";
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
              
              {/* Character Avatars Section */}
              <div className="mt-8 space-y-4">
                <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
                  Character Avatars
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
                </h2>
                
                <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden border border-brand-500/20">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Your Personas</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          type="degen"
                          name="degen"
                          size={80}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-sm font-semibold">Degen</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          type="trader"
                          name="trader"
                          size={80}
                          animate={true}
                          colorScheme="blue"
                        />
                        <span className="mt-2 text-center text-sm font-semibold">Trader</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          type="winner"
                          name="winner"
                          size={80}
                          animate={true}
                          colorScheme="green"
                        />
                        <span className="mt-2 text-center text-sm font-semibold">Winner</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          type="loser"
                          name="loser"
                          size={80}
                          animate={true}
                          colorScheme="red"
                        />
                        <span className="mt-2 text-center text-sm font-semibold">Loser</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          type="admin"
                          name="admin"
                          size={80}
                          animate={true}
                          colorScheme="orange"
                        />
                        <span className="mt-2 text-center text-sm font-semibold">Admin</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mt-8 mb-4">Degen Companions</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          name="cryptoking"
                          size={64}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-xs">cryptoking</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          name="hodlqueen"
                          size={64}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-xs">hodlqueen</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          name="moonboy"
                          size={64}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-xs">moonboy</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          name="diamondhands"
                          size={64}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-xs">diamondhands</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <SimpleAvatar 
                          name="laserbull" 
                          size={64}
                          animate={true}
                        />
                        <span className="mt-2 text-center text-xs">laserbull</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </div>

  );
};
