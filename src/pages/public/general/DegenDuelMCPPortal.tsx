import React, { useRef } from "react";
import { motion } from "framer-motion";
import { MCPTokenManagement } from "../../../components/mcp/MCPTokenManagement";
import { MCPUserGuide } from "../../../components/mcp/MCPUserGuide";
import { useAuth } from "../../../contexts/UnifiedAuthContext";

export const DegenDuelMCPPortal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const userGuideRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
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
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 relative"
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
            className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-8 leading-relaxed"
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
            className="flex flex-wrap justify-center gap-4 mb-12"
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
                className={`px-6 py-3 rounded-full bg-gradient-to-r ${
                  pill.color === 'cyan' ? 'from-cyan-500/20 to-cyan-600/10 border-cyan-400/30' :
                  pill.color === 'purple' ? 'from-purple-500/20 to-purple-600/10 border-purple-400/30' :
                  pill.color === 'pink' ? 'from-pink-500/20 to-pink-600/10 border-pink-400/30' :
                  'from-yellow-500/20 to-yellow-600/10 border-yellow-400/30'
                } border backdrop-blur-sm cursor-pointer`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSetup(pill.setupKey)}
              >
                <span className="text-lg mr-2">{pill.icon}</span>
                <span className="text-white font-medium">{pill.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="space-y-16">
          {/* Token Management Section */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 md:p-12">
                <MCPTokenManagement />
              </div>
            </motion.div>
          )}

          {/* Authentication Notice */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔐
                </motion.div>
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
                  Connect Your Wallet to Unlock
                </h2>
                <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Generate your secure MCP token and connect AI assistants to your DegenDuel account. 
                  Your AI trading companion awaits!
                </p>
                <motion.div 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🚀</span>
                  Ready when you are!
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* User Guide Section */}
          <motion.div
            ref={userGuideRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MCPUserGuide />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};