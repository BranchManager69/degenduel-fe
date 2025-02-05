import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { Card, CardContent } from "../ui/Card";

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
  isUpdating?: boolean;
  isBanned: boolean;
  banReason: string | null;
  isPublicView?: boolean;
}

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
  isUpdating,
  isBanned,
  banReason,
  isPublicView = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(username);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  let timeoutId: ReturnType<typeof setTimeout>;

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
          `/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`
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
            "This nickname is already taken. Please choose another."
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
      {isBanned && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-800 rounded-md">
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500"
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
              <h2 className="text-red-100 font-semibold">Account Banned</h2>
              {banReason && (
                <p className="text-red-200 text-sm mt-1">{banReason}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-brand-500/20 flex items-center justify-center">
              <span className="text-2xl">{isBanned ? "🚫" : "👤"}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
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
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-gray-100">
                      {username}
                    </h1>
                    {!isPublicView && onUpdateNickname && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
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
              <div className="mt-1">
                <CopyToClipboard
                  text={address}
                  className="group flex items-center gap-2 max-w-full"
                >
                  <button className="p-1 rounded hover:bg-dark-300/50 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400 group-hover:text-brand-400 transition-colors"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors font-mono">
                    {address}
                  </span>
                </CopyToClipboard>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Rank Score</span>
                  <span className="text-sm text-gray-200">{rankScore}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Bonus Balance</span>
                  <span className="text-sm text-gray-200">{bonusBalance}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Joined</span>
                  <span className="text-sm text-gray-200">{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
