// src/pages/public/launchpad/LaunchpadPage.tsx

import React, { useEffect } from "react";
import { LaunchpadManager } from "../../../components/launchpad/LaunchpadManager";
import { resetToDefaultMeta } from "../../../utils/ogImageUtils";
import { motion } from "framer-motion";

/**
 * LaunchpadPage - Public-facing token launchpad interface
 * Allows users to create and manage token launches on Solana
 */
export const LaunchpadPage: React.FC = () => {

  // Set meta tags on mount
  useEffect(() => {
    document.title = "WIN TO LAUNCH | DegenDuel";
    resetToDefaultMeta();
  }, []);

  return (
    <div className="pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
              WIN TO LAUNCH
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Launch your token on Solana with Jupiter's Dynamic Bonding Curves. 
            Create fair launches with built-in liquidity and anti-snipe protection.
          </p>
        </motion.div>

        {/* Main Launchpad Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <LaunchpadManager />
        </motion.div>

        {/* Info Cards */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-8"
        >
          <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100">Fair Launch</h3>
            </div>
            <p className="text-sm text-gray-400">
              Dynamic bonding curves ensure fair price discovery and prevent early dumping
            </p>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.13-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100">Customizable</h3>
            </div>
            <p className="text-sm text-gray-400">
              Configure vesting schedules, anti-snipe protection, and migration parameters
            </p>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100">Jupiter Powered</h3>
            </div>
            <p className="text-sm text-gray-400">
              Built on Jupiter's proven infrastructure for reliable token launches
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};