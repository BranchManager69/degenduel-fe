import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../toast/ToastContext";
import { mcp } from "../../services/api/mcp";
import { TokenDisplay } from "./TokenDisplay";
import { SetupInstructions } from "./SetupInstructions";

export const MCPTokenManagement: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { addToast } = useToast();

  // Load existing token on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const response = await mcp.getToken();
        if (response.success && response.mcp_token) {
          setToken(response.mcp_token);
        }
      } catch (error) {
        // Token doesn't exist yet, that's fine
        console.log("No existing token found");
      } finally {
        setInitialLoading(false);
      }
    };

    loadToken();
  }, []);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.getToken();
      if (response.success && response.mcp_token) {
        setToken(response.mcp_token);
        addToast("success", "MCP token generated successfully!");
      } else {
        addToast("error", response.message || "Failed to generate token");
      }
    } catch (error) {
      console.error("Error generating token:", error);
      addToast("error", "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const regenerateToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.regenerateToken();
      if (response.success && response.mcp_token) {
        setToken(response.mcp_token);
        addToast("success", "Token regenerated successfully! Previous token has been revoked.");
      } else {
        addToast("error", response.message || "Failed to regenerate token");
      }
    } catch (error) {
      console.error("Error regenerating token:", error);
      addToast("error", "Failed to regenerate token");
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.revokeToken();
      if (response.success) {
        setToken(null);
        addToast("success", "Token revoked successfully!");
      } else {
        addToast("error", response.message || "Failed to revoke token");
      }
    } catch (error) {
      console.error("Error revoking token:", error);
      addToast("error", "Failed to revoke token");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <motion.h2 
          className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🤖 AI Assistant Access
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
        </motion.h2>
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-4 sm:p-6 lg:p-8">
          <motion.div 
            className="flex items-center justify-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-slate-300 text-base sm:text-lg">Loading your AI connection...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4 sm:space-y-6 lg:space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h2 
        className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🤖 AI Assistant Access
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
      </motion.h2>

      <motion.div 
        className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-4 sm:p-6 lg:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.p 
          className="text-slate-300 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Generate secure tokens to connect AI assistants like{" "}
          <span className="text-cyan-400 font-semibold">Claude Desktop</span> and{" "}
          <span className="text-purple-400 font-semibold">Cursor</span> to your DegenDuel account.
          Unlock AI-powered trading insights, performance analysis, and market intelligence.
        </motion.p>

        <AnimatePresence mode="wait">
          {token ? (
            <motion.div
              key="token-display"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <TokenDisplay
                token={token}
                onRegenerate={regenerateToken}
                onRevoke={revokeToken}
                loading={loading}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="generate-token"
              className="text-center py-6 sm:py-8 lg:py-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎯
              </motion.div>
              <p className="text-slate-400 mb-6 sm:mb-8 text-base sm:text-lg">Ready to unlock AI-powered trading insights?</p>
              <motion.button
                onClick={generateToken}
                disabled={loading}
                className="relative px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg rounded-2xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2 sm:space-x-3">
                  {loading ? (
                    <>
                      <motion.div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Generating Magic...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Generate MCP Token</span>
                    </>
                  )}
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SetupInstructions token={token || undefined} />
      </motion.div>
    </motion.div>
  );
};