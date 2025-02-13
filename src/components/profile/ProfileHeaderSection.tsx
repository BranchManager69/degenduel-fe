import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ddApi, formatBonusPoints } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ProfileHeader } from "./ProfileHeader";

interface UserData {
  wallet_address: string;
  nickname: string | null;
  rank_score: number;
  created_at: string;
  bonusBalance: string;
  is_banned: boolean;
  ban_reason: string | null;
}

export const ProfileHeaderSection: React.FC = () => {
  const { user, setUser, maintenanceMode } = useStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.wallet_address || maintenanceMode) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // Load user data and balance in parallel
        const [userResponse, balanceResponse] = await Promise.all([
          ddApi.users.getOne(user.wallet_address),
          ddApi.balance.get(user.wallet_address),
        ]);

        setUserData({
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname,
          rank_score: userResponse.rank_score,
          created_at: userResponse.created_at,
          bonusBalance: formatBonusPoints(balanceResponse.balance),
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load user data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.wallet_address, maintenanceMode]);

  const handleUpdateNickname = async (newNickname: string) => {
    if (!user?.wallet_address) return;

    try {
      setIsUpdatingNickname(true);
      setError(null);

      await ddApi.users.update(user.wallet_address, newNickname);
      setUserData((prev) => (prev ? { ...prev, nickname: newNickname } : null));
      setUser({ ...user, nickname: newNickname });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update nickname"
      );
      throw err;
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/20">
        <LoadingSpinner size="lg" className="animate-cyber-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative group">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
          className="animate-glitch"
        />
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="relative group overflow-hidden rounded-lg backdrop-blur-sm border border-dark-300/20">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <Link
          to={`/profile/${userData.nickname || userData.wallet_address}`}
          className="absolute top-2 right-2 px-3 py-1.5 bg-dark-200 border border-brand-500/50 hover:border-brand-500 rounded-lg flex items-center gap-2 transition-all duration-200 group/link z-10 hover:bg-dark-300"
        >
          <span className="text-sm text-brand-200 group-hover/link:text-brand-400 transition-colors font-medium">
            View Public Profile
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-brand-400 group-hover/link:text-brand-300 transition-colors"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <ProfileHeader
          address={userData.wallet_address}
          username={userData.nickname || userData.wallet_address}
          rankScore={userData.rank_score}
          joinDate={new Date(userData.created_at).toLocaleDateString()}
          bonusBalance={userData.bonusBalance}
          onUpdateNickname={handleUpdateNickname}
          isUpdating={isUpdatingNickname}
          isBanned={userData.is_banned}
          banReason={userData.ban_reason}
        />
      </div>
    </div>
  );
};
