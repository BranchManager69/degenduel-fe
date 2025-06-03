import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MCPTokenManagement } from "../../../components/mcp/MCPTokenManagement";
import { MCPUserGuide } from "../../../components/mcp/MCPUserGuide";
import { useAuth } from "../../../contexts/UnifiedAuthContext";
import { getFeatureFlag } from "../../../config/featureFlags";

export const DegenDuelMCPPortal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const userGuideRef = useRef<HTMLDivElement>(null);
  const isMCPEnabled = getFeatureFlag('enableMCP');

  const scrollToSetup = (setupType: string) => {
    if (userGuideRef.current) {
      const setupSection = userGuideRef.current.querySelector('[data-setup-section]');
      if (setupSection) {
        setupSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        // Trigger the setup type selection after scroll
        setTimeout(() => {
          const event = new CustomEvent('selectSetup', { detail: setupType });
          window.dispatchEvent(event);
        }, 500);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative`}>
      {/* Coming Soon Overlay - Only show when MCP is disabled */}
      {!isMCPEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm overflow-y-auto"
        >
          <div className="min-h-screen flex items-center justify-center py-8 px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
              className="text-center max-w-md mx-auto"
            >
              <motion.div
                className="text-4xl sm:text-6xl mb-4"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🚧
              </motion.div>
              
              <motion.h1
                className="text-3xl sm:text-4xl font-black mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text">
                  COMING SOON
                </span>
              </motion.h1>
              
              <motion.p
                className="text-base sm:text-lg text-slate-300 mb-6 leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Connect AI assistants to your trading account for{" "}
                <span className="text-cyan-400 font-bold">real-time analysis</span> and{" "}
                <span className="text-purple-400 font-bold">automated strategies</span>.
              </motion.p>
              
              <motion.div
                className="space-y-3 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { icon: "🤖", text: "Claude Desktop" },
                  { icon: "💻", text: "Cursor IDE" },
                  { icon: "📊", text: "Portfolio Analysis" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-center space-x-3 p-3 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-slate-300 text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                className="text-xs text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Follow <span className="text-cyan-400">@degenduelme</span> for updates
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cyber-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="url(#grid-gradient)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cyber-grid)"/>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 sm:mb-8"
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            whileHover={{ scale: 1.02, x: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </motion.button>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text relative">
              MCP PORTAL
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse"></div>
          </motion.h1>
          
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Supercharge your DegenDuel trading with{" "}
            <span className="text-cyan-400 font-bold">AI-powered insights</span>,{" "}
            <span className="text-purple-400 font-bold">real-time analysis</span>, and{" "}
            <span className="text-pink-400 font-bold">automated strategies</span>
          </motion.p>

          {/* Feature Pills */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: "🤖", text: "Claude Desktop", color: "cyan", setupKey: "claude" },
              { icon: "💻", text: "Cursor IDE", color: "purple", setupKey: "cursor" },
              { icon: "🌊", text: "Windsurf", color: "pink", setupKey: "windsurf" },
              { icon: "🚀", text: "Any MCP Client", color: "yellow", setupKey: "claude" }
            ].map((pill, index) => (
              <motion.div
                key={index}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r ${
                  pill.color === 'cyan' ? 'from-cyan-500/20 to-cyan-600/10 border-cyan-400/30' :
                  pill.color === 'purple' ? 'from-purple-500/20 to-purple-600/10 border-purple-400/30' :
                  pill.color === 'pink' ? 'from-pink-500/20 to-pink-600/10 border-pink-400/30' :
                  'from-yellow-500/20 to-yellow-600/10 border-yellow-400/30'
                } border backdrop-blur-sm cursor-pointer`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSetup(pill.setupKey)}
              >
                <span className="text-base sm:text-lg mr-1 sm:mr-2">{pill.icon}</span>
                <span className="text-white font-medium text-sm sm:text-base">{pill.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {/* Token Management Section - Only show when MCP is enabled */}
          {isAuthenticated && isMCPEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 sm:p-6 md:p-8 lg:p-12">
                <MCPTokenManagement />
              </div>
            </motion.div>
          )}

          {/* Authentication Notice - Only show when MCP is enabled */}
          {!isAuthenticated && isMCPEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 sm:p-8 lg:p-12 text-center">
                <motion.div
                  className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔐
                </motion.div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
                  Connect Your Wallet to Unlock
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                  Generate your secure MCP token and connect AI assistants to your DegenDuel account. 
                  Your AI trading companion awaits!
                </p>
                <motion.div 
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-bold text-base sm:text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🚀</span>
                  Ready when you are!
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* User Guide Section - Only show when MCP is enabled */}
          {isMCPEnabled && (
            <motion.div
              ref={userGuideRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MCPUserGuide />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};