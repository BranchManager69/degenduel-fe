// src/components/modals/InviteWelcomeModal.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useInviteSystem } from "../../hooks/social/legacy/useInviteSystem";
import { useStore } from "../../store/useStore";

export const InviteWelcomeModal: React.FC = () => {
  const {
    showWelcomeModal,
    setShowWelcomeModal,
    trackSignup,
    inviteCode,
    inviterProfile,
    inviteRewards,
  } = useInviteSystem();
  const { isAuthenticated, user } = useMigratedAuth();
  const { connectWallet, isConnecting } = useStore();

  // Track when user connects wallet (but don't auto-close modal)
  const [hasTrackedSignup, setHasTrackedSignup] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && user && inviteCode && !hasTrackedSignup) {
      trackSignup()
        .then(() => {
          setHasTrackedSignup(true);
          console.log("[InviteWelcomeModal] Successfully tracked signup for user");
        })
        .catch((error) => {
          console.error("[InviteWelcomeModal] Failed to track signup:", error);
          // Still mark as tracked to prevent repeated attempts
          setHasTrackedSignup(true);
          
          // Optionally show user-friendly error message for certain error types
          if (error.message.includes("no longer valid")) {
            console.warn("[InviteWelcomeModal] Invite code is no longer valid - clearing invite data");
            // Could clear invite here if needed, but keeping it for now to show in UI
          }
        });
      // Don't auto-close modal - let user explore first
    }
  }, [
    isAuthenticated,
    user,
    inviteCode,
    hasTrackedSignup,
    trackSignup,
  ]);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      // Connect wallet using store's connectWallet
      connectWallet().catch(console.error);
    } else {
      // User is already authenticated, close modal and track if needed
      setShowWelcomeModal(false);
      localStorage.setItem("has_seen_welcome", "true");
      if (inviteCode && !hasTrackedSignup) {
        trackSignup()
          .then(() => {
            setHasTrackedSignup(true);
            console.log("[InviteWelcomeModal] Successfully tracked signup via Get Started button");
          })
          .catch((error) => {
            console.error("[InviteWelcomeModal] Failed to track signup via Get Started button:", error);
            // Still mark as tracked to prevent repeated attempts
            setHasTrackedSignup(true);
          });
      }
    }
  };

  // Don't show modal to already authenticated users unless they have an invite code
  const shouldShowModal = showWelcomeModal && inviteCode;

  return (
    <AnimatePresence>
      {shouldShowModal && (
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
                  You're In! 🔥
                </h2>

                {/* Inviter profile information */}
                {inviterProfile && (
                  <div className="flex flex-col items-center justify-center space-y-3 py-3">
                    <div className="relative">
                      {inviterProfile.profile_image ? (
                        <img
                          src={
                            inviterProfile.profile_image.thumbnail_url ||
                            inviterProfile.profile_image.url
                          }
                          alt={`${inviterProfile.nickname}'s profile`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-brand-400/50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-dark-300 flex items-center justify-center border-2 border-brand-400/50">
                          <span className="text-brand-300 text-xl font-bold">
                            {inviterProfile.nickname
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
                        Your degen buddy
                      </p>
                      <p className="text-brand-400 font-bold">
                        {inviterProfile.nickname}
                      </p>
                      <p className="text-gray-400 text-xs">
                        invited you to the arena
                      </p>
                    </div>
                  </div>
                )}

                {inviteCode && !inviterProfile && (
                  <div className="flex items-center justify-center text-brand-300">
                    <span className="bg-dark-300/60 px-3 py-1 rounded-lg text-sm border border-brand-400/20">
                      Invite Code:{" "}
                      <span className="font-bold">{inviteCode}</span>
                    </span>
                  </div>
                )}

                <p className="text-gray-300 text-lg leading-relaxed">
                  {inviteCode
                    ? "Ready to prove your trading skills? Battle other degens in high-stakes portfolio competitions and earn rewards for your wins."
                    : "Ready to prove your trading skills? Battle other degens in high-stakes portfolio competitions."}
                </p>

                {/* Invite rewards information if available */}
                {inviteRewards && (
                  <div className="bg-dark-300/40 border border-brand-400/20 rounded-lg p-3 mt-2">
                    <p className="text-brand-300 font-semibold text-sm">
                      🎁 Welcome Bonus Unlocked!
                    </p>
                    <p className="text-gray-300 text-sm">
                      Get {inviteRewards.user_bonus} just for joining through this invite
                    </p>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-brand-400 font-bold mb-2">
                    💀 Duel to Death
                  </h3>
                  <p className="text-sm text-gray-400">
                    Create portfolios, battle degens, claim victory
                  </p>
                </div>
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-brand-400 font-bold mb-2">
                    💎 Stack Winnings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Every win pays out. Every loss teaches.
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
                            : isAuthenticated
                              ? "ENTER THE ARENA"
                              : "GEAR UP & ENTER"}
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