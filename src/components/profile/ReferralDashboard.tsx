// src/components/profile/ReferralDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
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
  exit: { opacity: 0, y: -20 },
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
      twitter: `https://x.com/intent/tweet?text=${message}&url=${encodeURIComponent(
        referralLink
      )}`,
      discord: `https://discord.com/channels/@me?content=${message} ${referralLink}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=${message}`,
    };

    window.open(urls[platform], "_blank");
  };

  const Icon = {
    twitter: FaTwitter,
    discord: FaDiscord,
    telegram: FaTelegram,
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
      toast.success("🔗 Copied referral link");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("🚨 Couldn't copy referral link");
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
        {copied ? "☑️ Copied the link" : "Copy Link"}
      </motion.button>
    </div>
  );
};

export const ReferralDashboard: React.FC = () => {
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [showShareMenu, setShowShareMenu] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, codeResponse] = await Promise.all([
          ddApi.fetch("/referrals/stats").then((res) => res.json()),
          ddApi.fetch("/referrals/code").then((res) => res.json()),
        ]);

        setStats(statsResponse);
        setReferralCode(codeResponse.referral_code);
      } catch (error) {
        console.error("Error fetching referral data:", error);
        toast.error("🚨 Couldn't load your referral data");
      } finally {
        setLoading(false);
      }
    };

    // Fetch data on mount
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-400"></div>
      </div>
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
              Shill Ref Link
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
                    {["twitter", "discord", "telegram"].map((platform) => (
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

        <div className="space-y-6 mt-8">
          {/* Value Proposition */}
          <div className="bg-gradient-to-br from-dark-200/80 to-dark-300/80 backdrop-blur-sm rounded-xl border border-brand-400/20 p-6">
            <h4 className="text-xl font-bold text-brand-400 mb-4">
              Refer, Earn, Repeat
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    🎯
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Strategic Portfolio Battles
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Engage in thrilling head-to-head portfolio competitions
                      with real-time performance tracking.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    💎
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Exclusive Token Selection
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Access a curated list of top-performing tokens to build
                      your winning strategy.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    🏆
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Competitive Rewards
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Earn rewards for your market insights and portfolio
                      performance.
                    </p>
                  </div>
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    📊
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Real-Time Analytics
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Track your performance with advanced analytics and market
                      insights.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    🤝
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Growing Community
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Join a community of skilled traders and market
                      enthusiasts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 mt-1">
                    🚀
                  </div>
                  <div>
                    <h5 className="text-gray-100 font-medium mb-1">
                      Early Access Benefits
                    </h5>
                    <p className="text-gray-400 text-sm">
                      Your referrals get priority access to new features and
                      special events.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-dark-200/80 backdrop-blur-sm rounded-xl border border-brand-400/20 p-6">
            <h4 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-brand-400">Quick Guide</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-300/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm">
                    1
                  </div>
                  <h5 className="text-gray-100 font-medium">Share Your Link</h5>
                </div>
                <p className="text-sm text-gray-400">
                  Copy your unique referral link and share it to your X,
                  Telegram, or Discord. You may want to send personalized
                  invites to any apes, giga-whales, or based chads you know.
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm">
                    2
                  </div>
                  <h5 className="text-gray-100 font-medium">Track Progress</h5>
                </div>
                <p className="text-sm text-gray-400">
                  Monitor your referrals and rewards in real-time on your
                  dashboard. Once a referral joins, you'll receive a
                  notification. You'll receive a notification when they qualify
                  for a reward, too, because <i>guess what!?</i> You win when
                  they win! See details below.
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm">
                    3
                  </div>
                  <h5 className="text-gray-100 font-medium">Earn Together</h5>
                </div>
                <p className="text-sm text-gray-400">
                  Both you and your referrals benefit from the platform's
                  success. It's PvP <b>and</b> PvE! LFG.
                </p>
              </div>
            </div>
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
              {stats.total_referrals} total
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-yellow-400">
                {stats.pending_referrals} are pending
              </span>
              <span className="text-green-400">
                {stats.qualified_referrals} have dueled
              </span>
            </div>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <FaGift className="text-brand-400" />
              Cumulative Rewards
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {stats.total_rewards.toFixed(2)} SOL
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
            <p className="text-sm text-gray-400">in the last 30d</p>
          </div>
        </div>
      )}

      {/* After the Stats Grid, before Recent Activity */}
      {stats && (
        <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <FaGift className="text-brand-400" />
            Rewards Tiers
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
              <p className="text-xs text-gray-500 mt-1">Reward: [TBA]</p>
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
              <p className="text-xs text-gray-500 mt-1">Reward: [TBA]</p>
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
              <p className="text-xs text-gray-500 mt-1">Reward: [TBA]</p>
            </div>

            {/* Additional Rewards Info */}
            <div className="mt-4 bg-dark-300/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-brand-400 mb-2">
                Additional Rewards
              </h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Contest Bonus: [TBA]</li>
                <li>• Monthly Bonus: [TBA]</li>
                <li>• Special Events: [TBA]</li>
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
