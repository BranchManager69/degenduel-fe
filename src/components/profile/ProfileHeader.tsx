import React, { useState } from "react";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { Card, CardContent } from "../ui/Card";

const MAX_NICKNAME_LENGTH = 15;

interface ProfileHeaderProps {
  address: string;
  username: string;
  rankScore: number;
  joinDate: string;
  bonusBalance: string;
  onUpdateNickname: (newNickname: string) => Promise<void>;
  isUpdating: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  address,
  username,
  rankScore,
  joinDate,
  bonusBalance,
  onUpdateNickname,
  isUpdating,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate nickname
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length < 3) {
      alert("Nickname must be at least 3 characters long");
      return;
    }
    if (trimmedNickname.length > MAX_NICKNAME_LENGTH) {
      alert(
        `Nickname must be no longer than ${MAX_NICKNAME_LENGTH} characters`
      );
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedNickname)) {
      alert("Nickname can only contain letters, numbers, and underscores");
      return;
    }
    if (trimmedNickname === username) {
      setIsEditing(false);
      return;
    }

    try {
      await onUpdateNickname(trimmedNickname);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update nickname:", error);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[a-zA-Z0-9_]+$/.test(value)) {
      setNewNickname(value);
    }
  };

  const handleCancel = () => {
    setNewNickname(username);
    setIsEditing(false);
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-brand-500/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="text"
                    value={newNickname}
                    onChange={handleNicknameChange}
                    maxLength={MAX_NICKNAME_LENGTH}
                    className="bg-dark-200 border border-dark-400 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    disabled={isUpdating}
                    placeholder="Letters, numbers, underscore"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    disabled={isUpdating}
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
                </form>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-gray-100">
                    {username}
                  </h1>
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
                </div>
              )}
            </div>
            <div className="mt-1">
              <CopyToClipboard
                text={address}
                className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 truncate max-w-[200px] sm:max-w-none"
              />
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
  );
};
