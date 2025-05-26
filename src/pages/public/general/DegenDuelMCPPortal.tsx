import React from "react";
import { motion } from "framer-motion";
import { MCPTokenManagement } from "../../../components/mcp/MCPTokenManagement";
import { MCPUserGuide } from "../../../components/mcp/MCPUserGuide";
import { useAuth } from "../../../contexts/UnifiedAuthContext";

export const DegenDuelMCPPortal: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="space-y-12">
          {/* Token Management Section (only for authenticated users) */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-100/50 backdrop-blur-sm rounded-lg border border-brand-500/30 p-8"
            >
              <MCPTokenManagement />
            </motion.div>
          )}

          {/* Authentication Notice for Non-Authenticated Users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-500/30 p-8 text-center"
            >
              <h2 className="text-2xl font-bold mb-4 text-blue-300">Connect Your Wallet to Get Started</h2>
              <p className="text-blue-200 mb-6">
                To generate your secure MCP token and connect AI assistants to your DegenDuel account, 
                you'll need to connect your wallet first.
              </p>
              <div className="text-sm text-blue-300">
                Once connected, you'll be able to generate tokens and access all the AI features below.
              </div>
            </motion.div>
          )}

          {/* User Guide Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MCPUserGuide />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};