import React, { useEffect, useState } from 'react';

import { getAuthStatus } from "../../../services/api/auth";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { ErrorMessage } from "../../common/ErrorMessage";
import { LoadingSpinner } from "../../common/LoadingSpinner";
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

interface UserLevelData {
  current_level: {
    level_number: number;
    title: string;
    class_name: string;
    icon_url: string | null;
  };
  experience: {
    current: number;
    next_level_at: number;
    percentage: number;
  };
  achievements: {
    [tier: string]: {
      current: number;
      required: number;
    };
  };
}

export const ProfileHeaderSection: React.FC = () => {
  const { user, setUser, maintenanceMode } = useStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userLevelData, setUserLevelData] = useState<UserLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [twitterProfileImage, setTwitterProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.wallet_address || maintenanceMode) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Load user data, auth status, balance, stats, and level data in parallel
        const [userResponse, authStatusResponse, statsResponse, levelResponse] = await Promise.all([
          ddApi.users.getOne(user.wallet_address),
          getAuthStatus(),
          ddApi.stats.getOverall(user.wallet_address),
          ddApi.users.getUserLevel(user.wallet_address),
        ]);

        // Get Twitter profile image if available
        if (authStatusResponse?.twitterStatus?.active && 
            authStatusResponse?.twitterStatus?.details?.profile_image) {
          setTwitterProfileImage(authStatusResponse.twitterStatus.details.profile_image);
        }

        // Set user's uploaded profile image if available
        if (userResponse.profile_image_url) {
          setProfileImageUrl(userResponse.profile_image_url);
        }

        setUserData({
          wallet_address: userResponse.wallet_address,
          nickname: userResponse.nickname || null,
          rank_score: userResponse.experience_points || 0, // Use experience_points as rank score
          created_at: userResponse.created_at || "",
          bonusBalance: `${userResponse.total_contests || 0}`, // Show total contests instead
          is_banned: userResponse.is_banned ?? false,
          ban_reason: userResponse.ban_reason ?? null,
        });
        
        // Transform stats data
        setUserStats({
          totalEarnings: statsResponse.contestStats?.totalEarnings || "0",
          contestsPlayed: statsResponse.contestStats?.totalParticipated || 0,
          contestsWon: Math.round((statsResponse.contestStats?.totalParticipated || 0) * (statsResponse.contestStats?.winRate || 0)),
          winRate: Math.round((statsResponse.contestStats?.winRate || 0) * 100),
          avgPlacement: statsResponse.contestStats?.avgRank || 0,
        });
        
        // Set level data
        setUserLevelData(levelResponse);
      } catch (err) {
        if (err instanceof Response && err.status === 503) {
          // Maintenance mode response, don't set error
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load user data",
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
        err instanceof Error ? err.message : "Failed to update nickname",
      );
      throw err;
    } finally {
      setIsUpdatingNickname(false);
    }
  };
  
  // Handler for updating profile image
  const handleUpdateProfileImage = (newImageUrl: string) => {
    if (!user?.wallet_address) return;
    
    // Update local state
    setProfileImageUrl(newImageUrl || null);
    
    // Update global user state
    setUser({
      ...user,
      profile_image_url: newImageUrl
    });
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
        <ProfileHeader
          address={userData.wallet_address}
          username={userData.nickname || userData.wallet_address}
          rankScore={userData.rank_score}
          joinDate={new Date(userData.created_at).toLocaleDateString()}
          bonusBalance={userData.bonusBalance}
          onUpdateNickname={handleUpdateNickname}
          onUpdateProfileImage={handleUpdateProfileImage}
          profileImageUrl={profileImageUrl || twitterProfileImage || undefined}
          isUpdating={isUpdatingNickname}
          isBanned={userData.is_banned}
          banReason={userData.ban_reason}
          stats={userStats}
          levelData={userLevelData}
        />
      </div>
    </div>
  );
};
