// src/components/profile/ReferralDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaChartBar,
  FaCheck,
  FaChrome,
  FaClock,
  FaCopy,
  FaDesktop,
  FaDiscord,
  FaEdge,
  FaFirefox,
  FaGift,
  FaMobile,
  FaSafari,
  FaTabletAlt,
  FaTelegram,
  FaTwitter,
  FaUsers,
} from "react-icons/fa";
import { useReferral } from "../../hooks/useReferral";
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

// Modify interface name and structure
interface LeaderboardStats {
  total_global_referrals: number;
  current_period: {
    start_date: string;
    end_date: string;
    days_remaining: number;
  };
  next_payout_date: string;
}

interface LeaderboardEntry {
  username: string;
  referrals: number;
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
  referralCode: string;
  stats?: ReferralStats | null;
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
      `${baseMessage}${socialProof}${urgency}${personal}\n\n${referralLink}`
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
          referralLink
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

const ReferralLink: React.FC<{
  code: string;
  stats?: ReferralStats | null;
}> = ({ code, stats }) => {
  const [copied, setCopied] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const copyReferralLink = async () => {
    const referralLink = `https://degenduel.me/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("🔗 Copied referral link");

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
      toast.error("🚨 Couldn't copy referral link");
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
          onClick={copyReferralLink}
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

const AnalyticsSection: React.FC = () => {
  const { analytics, refreshAnalytics } = useReferral();

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  if (!analytics) return null;

  const totalClicks = Object.values(analytics.clicks?.by_source || {}).reduce(
    (a, b) => a + b,
    0
  );
  const totalConversions = Object.values(
    analytics.conversions?.by_source || {}
  ).reduce((a, b) => a + b, 0);
  const conversionRate = totalClicks
    ? ((totalConversions / totalClicks) * 100).toFixed(1)
    : "0";

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return <FaMobile className="text-brand-400" />;
      case "tablet":
        return <FaTabletAlt className="text-brand-400" />;
      default:
        return <FaDesktop className="text-brand-400" />;
    }
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case "chrome":
        return <FaChrome className="text-brand-400" />;
      case "firefox":
        return <FaFirefox className="text-brand-400" />;
      case "safari":
        return <FaSafari className="text-brand-400" />;
      case "edge":
        return <FaEdge className="text-brand-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
        <FaChartBar className="text-brand-400" />
        Referral Analytics
      </h3>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Clicks</div>
          <div className="text-2xl font-bold text-gray-100">{totalClicks}</div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Conversions</div>
          <div className="text-2xl font-bold text-gray-100">
            {totalConversions}
          </div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Conversion Rate</div>
          <div className="text-2xl font-bold text-gray-100">
            {conversionRate}%
          </div>
        </div>
      </div>

      {/* Source Analysis */}
      {analytics.clicks?.by_source && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-300">
            Traffic Sources
          </h4>
          <div className="space-y-2">
            {Object.entries(analytics.clicks.by_source).map(
              ([source, count]) => {
                const conversions =
                  analytics.conversions?.by_source?.[source] || 0;
                const rate = count
                  ? ((conversions / count) * 100).toFixed(1)
                  : "0";

                return (
                  <div key={source} className="bg-dark-300/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-gray-200 capitalize">{source}</div>
                        <div className="text-sm text-gray-400">
                          {conversions} conversions ({rate}%)
                        </div>
                      </div>
                      <div className="text-xl font-bold text-gray-200">
                        {count}
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-dark-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 transition-all duration-500"
                        style={{ width: `${(count / totalClicks) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Distribution */}
        {analytics.clicks?.by_device && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">Devices</h4>
            <div className="space-y-2">
              {Object.entries(analytics.clicks.by_device).map(
                ([device, count]) => (
                  <div key={device} className="bg-dark-300/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device)}
                        <div className="capitalize">{device}</div>
                      </div>
                      <div>{((count / totalClicks) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Browser Distribution */}
        {analytics.clicks?.by_browser && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">Browsers</h4>
            <div className="space-y-2">
              {Object.entries(analytics.clicks.by_browser).map(
                ([browser, count]) => (
                  <div key={browser} className="bg-dark-300/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getBrowserIcon(browser)}
                        <div className="capitalize">{browser}</div>
                      </div>
                      <div>{((count / totalClicks) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reward Distribution */}
      {analytics.rewards?.by_type && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-300">
            Rewards by Type
          </h4>
          <div className="space-y-2">
            {Object.entries(analytics.rewards.by_type).map(([type, amount]) => (
              <div key={type} className="bg-dark-300/20 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="capitalize">{type.replace(/_/g, " ")}</div>
                  <div className="font-bold">{amount.toFixed(2)} SOL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Rename and update the component
const ReferralLeaderboard: React.FC = () => {
  const [leaderboardStats, setLeaderboardStats] =
    React.useState<LeaderboardStats | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);

  React.useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          ddApi
            .fetch("/api/referrals/leaderboard/stats")
            .then((res) => res.json()),
          ddApi
            .fetch("/api/referrals/leaderboard/rankings")
            .then((res) => res.json()),
        ]);
        setLeaderboardStats(statsRes);
        setLeaderboard(leaderboardRes);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
    const interval = setInterval(fetchLeaderboardData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!leaderboardStats) return null;

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
      {/* Period Status Banner */}
      <div className="bg-gradient-to-r from-brand-500/20 to-brand-700/20 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-brand-400">
              Current Period:{" "}
              {new Date(
                leaderboardStats.current_period.start_date
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                leaderboardStats.current_period.end_date
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
          🏆 Referral Rankings
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
                    {entry.period_rewards} DUEL
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
                <span className="text-xs text-gray-500">
                  Lifetime: {entry.lifetime_rewards} DUEL
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Rewards */}
      <div className="mt-6">
        <h4 className="text-lg font-bold text-gray-100 mb-4">
          🎯 Referral Milestones
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Milestone 1</div>
            <div className="text-lg font-bold text-gray-100">100 Referrals</div>
            <div className="text-sm text-brand-400">Reward: 1,000 DUEL</div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Milestone 2</div>
            <div className="text-lg font-bold text-gray-100">500 Referrals</div>
            <div className="text-sm text-brand-400">Reward: 10,000 DUEL</div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Milestone 3</div>
            <div className="text-lg font-bold text-gray-100">
              1000 Referrals
            </div>
            <div className="text-sm text-brand-400">Reward: 25,000 DUEL</div>
          </div>
        </div>
      </div>
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
          ddApi.fetch("/api/referrals/stats").then((res) => res.json()),
          ddApi.fetch("/api/referrals/code").then((res) => res.json()),
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
      {/* Replace LaunchSection with ReferralLeaderboard */}
      <ReferralLeaderboard />

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
                        stats={stats}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ReferralLink code={referralCode} stats={stats} />

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

      {/* Analytics Section */}
      {stats && <AnalyticsSection />}

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
