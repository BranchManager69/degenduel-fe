import { useWallet, WalletName } from "@aptos-labs/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useReferral } from "../../hooks/useReferral";

export const ReferralWelcomeModal: React.FC = () => {
  const { showWelcomeModal, setShowWelcomeModal, trackConversion } =
    useReferral();
  const { isFullyConnected, user } = useAuth();
  const { connect, wallet } = useWallet();

  // When user successfully connects and gets a profile, track conversion and close modal
  useEffect(() => {
    if (isFullyConnected() && user) {
      trackConversion().catch(console.error);
      setShowWelcomeModal(false);
      localStorage.setItem("has_seen_welcome", "true");
    }
  }, [isFullyConnected, user, setShowWelcomeModal, trackConversion]);

  const handleGetStarted = () => {
    if (!isFullyConnected()) {
      // Connect with default wallet if available
      if (wallet?.name) {
        connect(wallet.name as WalletName);
      } else {
        connect("Petra" as WalletName); // Default to Petra if no wallet selected
      }
    } else {
      setShowWelcomeModal(false);
    }
  };

  return (
    <AnimatePresence>
      {showWelcomeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowWelcomeModal(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-dark-200/90 backdrop-blur-sm border border-brand-400/20 rounded-lg p-6 max-w-lg w-full mx-4 space-y-4"
          >
            {/* Close button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ×
            </button>

            {/* Welcome Content */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600">
                Welcome to DegenDuel!
              </h2>

              <p className="text-gray-300">
                You've been invited to join the most exciting crypto portfolio
                battles on Solana.
              </p>

              <div className="bg-dark-300/50 rounded-lg p-4 space-y-2">
                <h3 className="text-lg font-semibold text-brand-400">
                  What is DegenDuel?
                </h3>
                <ul className="text-sm text-gray-400 space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span>
                      Battle other traders in head-to-head portfolio
                      competitions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span>
                      Build strategic portfolios from curated token selections
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span>
                      Win rewards based on your market insights and performance
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full relative group overflow-hidden"
                >
                  <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500">
                    <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                        <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                          {isFullyConnected()
                            ? "EXPLORE DUELS"
                            : "CONNECT WALLET TO START"}
                        </span>
                        <svg
                          className="w-6 h-6 text-emerald-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
