import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useStore } from "../../../store/useStore";
import { CopyToClipboard } from "../../common/CopyToClipboard";
import { ProfileImageManager } from "./ProfileImageManager";

const MAX_NICKNAME_LENGTH = 15;
const MIN_NICKNAME_LENGTH = 4;

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
}

// Helper function to truncate wallet address
const truncateAddress = (address: string, short: boolean = false) => {
  if (short) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  rankScore,
  joinDate,
  bonusBalance,
  onUpdateNickname,
  onUpdateProfileImage,
  profileImageUrl,
  isUpdating,
  isBanned,
  banReason,
  isPublicView = false,
}) => {
  const { user } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [newNickname, setNewNickname] = useState(username);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  let timeoutId: ReturnType<typeof setTimeout>;

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
              className="relative group/avatar"
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
                    (profileImageUrl ? `${profileImageUrl}?t=${Date.now()}` : null) || 
                    (user?.profile_image?.url ? `${user.profile_image.url}?t=${Date.now()}` : null) ||
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
                
                {/* Edit Profile Image Button (only for non-public view) */}
                {!isPublicView && onUpdateProfileImage && (
                  <button
                    onClick={() => setIsEditingImage(true)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"
                    aria-label="Edit profile image"
                  >
                    <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-dark-600/50 border border-brand-400/50 backdrop-blur-sm hover:bg-dark-500/70 transition-all duration-200 hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                )}
              </motion.div>

              {/* Rank Badge */}
              <div className="absolute -bottom-2 -right-2 bg-brand-500 rounded-full px-3 py-1 text-sm font-bold text-white shadow-lg border border-brand-400 transform group-hover/avatar:scale-110 transition-transform duration-300 flex items-center gap-1.5">
                <span className="text-xs text-brand-200">Rank</span>
                <span className="text-white font-cyber">#{rankScore}</span>
              </div>

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
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 text-transparent bg-clip-text animate-gradient-x">
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
                  </div>
                )}
              </div>

              {/* Wallet Address */}
              <div className="mt-2">
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

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 backdrop-blur-sm border border-dark-300/20 rounded-lg bg-dark-200/30 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-sm text-gray-400">Rank Score</div>
                    <div className="text-lg font-bold text-brand-400">
                      {rankScore}
                    </div>
                  </div>
                </div>
                <div className="p-3 backdrop-blur-sm border border-dark-300/20 rounded-lg bg-dark-200/30 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-sm text-gray-400">Bonus Balance</div>
                    <div className="text-lg font-bold text-brand-400">
                      {bonusBalance}
                    </div>
                  </div>
                </div>
                <div className="p-3 backdrop-blur-sm border border-dark-300/20 rounded-lg bg-dark-200/30 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-sm text-gray-400">Joined</div>
                    <div className="text-lg font-bold text-brand-400">
                      {joinDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
