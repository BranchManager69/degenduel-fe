// src/components/affiliate-dashboard/AffiliateDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { toast } from "react-hot-toast";
import {
  FaChartBar,
  FaCheck,
  FaClock,
  FaCopy,
  FaDiscord,
  FaTelegram,
  FaTwitter,
  FaUsers,
} from "react-icons/fa";

import { ddApi } from "../../services/dd-api";

// Clean interfaces
interface InviteStats {
  total_referrals: number; // API still uses referral terminology
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

// Affiliate leaderboard statistics
interface LeaderboardStats {
  total_global_referrals: number; // API still uses referral terminology
  current_period: {
    start_date: string;
    end_date: string;
    days_remaining: number;
  };
  next_payout_date: string;
}

interface LeaderboardEntry {
  username: string;
  referrals: number; // API still uses referral terminology
  lifetime_rewards: number;
  period_rewards: number;
  rank: number;
  trend: "up" | "down" | "stable";
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
  referralCode: string; // Actually the invite code
  stats?: InviteStats | null;
}> = ({ platform, referralCode, stats }) => {
  const getShareMessage = () => {
    const referralLink = `https://degenduel.me/join?ref=${referralCode}`;
    const baseMessage =
      "🎮 Join me in @DegenDuelMe - The ultimate crypto portfolio battle arena!";

    // Add social proof if available
    const socialProof = stats
      ? `\n🔥 Already ${stats.total_referrals.toLocaleString()} degens battling it out`
      : "\n🔥 Early access spots filling up fast";

    // Add launch-specific urgency
    const urgency = "\n⏰ Launch phase rewards ending soon";

    // Add personalized touch
    const personal = "\n💎 Use my ref link to get exclusive rewards";

    return encodeURIComponent(
      `${baseMessage}${socialProof}${urgency}${personal}\n\n${referralLink}`,
    );
  };

  const getShareLink = () => {
    const message = getShareMessage();
    const referralLink = `https://degenduel.me/join?ref=${referralCode}`;

    switch (platform) {
      case "twitter":
        return `https://x.com/intent/tweet?text=${message}`;
      case "discord":
        return `https://discord.com/channels/@me?content=${message} ${referralLink}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(
          referralLink,
        )}&text=${message}`;
    }
  };

  const handleShare = async () => {
    const shareLink = getShareLink();

    // Track share attempt
    try {
      await ddApi.fetch("/referrals/share", {
        method: "POST",
        body: JSON.stringify({
          platform,
          referralCode,
        }),
      });
    } catch (error) {
      console.error("Failed to track share:", error);
    }

    // Open share dialog
    window.open(shareLink, "_blank");
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
      onClick={handleShare}
      className="p-3 hover:bg-dark-400/50 rounded-lg text-brand-400 transition-colors flex items-center gap-2"
      title={`Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
    >
      <Icon />
      <span className="text-sm">
        Share on {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </span>
    </motion.button>
  );
};

const InviteLink: React.FC<{
  code: string;
  stats?: InviteStats | null;
}> = ({ code, stats }) => {
  const [copied, setCopied] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const copyInviteLink = async () => {
    const inviteLink = `https://degenduel.me/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("🔗 Copied invite link");

      // Track copy action
      await ddApi.fetch("/referrals/share", {
        method: "POST",
        body: JSON.stringify({
          platform: "copy",
          referralCode: code,
        }),
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("🚨 Couldn't copy invite link");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <motion.div
          className="flex-1 bg-dark-300/30 p-3 rounded-lg font-mono text-gray-300 break-all relative group"
          {...fadeIn}
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          https://degenduel.me/join?ref={code}
          {showPreview && (
            <div className="absolute top-full mt-2 left-0 w-full bg-dark-200/95 backdrop-blur-sm border border-brand-400/20 rounded-lg p-4 z-50">
              <h5 className="text-sm font-medium text-brand-400 mb-2">
                Preview Message
              </h5>
              <p className="text-xs text-gray-400">
                🎮 Join me in @DegenDuelMe - The ultimate crypto portfolio
                battle arena!
                {stats &&
                  `\n🔥 Already ${stats.total_referrals.toLocaleString()} degens battling it out`}
                {"\n⏰ Launch phase rewards ending soon"}
                {"\n💎 Use my ref link to get exclusive rewards"}
              </p>
            </div>
          )}
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyInviteLink}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
            copied
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30"
          }`}
        >
          {copied ? <FaCheck /> : <FaCopy />}
          {copied ? "🔗 Copied!" : "Copy Link"}
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["twitter", "discord", "telegram"].map((platform) => (
          <SocialShareButton
            key={platform}
            platform={platform as any}
            referralCode={code}
            stats={stats}
          />
        ))}
      </div>
    </div>
  );
};


// Affiliate leaderboard component
const AffiliateLeaderboard: React.FC = () => {
  const [leaderboardStats, setLeaderboardStats] =
    React.useState<LeaderboardStats | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);

  React.useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // First try to get leaderboard stats
        let statsRes;
        try {
          const statsResponse = await ddApi.fetch("/api/referrals/leaderboard/stats");
          statsRes = await statsResponse.json();
          setLeaderboardStats(statsRes);
        } catch (statsError) {
          console.error("Error fetching leaderboard stats:", statsError);
          // Set some default data to prevent UI crashes
          setLeaderboardStats({
            total_global_referrals: 0,
            current_period: {
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              days_remaining: 30,
            },
            next_payout_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Then try to get leaderboard rankings
        try {
          const rankingsResponse = await ddApi.fetch("/api/referrals/leaderboard/rankings");
          const leaderboardRes = await rankingsResponse.json();
          setLeaderboard(leaderboardRes);
        } catch (rankingsError) {
          console.error("Error fetching leaderboard rankings:", rankingsError);
          // Set empty array to prevent UI crashes
          setLeaderboard([]);
        }
      } catch (error) {
        console.error("Error in fetchLeaderboardData:", error);
        // Ensure we have default values if anything fails
        setLeaderboardStats(null);
        setLeaderboard([]);
      }
    };

    fetchLeaderboardData();
    const interval = setInterval(fetchLeaderboardData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Handle missing data gracefully instead of returning null (which causes component not to render)
  if (!leaderboardStats || !leaderboardStats.current_period) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <div className="py-4 text-center text-gray-400">
          Referral rankings are currently unavailable. Please check back later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
      {/* Period Status Banner */}
      <div className="bg-gradient-to-r from-brand-500/20 to-brand-700/20 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-brand-400">
              Current Period:{" "}
              {new Date(
                leaderboardStats.current_period.start_date,
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                leaderboardStats.current_period.end_date,
              ).toLocaleDateString()}
            </h3>
            <p className="text-sm text-gray-400">
              Next Payout:{" "}
              {new Date(leaderboardStats.next_payout_date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Global Referrals</p>
            <p className="text-2xl font-bold text-brand-400">
              {leaderboardStats.total_global_referrals.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-gray-100">
          Invite Leaderboard
        </h4>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.username}
              className="bg-dark-300/30 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`text-lg font-bold ${
                    entry.rank <= 3 ? "text-brand-400" : "text-gray-400"
                  }`}
                >
                  #{entry.rank}
                </div>
                <div>
                  <p className="font-medium text-gray-200">{entry.username}</p>
                  <p className="text-sm text-gray-400">
                    {entry.referrals} referrals
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold">
                    {entry.referrals} invites
                  </span>
                  {entry.trend === "up" && (
                    <span className="text-green-400">↑</span>
                  )}
                  {entry.trend === "down" && (
                    <span className="text-red-400">↓</span>
                  )}
                  {entry.trend === "stable" && (
                    <span className="text-gray-400">→</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export const AffiliateDashboard: React.FC = () => {
  const [stats, setStats] = React.useState<InviteStats | null>(null);
  const [inviteCode, setInviteCode] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [showShareMenu, setShowShareMenu] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats with error handling
        let userStats = null;
        try {
          const statsResponse = await ddApi.fetch("/api/referrals/stats");
          userStats = await statsResponse.json();
          setStats(userStats);
        } catch (statsError) {
          console.error("Error fetching referral stats:", statsError);
          // Set default stats to prevent UI crashes
          setStats({
            total_referrals: 0,
            qualified_referrals: 0,
            pending_referrals: 0,
            total_rewards: 0,
            recent_referrals: [],
            recent_rewards: []
          });
        }
        
        // Fetch invite code with error handling
        try {
          const codeResponse = await ddApi.fetch("/api/referrals/code");
          const codeData = await codeResponse.json();
          setInviteCode(codeData.referral_code || "ERROR"); // API still uses referral_code
        } catch (codeError) {
          console.error("Error fetching invite code:", codeError);
          // Set a placeholder code to prevent UI crashes
          setInviteCode("PLACEHOLDER");
          toast.error("🚨 Couldn't load your invite code");
        }
      } catch (error) {
        console.error("Error in overall affiliate data fetch:", error);
        toast.error("🚨 Couldn't load your affiliate data");
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
      {/* Affiliate Leaderboard Component */}
      <AffiliateLeaderboard />

      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <motion.h3
            className="text-xl font-bold text-gray-100 flex items-center gap-2"
            {...fadeIn}
          >
            <FaUsers className="text-brand-400" />
            Your Unique Invite Link
          </motion.h3>
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-all duration-300"
            >
              Share Invite Link
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
                        referralCode={inviteCode}
                        stats={stats}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <InviteLink code={inviteCode} stats={stats} />

        <div className="space-y-6 mt-8">
          {/* Value Proposition */}
          <div className="bg-gradient-to-br from-dark-200/80 to-dark-300/80 backdrop-blur-sm rounded-xl border border-brand-400/20 p-6">
            <h4 className="text-xl font-bold text-brand-400 mb-4">
              Share DegenDuel
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
                  Copy your invite link and share it on social media or send 
                  directly to people you know.
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
                  See who joins through your link and track your position 
                  on the leaderboard.
                </p>
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm">
                    3
                  </div>
                  <h5 className="text-gray-100 font-medium">Grow the Community</h5>
                </div>
                <p className="text-sm text-gray-400">
                  Help build the DegenDuel community and see your invite 
                  count grow on the leaderboard.
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
              <FaChartBar className="text-brand-400" />
              Invite Points
            </div>
            <p className="text-2xl font-bold text-gray-100">
              {stats.total_referrals * 100}
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



      {/* Recent Activity */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Referrals */}
          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">
              Recent Invites
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
                  No recent invite activity
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