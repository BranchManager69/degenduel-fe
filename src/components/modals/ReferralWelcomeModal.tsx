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
    referrerProfile,
    referralRewards,
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
                  Welcome to DegenDuel
                </h2>

                {/* Referrer profile information */}
                {referrerProfile && (
                  <div className="flex flex-col items-center justify-center space-y-3 py-3">
                    <div className="relative">
                      {referrerProfile.profile_image ? (
                        <img
                          src={
                            referrerProfile.profile_image.thumbnail_url ||
                            referrerProfile.profile_image.url
                          }
                          alt={`${referrerProfile.nickname}'s profile`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-brand-400/50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center border-2 border-brand-400/50">
                          <span className="text-brand-300 text-xl font-bold">
                            {referrerProfile.nickname
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-brand-400 rounded-full p-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-dark-200"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300 text-sm">
                        You were invited by
                      </p>
                      <p className="text-brand-400 font-bold">
                        {referrerProfile.nickname}
                      </p>
                    </div>
                  </div>
                )}

                {referralCode && !referrerProfile && (
                  <div className="flex items-center justify-center text-brand-300">
                    <span className="bg-dark-300/60 px-3 py-1 rounded-lg text-sm border border-brand-400/20">
                      Referral Code:{" "}
                      <span className="font-bold">{referralCode}</span>
                    </span>
                  </div>
                )}

                <p className="text-gray-400">
                  {referralCode
                    ? "You've been invited to join the ultimate crypto portfolio battle arena. Connect your wallet to start your journey and receive special rewards."
                    : "Welcome to the ultimate crypto portfolio battle arena. Connect your wallet to start your journey."}
                </p>

                {/* Referral rewards information if available */}
                {referralRewards && (
                  <div className="bg-dark-300/40 border border-brand-400/20 rounded-lg p-3 mt-2">
                    <p className="text-brand-300 font-semibold text-sm">
                      Special Referral Bonus
                    </p>
                    <p className="text-gray-300 text-sm">
                      You'll receive a {referralRewards.user_bonus} bonus when
                      you sign up!
                    </p>
                  </div>
                )}
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
