import React from "react";
import { useParams } from "react-router-dom";
import { ddApi } from "../../services/dd-api";
import type { User } from "../../types";

// Use the actual User type but omit sensitive fields
type PublicProfileData = Pick<
  User,
  | "wallet_address"
  | "nickname"
  | "created_at"
  | "total_contests"
  | "total_wins"
  | "total_earnings"
  | "rank_score"
  | "is_banned"
>;

export const PublicProfile: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [profileData, setProfileData] =
    React.useState<PublicProfileData | null>(null);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await ddApi.users.getOne(`by-username/${identifier}`);
      // Extract only the public fields we want to display
      const publicData: PublicProfileData = {
        wallet_address: response.wallet_address,
        nickname: response.nickname,
        created_at: response.created_at,
        total_contests: response.total_contests,
        total_wins: response.total_wins,
        total_earnings: response.total_earnings,
        rank_score: response.rank_score,
        is_banned: response.is_banned,
      };
      setProfileData(publicData);
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (identifier) {
      loadProfileData();
    }
  }, [identifier]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-400"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 p-4">{error}</div>;
  }

  if (!profileData) {
    return (
      <div className="text-center text-gray-400 p-4">No profile data found</div>
    );
  }

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm border-l-2 border-brand-400/30 rounded-lg p-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-400/30">
          <img
            src="/assets/media/default/profile_pic.png"
            alt={profileData.nickname || "Profile"}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            {profileData.nickname || "Anonymous Degen"}
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            {profileData.wallet_address.slice(0, 6)}...
            {profileData.wallet_address.slice(-4)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Contests</div>
          <div className="text-xl font-bold text-gray-100">
            {profileData.total_contests}
          </div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Wins</div>
          <div className="text-xl font-bold text-gray-100">
            {profileData.total_wins}
          </div>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Earnings</div>
          <div className="text-xl font-bold text-gray-100">
            {profileData.total_earnings} SOL
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-dark-300/30 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Rank Score</span>
          <span className="text-brand-400 font-bold">
            {profileData.rank_score.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Member Since</span>
          <span className="text-gray-200">
            {new Date(profileData.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Banned Status Warning */}
      {profileData.is_banned && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-center">
            This account has been banned
          </p>
        </div>
      )}
    </div>
  );
};
