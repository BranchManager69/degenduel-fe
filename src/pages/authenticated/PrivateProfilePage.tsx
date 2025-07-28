// src/pages/authenticated/Profile.tsx

/**
 * This page is used to display a private profile.
 * 
 * Beautiful redesigned profile page with modern glass morphism and animations.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import { motion } from "framer-motion";
import React, { useState } from "react";

import { AchievementsSection } from "../../components/achievements/AchievementsSection";
import { MCPTokenManagement } from "../../components/mcp/MCPTokenManagement";
import { ContestHistorySection } from "../../components/profile/contest-history/ContestHistorySection";
import { ProfileHeaderSection } from "../../components/profile/profile-header/ProfileHeaderSection";
import SocialAccountsPanel from "../../components/profile/SocialAccountsPanel";
import { useStore } from "../../store/useStore";

// Container animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

// AI Assistant Collapsible Component
const AIAssistantCollapsible: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-900/60 border border-gray-700/30 rounded-2xl shadow-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-7 h-7 bg-indigo-600/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            AI Assistant Access
          </h2>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm mt-2">Access AI tools and token management</p>
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-700/30"
        >
          <MCPTokenManagement />
        </motion.div>
      )}
    </div>
  );
};

// Private Profile Page
export const PrivateProfilePage: React.FC = () => {
  const { user } = useStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_70%)]"></div>
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-md mx-auto p-8"
        >
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-purple-500/20">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Connect your wallet to view your private profile and access all features
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 relative">
      {/* Refined background - much more subtle */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.03),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.03),transparent_50%)]"></div>
        
        {/* Very subtle grid - barely visible */}
        <div className="absolute inset-0 opacity-[0.008]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}></div>
      </div>

      {/* Content Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="space-y-10">
          {/* Profile Header Section - Hero treatment */}
          <motion.div variants={itemVariants} className="relative">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-3xl overflow-hidden shadow-2xl">
              <ProfileHeaderSection />
            </div>
          </motion.div>


          {/* Social Accounts - Full width */}
          <motion.div variants={itemVariants}>
            <div className="bg-gray-900/60 border border-gray-700/30 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                Social Accounts
              </h2>
              <SocialAccountsPanel />
            </div>
          </motion.div>


          {/* Two Column Layout - Professional spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Achievements */}
              <motion.div variants={itemVariants}>
                <div className="bg-gray-900/60 border border-gray-700/30 rounded-2xl p-6 shadow-xl h-full">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-7 h-7 bg-yellow-600/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    Achievements
                  </h2>
                  <AchievementsSection />
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Contest History */}
              <motion.div variants={itemVariants}>
                <div className="bg-gray-900/60 border border-gray-700/30 rounded-2xl p-6 shadow-xl h-full">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-7 h-7 bg-purple-600/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    Contest History
                  </h2>
                  <ContestHistorySection />
                </div>
              </motion.div>

              {/* AI Assistant Access - Collapsible */}
              <motion.div variants={itemVariants}>
                <AIAssistantCollapsible />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
