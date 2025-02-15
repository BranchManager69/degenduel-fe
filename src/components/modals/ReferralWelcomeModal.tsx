import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useReferral } from "../../hooks/useReferral";
import { useStore } from "../../store/useStore";

export const ReferralWelcomeModal: React.FC = () => {
  const {
    showWelcomeModal,
    setShowWelcomeModal,
    trackConversion,
    referralCode,
  } = useReferral();
  const { isFullyConnected, user } = useAuth();
  const { connectWallet, isConnecting } = useStore();

  // When user successfully connects and gets a profile, track conversion and close modal
  useEffect(() => {
    if (isFullyConnected() && user && referralCode) {
      trackConversion().catch(console.error);
      setShowWelcomeModal(false);
      localStorage.setItem("has_seen_welcome", "true");
    }
  }, [
    isFullyConnected,
    user,
    referralCode,
    setShowWelcomeModal,
    trackConversion,
  ]);

  const handleGetStarted = () => {
    if (!isFullyConnected()) {
      // Connect wallet using store's connectWallet
      connectWallet().catch(console.error);
    } else {
      setShowWelcomeModal(false);
    }
  };

  return (
    <AnimatePresence>
      {showWelcomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowWelcomeModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-dark-200/95 backdrop-blur-sm rounded-lg max-w-lg w-full p-6 border border-brand-400/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Welcome to DegenDuel.
                </h2>
                <p className="text-gray-400">
                  You've been invited to join the ultimate crypto portfolio
                  battle arena. Connect your wallet to start your journey and
                  claim your rewards.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-brand-400 font-bold mb-2">
                    🏆 Compete & Win
                  </h3>
                  <p className="text-sm text-gray-400">
                    Battle other traders in portfolio competitions
                  </p>
                </div>
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-brand-400 font-bold mb-2">
                    💰 Earn Rewards
                  </h3>
                  <p className="text-sm text-gray-400">
                    Win prizes and climb the leaderboards
                  </p>
                </div>
              </div>

              {/* Get Started Button */}
              <div className="pt-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full relative group overflow-hidden"
                  disabled={isConnecting}
                >
                  <div className="relative clip-edges bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] transition-all duration-300 group-hover:from-emerald-400 group-hover:to-teal-500">
                    <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-8 py-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      <div className="relative flex items-center justify-between space-x-4 text-xl font-cyber">
                        <span className="bg-gradient-to-r from-emerald-300 to-teal-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-emerald-200">
                          {isConnecting
                            ? "CONNECTING..."
                            : isFullyConnected()
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
