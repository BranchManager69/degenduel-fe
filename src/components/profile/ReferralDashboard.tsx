// src/components/profile/ReferralDashboard.tsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FaCheck,
  FaClock,
  FaCopy,
  FaDiscord,
  FaGift,
  FaTelegram,
  FaTwitter,
  FaUsers,
} from "react-icons/fa";
import { ddApi } from "../../services/dd-api";

// Clean interfaces
interface ReferralStats {
  total_referrals: number;
  qualified_referrals: number;
  pending_referrals: number;
  total_rewards: number;
  recent_referrals: Array<{
    username: string;
    status: "pending" | "qualified" | "rewarded" | "expired";
    joined_at: string;
  }>;
  recent_rewards: Array<{
    type: "signup_bonus" | "contest_bonus" | "special_event";
    amount: number;
    date: string;
    description: string;
  }>;
}

// Shared animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Modular components
const SocialShareButton: React.FC<{
  platform: "twitter" | "discord" | "telegram";
  referralCode: string;
}> = ({ platform, referralCode }) => {
  const shareToSocial = () => {
    const referralLink = `https://degenduel.me/join?ref=${referralCode}`;
    const message = encodeURIComponent(
      "Join me on DegenDuel - the ultimate crypto portfolio PvP platform! Use my referral link to get started:"
    );

    const urls = {
      twitter: `https://x.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralLink)}`,
      discord: `https://discord.com/channels/@me?content=${message} ${referralLink}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`
    };

    window.open(urls[platform], "_blank");
  };

  const Icon = {
    twitter: FaTwitter,
    discord: FaDiscord,
    telegram: FaTelegram
  }[platform];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={shareToSocial}
      className="p-2 hover:bg-dark-400/50 rounded-lg text-brand-400 transition-colors"
      title={`Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
    >
      <Icon />
    </motion.button>
  );
};

const ReferralLink: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const copyReferralLink = async () => {
    const referralLink = `https://degenduel.me/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy referral link");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      <motion.div 
        className="flex-1 bg-dark-300/30 p-3 rounded-lg font-mono text-gray-300 break-all"
        {...fadeIn}
      >
        https://degenduel.me/join?ref={code}
      </motion.div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyReferralLink}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
          copied
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30"
        }`}
      >
        {copied ? <FaCheck /> : <FaCopy />}
        {copied ? "Copied!" : "Copy Link"}
      </motion.button>
    </div>
  );
};

export const ReferralDashboard: React.FC = () => {
  const [{ referralCode, stats, loading, error }, setState] = React.useState<{
    referralCode: string;
    stats: ReferralStats | null;
    loading: boolean;
    error: string | null;
  }>({
    referralCode: "",
    stats: null,
    loading: true,
    error: null
  });

  const [showShareMenu, setShowShareMenu] = React.useState(false);

  React.useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const [codeResponse, statsResponse] = await Promise.all([
          ddApi.fetch("/api/referrals/code"),
          ddApi.fetch("/api/referrals/stats")
        ]);

        const [codeData, statsData] = await Promise.all([
          codeResponse.json(),
          statsResponse.json()
        ]);

        setState(prev => ({
          ...prev,
          referralCode: codeData.success ? codeData.referral_code : "",
          stats: statsData.success ? statsData : null,
          loading: false
        }));
      } catch (err) {
        console.error("Failed to fetch referral data:", err);
        setState(prev => ({
          ...prev,
          error: "Failed to load referral data",
          loading: false
        }));
        toast.error("Failed to load referral data");
      }
    };

    fetchReferralData();
  }, []);

  if (loading) {
    return (
      <motion.div 
        className="space-y-4"
        initial="initial"
        animate="animate"
        variants={fadeIn}
      >
        <div className="h-32 bg-dark-300/30 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-300/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        {...fadeIn}
      >
        <p className="text-red-400">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={fadeIn}
    >
      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <motion.h3 
            className="text-xl font-bold text-gray-100 flex items-center gap-2"
            {...fadeIn}
          >
            <FaUsers className="text-brand-400" />
            Your Unique Referral Link
          </motion.h3>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-all duration-300"
            >
              Share
            </motion.button>
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute mt-2 right-0 bg-dark-300/95 backdrop-blur-sm border border-brand-400/20 rounded-lg p-2 shadow-xl z-50"
                >
                  <div className="flex gap-2">
                    {["twitter", "discord", "telegram"].map(platform => (
                      <SocialShareButton
                        key={platform}
                        platform={platform as any}
                        referralCode={referralCode}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <ReferralLink code={referralCode} />
        
        <div className="space-y-4">
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4">
            <h4 className="text-brand-400 font-medium mb-2">How it works:</h4>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  1
                </div>
                Degen A:  Shares his unique referral link on X.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  2
                </div>
                Degen B:  Clicks the link, connects his wallet <span className="text-brand-400">for the first-time</span>, and chooses a username.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  3
                </div>
                Degen A:  Earns [REDACTED] rewards for each referral.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  4
                </div>
                Degen B:  Enters a Duel for the first time.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  5
                </div>
                Degen A:  Earns big [REDACTED] rewards for all Duels Degen B enters in perpetuity.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  6
                </div>
                Degen B:  Wins a Duel.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  7
                </div>
                Degen A:  Earns <span className="text-brand-400">bonus</span> [REDACTED] rewards every time Degen B wins a Duel.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  8
                </div>
                Degen B:  Quits his job and becomes a full-time Duelist.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  9
                </div>
                Degen A:  Feels happy to have helped Degen B achieve financial freedom.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                  10
                </div>
                Degen B:  Sends Degen A a thank you note and a ridiculously [REDACTED] amount of [REDACTED].
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <FaUsers className="text-brand-400" />
              Total Referrals
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {stats.total_referrals}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-green-400">
                {stats.qualified_referrals} qualified
              </span>
              <span className="text-yellow-400">
                {stats.pending_referrals} pending
              </span>
            </div>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <FaGift className="text-brand-400" />
              Total Rewards
            </div>
            <p className="text-2xl font-bold text-gray-100">
              ${stats.total_rewards.toFixed(2)}
            </p>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <FaClock className="text-brand-400" />
              Recent Activity
            </div>
            <p className="text-lg text-gray-100">
              {stats.recent_referrals.length} new referrals
            </p>
            <p className="text-sm text-gray-400">in the last 30 days</p>
          </div>
        </div>
      )}

      {/* After the Stats Grid, before Recent Activity */}
      {stats && (
        <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <FaGift className="text-brand-400" />
            Rewards Progress
          </h3>
          <div className="space-y-6">
            {/* Tier 1: First 5 Referrals */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Tier 1: First 5 Referrals</span>
                <span>{Math.min(stats.qualified_referrals, 5)}/5</span>
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (stats.qualified_referrals / 5) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reward: $5 per qualified referral
              </p>
            </div>

            {/* Tier 2: 6-20 Referrals */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Tier 2: 6-20 Referrals</span>
                <span>
                  {Math.max(0, Math.min(stats.qualified_referrals - 5, 15))}/15
                </span>
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(((stats.qualified_referrals - 5) / 15) * 100, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reward: $7.50 per qualified referral
              </p>
            </div>

            {/* Tier 3: 21+ Referrals */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Tier 3: 21+ Referrals</span>
                <span>
                  {Math.max(0, stats.qualified_referrals - 20)}+ referrals
                </span>
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-800 transition-all duration-500"
                  style={{
                    width: `${stats.qualified_referrals >= 20 ? 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Reward: $10 per qualified referral + 1% of their contest
                earnings
              </p>
            </div>

            {/* Additional Rewards Info */}
            <div className="mt-4 bg-dark-300/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-brand-400 mb-2">
                Additional Rewards
              </h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>
                  • Contest Bonus: Extra $5 when referred users join their first
                  contest
                </li>
                <li>• Monthly Bonus: Top referrers get additional rewards</li>
                <li>
                  • Special Events: Earn bonus rewards during promotional
                  periods
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Referrals */}
          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Recent Referrals
            </h3>
            <div className="space-y-4">
              {stats.recent_referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg"
                >
                  <div>
                    <p className="text-gray-200">{referral.username}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(referral.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      referral.status === "qualified"
                        ? "bg-green-500/20 text-green-400"
                        : referral.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : referral.status === "rewarded"
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {referral.status}
                  </span>
                </div>
              ))}
              {stats.recent_referrals.length === 0 && (
                <p className="text-center text-gray-400">
                  No recent referral activity
                </p>
              )}
            </div>
          </div>

          {/* Recent Rewards */}
          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Recent Rewards
            </h3>
            <div className="space-y-4">
              {stats.recent_rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg"
                >
                  <div>
                    <p className="text-gray-200">{reward.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(reward.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-brand-400 font-bold">
                    ${reward.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              {stats.recent_rewards.length === 0 && (
                <p className="text-center text-gray-400">No recent rewards</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
