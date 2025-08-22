// src/components/contest-lobby/ShareContestButton.tsx

import { motion } from "framer-motion";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { FaCopy, FaDiscord, FaTelegram, FaTwitter } from "react-icons/fa";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
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
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get the user's referral code (now consistent across all auth endpoints)
  const userInviteCode = user?.referral_code || '';

  // Get OG image URL for preview
  const ogImageUrl = getContestOGImageUrl(contestId);

  if (!isAuthenticated || !userInviteCode) {
    return null; // Don't show share button for unauthenticated users
  }

  const generateShareLink = (withContest: boolean = true) => {
    const baseUrl = window.location.origin || 'https://degenduel.me';
    if (withContest) {
      // Direct link to contest with referral code
      return `${baseUrl}/contests/${contestId}?ref=${userInviteCode}`;
    } else {
      // General referral link
      return `${baseUrl}?ref=${userInviteCode}`;
    }
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
      {/* Share Button - Minimal Icon Only */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 transition-all duration-300 group ${
          isOpen ? 'text-white bg-brand-500/20 rounded-lg' : 'text-gray-400 hover:text-white'
        }`}
        title="Share Contest"
      >
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-brand-400/20 opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
        
        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 relative z-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        
        {/* OG Image Preview on Hover */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none z-50">
          <div className="relative">
            <div className="bg-dark-400 rounded-lg shadow-2xl border border-dark-300 p-2">
              <OGImage
                src={ogImageUrl}
                alt={`${contestName} Preview`}
                className="w-64 h-auto rounded border-0 ring-0 outline-none"
                fallbackText=""
              />
            </div>
            {/* Arrow pointing to button */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-dark-400"></div>
          </div>
        </div>
      </motion.button>

      {/* Share Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop - dark overlay for modal */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-dark-300 rounded-lg shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-brand-400 font-semibold mb-1">Share This Contest</h3>
                <p className="text-xs text-gray-400">Invite friends and earn contest credits!</p>
              </div>

              {/* OG Image Preview */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Preview:</p>
                <OGImage
                  src={ogImageUrl}
                  alt={`${contestName} Preview`}
                  className="w-full h-auto rounded-md border-0 ring-0 outline-none"
                  fallbackText="Contest preview generating..."
                />
              </div>

              {/* Preview Link */}
              <div className="bg-dark-400/30 rounded-lg p-3">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleShare("twitter")}
                    className="flex items-center justify-center p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                    title="Share on Twitter"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare("discord")}
                    className="flex items-center justify-center p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                    title="Share on Discord"
                  >
                    <FaDiscord className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleShare("telegram")}
                    className="flex items-center justify-center p-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                    title="Share on Telegram"
                  >
                    <FaTelegram className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(generateShareText())}
                    className="flex items-center justify-center p-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                    title="Copy share text"
                  >
                    <FaCopy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="bg-dark-400/20 rounded-lg p-3">
                <p className="text-xs text-brand-300 font-medium mb-1">💰 Earn Contest Credits</p>
                <p className="text-xs text-gray-500">
                  Get 1 contest credit for every 3 friends who join and play contests through your invite!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 