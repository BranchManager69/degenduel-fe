import { motion } from "framer-motion";
import React from "react";
import { toast } from "react-hot-toast";
import {
  FaCheck,
  FaCopy,
  FaDiscord,
  FaTelegram,
  FaTwitter,
  FaUsers,
} from "react-icons/fa";

import { ddApi } from "../../services/dd-api";
import { ReferralStats, ReferralHistory } from "../../types/referral.types";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const ShareButton: React.FC<{
  platform: "twitter" | "discord" | "telegram";
  referralCode: string;
}> = ({ platform, referralCode }) => {
  const getShareLink = () => {
    const referralLink = `https://degenduel.me/join?ref=${referralCode}`;
    const message = "Join me on DegenDuel - compete in crypto portfolio battles!";

    switch (platform) {
      case "twitter":
        return `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
      case "discord":
        return `https://discord.com/channels/@me?content=${encodeURIComponent(`${message} ${referralLink}`)}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
    }
  };

  const handleShare = () => {
    window.open(getShareLink(), "_blank");
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
    >
      <Icon />
      <span className="text-sm capitalize">{platform}</span>
    </motion.button>
  );
};

const InviteLink: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const copyInviteLink = async () => {
    const inviteLink = `https://degenduel.me/join?ref=${code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 bg-dark-300/30 p-3 rounded-lg font-mono text-gray-300 break-all">
          https://degenduel.me/join?ref={code}
        </div>
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
          {copied ? "Copied!" : "Copy Link"}
        </motion.button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["twitter", "discord", "telegram"].map((platform) => (
          <ShareButton
            key={platform}
            platform={platform as any}
            referralCode={code}
          />
        ))}
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Progress to next credit</span>
        <span className="text-brand-400">{current}/{total}</span>
      </div>
      <div className="w-full bg-dark-300/30 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-brand-400 to-brand-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-400">
        {3 - current} more qualified referrals needed for next contest credit
      </p>
    </div>
  );
};

const ReferralHistorySection: React.FC<{ history: ReferralHistory | null }> = ({ history }) => {
  if (!history || history.referrals.length === 0) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Recent Referrals</h3>
        <p className="text-center text-gray-400">No referrals yet. Share your link to get started!</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-100 mb-4">Recent Referrals</h3>
      <div className="space-y-3">
        {history.referrals.slice(0, 5).map((referral) => (
          <div
            key={referral.id}
            className="flex items-center justify-between p-3 bg-dark-300/30 rounded-lg"
          >
            <div>
              <p className="text-gray-200">{referral.referred_user || "Anonymous"}</p>
              <p className="text-sm text-gray-400">
                {new Date(referral.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(referral.status)}`}>
              {referral.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AffiliateDashboard: React.FC = () => {
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [inviteCode, setInviteCode] = React.useState<string>("");
  const [history, setHistory] = React.useState<ReferralHistory | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [statsResponse, codeResponse, historyResponse] = await Promise.all([
          ddApi.fetch("/api/referrals/stats"),
          ddApi.fetch("/api/referrals/code"),
          ddApi.fetch("/api/referrals/history?limit=10&offset=0"),
        ]);

        const [statsData, codeData, historyData] = await Promise.all([
          statsResponse.json(),
          codeResponse.json(),
          historyResponse.json(),
        ]);

        setStats(statsData);
        setInviteCode(codeData.referral_code);
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching referral data:", error);
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

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
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">Invite Friends</h1>
        <p className="text-gray-400">Earn 1 contest credit for every 3 qualified referrals</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <FaUsers className="text-brand-400" />
              Total Referrals
            </div>
            <p className="text-2xl font-bold text-gray-100">{stats.total_referrals}</p>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-green-400/30 rounded-lg p-4">
            <div className="text-gray-400 mb-2">Qualified</div>
            <p className="text-2xl font-bold text-green-400">{stats.qualified_referrals}</p>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-yellow-400/30 rounded-lg p-4">
            <div className="text-gray-400 mb-2">Pending</div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending_referrals}</p>
          </div>

          <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-purple-400/30 rounded-lg p-4">
            <div className="text-gray-400 mb-2">Contest Credits</div>
            <p className="text-2xl font-bold text-purple-400">{stats.contest_credits_earned}</p>
          </div>
        </div>
      )}

      {/* Progress to Next Credit */}
      {stats && stats.progress_to_next_credit !== undefined && (
        <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
          <ProgressBar
            current={stats.progress_to_next_credit}
            total={3}
          />
        </div>
      )}

      {/* Invite Link Section */}
      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-100 mb-6">Your Invite Link</h3>
        <InviteLink code={inviteCode} />
      </div>

      {/* How It Works */}
      <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 mx-auto">
              1
            </div>
            <h4 className="font-medium text-gray-200">Share Your Link</h4>
            <p className="text-sm text-gray-400">Send your invite link to friends</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 mx-auto">
              2
            </div>
            <h4 className="font-medium text-gray-200">They Play Contests</h4>
            <p className="text-sm text-gray-400">Friends qualify when they enter their first contest</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 mx-auto">
              3
            </div>
            <h4 className="font-medium text-gray-200">Earn Credits</h4>
            <p className="text-sm text-gray-400">Get 1 contest credit every 3 qualified referrals</p>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <ReferralHistorySection history={history} />
    </motion.div>
  );
};