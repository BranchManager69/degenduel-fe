import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useStore } from "../../../store/useStore";
import { getFullImageUrl } from "../../../utils/profileImageUtils";
import { getUserNameColor } from "../../../utils/roleColors";
import { CopyToClipboard } from "../../common/CopyToClipboard";
import { ProfileImageManager } from "./ProfileImageManager";

const MAX_NICKNAME_LENGTH = 15;
const MIN_NICKNAME_LENGTH = 4;

// Define tier colors for visual representation
const TIER_COLORS = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-gray-400 to-gray-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-500 to-cyan-300",
  diamond: "from-violet-500 to-violet-300",
};

interface NicknameError {
  error: string;
  details?: Array<{ message: string }>;
  field?: string;
}

interface ProfileHeaderProps {
  address: string;
  username: string;
  rankScore: number;
  joinDate: string;
  bonusBalance: string;
  onUpdateNickname?: (newNickname: string) => Promise<void>;
  onUpdateProfileImage?: (newUrl: string) => void;
  profileImageUrl?: string;
  isUpdating?: boolean;
  isBanned: boolean;
  banReason: string | null;
  isPublicView?: boolean;
  stats?: {
    totalEarnings: string;
    contestsPlayed: number;
    contestsWon: number;
    winRate: number;
    avgPlacement: number;
  };
  levelData?: {
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
  } | null;
}

// Helper function to truncate wallet address
const truncateAddress = (address: string, short: boolean = false) => {
  if (short) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format join date as relative time
const formatJoinDate = (dateString: string) => {
  const joinDate = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - joinDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return "Joined today";
  } else if (diffInDays === 1) {
    return "Joined 1 day ago";
  } else if (diffInDays < 30) {
    return `Joined ${diffInDays} days ago`;
  } else {
    // Calculate complete months
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) {
      return "Joined 1 month ago";
    } else {
      return `Joined ${diffInMonths} months ago`;
    }
  }
};

