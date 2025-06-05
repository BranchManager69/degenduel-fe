// src/components/contest-lobby/ShareContestButton.tsx

import { motion } from "framer-motion";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { FaCopy, FaDiscord, FaTelegram, FaTwitter } from "react-icons/fa";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useInviteSystem } from "../../hooks/social/legacy/useInviteSystem";
import { formatCurrency } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { getContestOGImageUrl, OGImage } from "../../utils/ogImageUtils";

interface ShareContestButtonProps {
  contestId: string;
  contestName: string;
  prizePool: string;
  className?: string;
}

export const ShareContestButton: React.FC<ShareContestButtonProps> = ({
  contestId,
  contestName,
  prizePool,
  className = ""
}) => {
  const { isAuthenticated, user } = useMigratedAuth();
  const { inviteCode } = useInviteSystem();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get the user's invite code (from auth or invite system) with safe fallbacks
  const userInviteCode = (user as any)?.inviteCode || (user as any)?.invite_code || inviteCode || '';

  // Get OG image URL for preview
  const ogImageUrl = getContestOGImageUrl(contestId);

  if (!isAuthenticated || !userInviteCode) {
    return null; // Don't show share button for unauthenticated users
  }

  const generateShareLink = (withContest: boolean = true) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://degenduel.me'}/join?ref=${userInviteCode}`;
    return withContest ? `${baseUrl}&contest=${contestId}` : baseUrl;
  };

  const generateShareText = () => {
    const prizeAmount = formatCurrency(parseFloat(prizePool));
    return `🔥 I joined ${contestName} on @DegenDuelMe to win ${prizeAmount} 💰\n⚔️ Prove your trading skills on DegenDuel $DUEL \n${generateShareLink()}`;
  };

  const handleShare = async (platform: string) => {
    const shareText = generateShareText();
    const shareLink = generateShareLink();

    // Track share attempt (graceful fallback if endpoint doesn't exist)
    try {
      await ddApi.fetch("/api/referrals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          referralCode: userInviteCode,
          contestId,
          contestName
        }),
      });
    } catch (error) {
      // Graceful fallback - log but don't break functionality
      console.error("Failed to track contest share:", error);
    }

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case "discord":
        // Discord doesn't have a direct share URL, so we copy the text
        await copyToClipboard(`${shareText}\n\n${shareLink}`);
        toast.success("📋 Contest share text copied!");
        setIsOpen(false);
        return;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
      setIsOpen(false);
    }
  };

  const copyToClipboard = async (text?: string) => {
    const textToCopy = text || generateShareLink();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("🔗 Contest invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        <span className="hidden sm:inline">Share Contest</span>
        <span className="sm:hidden">Share</span>
      </motion.button>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-dark-200/95 backdrop-blur-sm border border-brand-400/20 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-brand-400 font-semibold mb-1">Share This Contest</h3>
                <p className="text-xs text-gray-400">Invite friends and earn contest credits!</p>
              </div>

              {/* OG Image Preview */}
              <div className="bg-dark-300/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Preview:</p>
                <OGImage
                  src={ogImageUrl}
                  alt={`${contestName} Preview`}
                  className="w-full h-24"
                  fallbackText="Contest preview generating..."
                />
              </div>

              {/* Preview Link */}
              <div className="bg-dark-300/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Contest Invite Link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-brand-300 truncate font-mono">
                    {generateShareLink()}
                  </code>
                  <button
                    onClick={() => copyToClipboard()}
                    className={`p-1 rounded transition-colors ${
                      copied 
                        ? "text-green-400 bg-green-400/20" 
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {copied ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    ) : (
                      <FaCopy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Quick Share:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShare("twitter")}
                    className="flex items-center gap-2 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                  >
                    <FaTwitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare("discord")}
                    className="flex items-center gap-2 p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                  >
                    <FaDiscord className="w-4 h-4" />
                    <span className="text-sm">Discord</span>
                  </button>
                  <button
                    onClick={() => handleShare("telegram")}
                    className="flex items-center gap-2 p-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                  >
                    <FaTelegram className="w-4 h-4" />
                    <span className="text-sm">Telegram</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateShareText())}
                    className="flex items-center gap-2 p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                  >
                    <FaCopy className="w-4 h-4" />
                    <span className="text-sm">Copy All</span>
                  </button>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="bg-brand-500/10 border border-brand-400/30 rounded-lg p-3">
                <p className="text-xs text-brand-300 font-medium mb-1">💰 Earn Contest Credits</p>
                <p className="text-xs text-gray-400">
                  Get 1 contest credit for every 3 friends who join and play contests through your invite!
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}; 