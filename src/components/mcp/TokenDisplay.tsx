import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../toast/ToastContext";

interface TokenDisplayProps {
  token: string;
  onRegenerate: () => void;
  onRevoke: () => void;
  loading: boolean;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  token,
  onRegenerate,
  onRevoke,
  loading,
}) => {
  const [showFullToken, setShowFullToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("success", "Token copied to clipboard!");
    } catch (error) {
      addToast("error", "Failed to copy token");
    }
  };

  const handleRegenerate = () => {
    if (confirm("Are you sure you want to regenerate your token? This will invalidate your current token.")) {
      onRegenerate();
    }
  };

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke your token? This will prevent AI assistants from accessing your data.")) {
      onRevoke();
    }
  };

  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
      <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔑
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 text-transparent bg-clip-text">
            Your MCP Token
          </h3>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div 
            className="bg-slate-900/80 rounded-xl p-6 border border-slate-600/50 relative overflow-hidden group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="font-mono text-lg text-slate-200 break-all flex-1 mr-4">
                <AnimatePresence mode="wait">
                  {showFullToken ? (
                    <motion.span
                      key="full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {token}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="masked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {maskedToken}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                onClick={() => setShowFullToken(!showFullToken)}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-cyan-400 rounded-lg border border-cyan-400/30 text-sm font-medium transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showFullToken ? "👁️‍🗨️ Hide" : "👁️ Show"}
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={copyToClipboard}
              disabled={loading}
              className="relative px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      ✅
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      📋
                    </motion.span>
                  )}
                </AnimatePresence>
                <span>{copied ? "Copied!" : "Copy Token"}</span>
              </div>
            </motion.button>
            
            <motion.button
              onClick={handleRegenerate}
              disabled={loading}
              className="relative px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Regenerate</span>
                  </>
                )}
              </div>
            </motion.button>
            
            <motion.button
              onClick={handleRevoke}
              disabled={loading}
              className="relative px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Revoke</span>
                  </>
                )}
              </div>
            </motion.button>
          </motion.div>

          <motion.div 
            className="bg-slate-900/50 rounded-xl p-6 border border-slate-600/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>🛡️</span>
              Security Info
            </h4>
            <div className="space-y-3 text-slate-400">
              {[
                { icon: "⏰", text: "This token expires in 1 year" },
                { icon: "🔒", text: "Keep this token secure and don't share it publicly" },
                { icon: "🔄", text: "Regenerating will invalidate the previous token" },
                { icon: "🤖", text: "AI assistants use this to access your DegenDuel data" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};