// Validation function for nicknames
function validateNickname(nickname: string): {
  isValid: boolean;
  error?: string;
} {
  // Length check (4-15 chars)
  if (
    nickname.length < MIN_NICKNAME_LENGTH ||
    nickname.length > MAX_NICKNAME_LENGTH
  ) {
    return {
      isValid: false,
      error: `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters`,
    };
  }

  // Must start with letter
  if (!/^[a-zA-Z]/.test(nickname)) {
    return {
      isValid: false,
      error: "Nickname must start with a letter",
    };
  }

  // Only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return {
      isValid: false,
      error: "Nickname can only contain letters, numbers, and underscores",
    };
  }

  // No consecutive underscores
  if (nickname.includes("__")) {
    return {
      isValid: false,
      error: "Nickname cannot contain consecutive underscores",
    };
  }

  return { isValid: true };
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  address,
  username,
  joinDate,
  onUpdateNickname,
  onUpdateProfileImage,
  profileImageUrl,
  isUpdating,
  isBanned,
  banReason,
  isPublicView = false,
  stats,
  levelData,
}) => {
  const { user } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [newNickname, setNewNickname] = useState(username);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);
  let timeoutId: ReturnType<typeof setTimeout>;

  // Simple click handler to open image manager
  const handleImageClick = useCallback(() => {
    if (!isPublicView && onUpdateProfileImage) {
      setIsEditingImage(true);
    }
  }, [isPublicView, onUpdateProfileImage]);

  const isWalletAddress = username === address;
  const displayName = isWalletAddress ? truncateAddress(address) : username;

  // Check nickname availability with debounce
  const checkNicknameAvailability = async (nickname: string) => {
    if (nickname === username) {
      setIsAvailable(null);
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`,
        );
        const data = await response.json();
        setIsAvailable(data.available);
      } catch (error) {
        console.error("Error checking nickname availability:", error);
        setIsAvailable(null);
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedNickname = newNickname.trim();

    // Validate nickname format
    const validation = validateNickname(trimmedNickname);
    if (!validation.isValid && validation.error) {
      setValidationError(validation.error);
      return;
    }

    // Don't update if nickname hasn't changed
    if (trimmedNickname === username) {
      setIsEditing(false);
      return;
    }

    try {
      await onUpdateNickname?.(trimmedNickname);
      toast.success("Nickname updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      // Handle specific error cases from the API
      if (error.response?.status === 400) {
        const errorData: NicknameError = await error.response.json();
        if (errorData.details) {
          setValidationError(errorData.details[0].message);
        } else if (errorData.error === "Nickname already taken") {
          setValidationError(
            "This nickname is already taken. Please choose another.",
          );
        } else {
          setValidationError("Failed to update nickname. Please try again.");
        }
      } else {
        setValidationError("An error occurred. Please try again.");
      }
      console.error("Failed to update nickname:", error);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[a-zA-Z0-9_]+$/.test(value)) {
      setNewNickname(value);
      setValidationError(null);
      checkNicknameAvailability(value);
    }
  };

  const handleCancel = () => {
    setNewNickname(username);
    setIsEditing(false);
    setValidationError(null);
    setIsAvailable(null);
  };

  return (
    <>
      {/* Profile Image Manager Modal */}
      {isEditingImage && !isPublicView && onUpdateProfileImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/90 backdrop-blur-xl p-4">
          <div className="bg-dark-800/70 border border-brand-500/10 rounded-2xl p-6 max-w-md w-full relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-600/5 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <button
              onClick={() => setIsEditingImage(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-dark-700/50 text-gray-400 hover:text-white hover:bg-dark-600/50 transition-all z-10"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="relative z-10">
              <ProfileImageManager
                userAddress={address}
                currentImageUrl={profileImageUrl}
                onImageUpdate={(newUrl) => {
                  onUpdateProfileImage(newUrl);
                  setIsEditingImage(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {isBanned && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg backdrop-blur-sm border border-red-500/20 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-4 relative">
            <div className="flex items-center space-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 animate-pulse"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h2 className="text-red-400 font-semibold font-cyber">
                  Account Banned
                </h2>
                {banReason && (
                  <p className="text-red-300/80 text-sm mt-1">{banReason}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <div className="rounded-lg border shadow-sm backdrop-blur-sm border-dark-300/20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-600/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,22,220,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-30" />
        </div>

        <div className="relative p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture Section */}
            <div
              onClick={handleImageClick}
              className={`relative group/avatar ${!isPublicView && onUpdateProfileImage ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Main Profile Picture */}
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-brand-500/30 bg-dark-300/50"
              >
                <img
                  src={
                    (profileImageUrl ? `${getFullImageUrl(profileImageUrl)}?t=${Date.now()}` : null) || 
                    (user?.profile_image_url ? `${getFullImageUrl(user.profile_image_url)}?t=${Date.now()}` : null) ||
                    "/assets/media/default/profile_pic.png"
                  }
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/assets/media/default/profile_pic.png";
                  }}
                />
                {/* Overlay Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(127,0,255,0.1),transparent)] opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
                
                {/* Upload Overlay (only for non-public view) */}
                {!isPublicView && onUpdateProfileImage && (
                  <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-50 rounded-full opacity-0 group-hover/avatar:opacity-100 bg-black/60">
                    <div className="text-center text-white pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs font-medium">Change Photo</div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Level Badge */}
              {levelData && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg border border-brand-400 transform group-hover/avatar:scale-110 transition-transform duration-300 flex items-center gap-1.5 z-40 pointer-events-none">
                  <span className="text-xs text-brand-200">Lv.{levelData.current_level.level_number}</span>
                  <span className="text-white font-cyber">{levelData.current_level.title}</span>
                </div>
              )}

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-30 transition-opacity duration-300" />
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
                {isEditing && !isPublicView ? (
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-2 w-full max-w-md"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={handleNicknameChange}
                        maxLength={MAX_NICKNAME_LENGTH}
                        className="bg-dark-200 border border-dark-400 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1"
                        disabled={isUpdating}
                        placeholder="Letters, numbers, underscore"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 transition-colors"
                        disabled={
                          isUpdating || !isAvailable || !!validationError
                        }
                      >
                        {isUpdating ? (
                          <span className="flex items-center space-x-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span>Saving...</span>
                          </span>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 bg-dark-400 text-white rounded hover:bg-dark-500 disabled:opacity-50 transition-colors"
                        onClick={handleCancel}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                    </div>
                    {validationError && (
                      <p className="text-red-400 text-sm">{validationError}</p>
                    )}
                    {isAvailable !== null &&
                      !validationError &&
                      newNickname !== username && (
                        <p
                          className={`text-sm ${
                            isAvailable ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isAvailable
                            ? "✓ Nickname is available"
                            : "✗ Nickname is already taken"}
                        </p>
                      )}
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className={`text-3xl font-bold ${getUserNameColor(user)}`}>
                        {displayName}
                      </h1>
                      {!isPublicView && onUpdateNickname && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-dark-300/50"
                          disabled={isUpdating}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                      <CopyToClipboard
                        text={address}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 bg-dark-300/50 rounded-full hover:bg-dark-300 transition-colors"
                      >
                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-mono">
                          {truncateAddress(address, true)}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-400 group-hover:text-brand-400 transition-colors"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </CopyToClipboard>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm text-gray-400">{formatJoinDate(joinDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {stats && (
                <div className="mt-4">
                  {/* All Stats in One Line */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Win Gauge */}
                    <div className="flex-1 min-w-[120px] max-w-[200px]">
                      <div className="relative h-6 bg-dark-300/50 rounded-full overflow-hidden border border-dark-300/20">
                        {/* Filled portion */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/80 to-emerald-400/80 rounded-full transition-all duration-700"
                          style={{ width: `${stats.contestsPlayed > 0 ? (stats.contestsWon / stats.contestsPlayed) * 100 : 0}%` }}
                        />
                        {/* Text overlay */}
                        <div className="relative z-10 flex items-center justify-center h-full">
                          <span className="text-xs">
                            <span className="text-white font-bold drop-shadow-lg">{stats.contestsWon}</span>
                            <span className="text-gray-300 drop-shadow-lg"> wins</span>
                            <span className="text-gray-300 drop-shadow-lg"> / </span>
                            <span className="text-gray-200 font-bold drop-shadow-lg">{stats.contestsPlayed}</span>
                            <span className="text-gray-300 drop-shadow-lg"> played</span>
                            <span className="text-purple-400 font-bold drop-shadow-lg ml-2">{stats.winRate}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Winnings</span>
                      <span className="text-base font-bold text-brand-400 flex items-center gap-1">
                        {parseFloat(stats.totalEarnings).toFixed(2)}
                        <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Percentile</span>
                      <span className="text-sm font-semibold text-purple-400">{stats.avgPlacement.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Achievement Progress */}
              {levelData && (
                <div className="mt-4">
                  <button
                    onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
                    className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    <span>Achievements</span>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${isAchievementsExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isAchievementsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3"
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(levelData.achievements).map(([tier, { current, required }]) => (
                          <div key={tier} className="relative">
                            <div className="text-center p-2 rounded bg-dark-300/30 border border-dark-300/20 hover:border-brand-500/30 transition-colors">
                              {/* Tier Name */}
                              <div
                                className={`text-xs font-medium mb-1 uppercase text-transparent bg-clip-text bg-gradient-to-r ${TIER_COLORS[tier as keyof typeof TIER_COLORS]}`}
                              >
                                {tier}
                              </div>
                              
                              {/* Count */}
                              <div className="text-sm font-bold text-white">
                                {current}
                                {required > 0 && (
                                  <span className="text-xs text-gray-400">/{required}</span>
                                )}
                              </div>
                              
                              {/* Progress bar */}
                              {required > 0 && (
                                <div className="mt-1 h-1 bg-dark-400/50 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                                    style={{ width: `${Math.min((current / required) * 100, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* XP Progress Bar */}
              {levelData && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Experience Progress</span>
                    <span className="text-gray-400">
                      {levelData.experience.current.toLocaleString()} / {levelData.experience.next_level_at.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-2 bg-dark-300/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-1000"
                      style={{ width: `${levelData.experience.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Level {levelData.current_level.level_number}</span>
                    <span>{Math.floor(levelData.experience.percentage)}% to Level {levelData.current_level.level_number + 1}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
