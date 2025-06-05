import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";

import type { User, UserLevel } from "../../services/userService";
import { users } from "../../services/api/users";
import { PublicUserSearch } from "../common/PublicUserSearch";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface Participant {
  address: string;
  nickname: string;
  score?: number;
  role?: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  contestStatus: "upcoming" | "live" | "completed";
}

interface EnhancedParticipant extends Participant {
  levelData?: UserLevel;
  profileImageUrl?: string | null; // Updated to match API response
  isLoading?: boolean;
  // New fields from bulk API
  experiencePoints?: number;
  totalContests?: number;
  twitterHandle?: string | null;
  isBanned?: boolean;
}

// Format the user's level and XP into a clean progress display
const LevelDisplay = ({ levelData }: { levelData?: UserLevel }) => {
  if (!levelData)
    return (
      <div className="animate-pulse h-4 w-20 bg-dark-300 rounded-full"></div>
    );

  const { current_level, experience } = levelData;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">
          Lv. {current_level.level_number}
        </span>
        <span className="text-xs font-semibold bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text">
          {current_level.title}
        </span>
      </div>
      <div className="flex items-center mt-0.5">
        <div className="w-16 h-1 bg-dark-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
            style={{ width: `${experience.percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500 ml-1">
          {Math.floor(experience.percentage)}%
        </span>
      </div>
    </div>
  );
};

// Profile picture component that handles default images
const ProfilePicture = ({
  imageUrl,
  nickname,
  isSelected,
  role,
}: {
  imageUrl?: string | null;
  nickname: string;
  isSelected: boolean;
  role?: string;
}) => {
  // Determine border class based on role (case-insensitive)
  const getBorderClass = () => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === "admin") return "border-red-500/70";
    if (normalizedRole === "superadmin") return "border-yellow-500/70";
    if (isSelected) return "border-brand-400";
    return "border-brand-500/30";
  };

  // Determine background class based on role (case-insensitive)
  const getBackgroundClass = () => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === "admin") return "bg-red-500/10";
    if (normalizedRole === "superadmin") return "bg-yellow-500/10";
    if (isSelected) return "bg-brand-500/30";
    return "bg-brand-500/20";
  };

  return (
    <div
      className={`h-10 w-10 rounded-full ${getBackgroundClass()} flex items-center justify-center border-2 ${getBorderClass()} overflow-hidden relative group`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={nickname}
          className="h-full w-full object-cover"
          onError={(e) => {
            // If image fails to load, fall back to the emoji
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="text-lg">👤</span>
      )}

      {/* Role indicator */}
      {role && (
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center">
          {role.toLowerCase() === "admin" && (
            <span
              className="text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center"
              title="Admin"
            >
              A
            </span>
          )}
          {role.toLowerCase() === "superadmin" && (
            <span
              className="text-xs bg-yellow-500 text-black rounded-full h-4 w-4 flex items-center justify-center"
              title="Super Admin"
            >
              S
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  contestStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [enhancedParticipants, setEnhancedParticipants] = useState<
    EnhancedParticipant[]
  >([]);

  // Initialize enhanced participants with loading state
  useEffect(() => {
    const initialEnhanced: EnhancedParticipant[] = participants.map((p) => ({
      ...p,
      isLoading: true,
    }));
    setEnhancedParticipants(initialEnhanced);

    // Fetch bulk profile data - ELIMINATES N+1 QUERY PROBLEM
    const fetchBulkProfileData = async () => {
      if (participants.length === 0) return;

      try {
        console.log(`[ParticipantsList] Fetching bulk profiles for ${participants.length} participants`);
        
        // Extract wallet addresses
        const walletAddresses = participants.map(p => p.address);
        
        // Single bulk API call instead of N individual calls
        const bulkResponse = await users.getBulkProfiles(walletAddresses);
        
        if (bulkResponse.success) {
          // Map bulk response to enhanced participants
          const updatedParticipants: EnhancedParticipant[] = participants.map((participant) => {
            const profileData = bulkResponse.profiles[participant.address];
            
            if (profileData) {
              // Convert bulk API response to our expected format
              const levelData: UserLevel = {
                current_level: {
                  level_number: profileData.level.level_number,
                  class_name: profileData.level.class_name,
                  title: profileData.level.title,
                  icon_url: profileData.level.icon_url,
                },
                experience: {
                  current: profileData.experience_points,
                  next_level_at: (profileData.level.level_number + 1) * 1000, // Estimate
                  percentage: Math.min((profileData.experience_points % 1000) / 10, 100),
                },
                achievements: {
                  bronze: { current: 0, required: 1 },
                  silver: { current: 0, required: 0 },
                  gold: { current: 0, required: 0 },
                  platinum: { current: 0, required: 0 },
                  diamond: { current: 0, required: 0 },
                },
              };

              return {
                ...participant,
                nickname: profileData.nickname, // Use actual nickname from API
                role: profileData.role,
                levelData,
                profileImageUrl: profileData.profile_image_url,
                experiencePoints: profileData.experience_points,
                totalContests: profileData.total_contests,
                twitterHandle: profileData.twitter_handle,
                isBanned: profileData.is_banned,
                isLoading: false,
              };
            } else {
              // Profile not found - use fallback
              return {
                ...participant,
                isLoading: false,
              };
            }
          });

          setEnhancedParticipants(updatedParticipants);
          console.log(`[ParticipantsList] Successfully loaded ${updatedParticipants.length} participant profiles`);
        }
      } catch (error) {
        console.error('[ParticipantsList] Failed to fetch bulk profile data:', error);
        
        // Fallback to showing participants without enhanced data
        const fallbackParticipants = participants.map(p => ({
          ...p,
          isLoading: false,
        }));
        setEnhancedParticipants(fallbackParticipants);
      }
    };

    fetchBulkProfileData();
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) {
      return enhancedParticipants;
    }

    const query = searchQuery.toLowerCase();
    return enhancedParticipants.filter(
      (p) =>
        p.nickname.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query),
    );
  }, [enhancedParticipants, searchQuery]);

  const sortedParticipants = useMemo(() => {
    return [...filteredParticipants].sort((a, b) => {
      // Get normalized roles (lowercase)
      const roleA = a.role?.toLowerCase();
      const roleB = b.role?.toLowerCase();

      // First sort by admin roles
      if (roleA === "superadmin" && roleB !== "superadmin") return -1;
      if (roleB === "superadmin" && roleA !== "superadmin") return 1;
      if (roleA === "admin" && roleB !== "admin" && roleB !== "superadmin")
        return -1;
      if (roleB === "admin" && roleA !== "admin" && roleA !== "superadmin")
        return 1;

      // Then sort by contest score for live/completed contests
      if (contestStatus !== "upcoming") {
        return (b.score || 0) - (a.score || 0);
      }

      // Keep original order for upcoming contests
      return 0;
    });
  }, [filteredParticipants, contestStatus]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  // Get CSS class for participant row based on role and selection status
  const getParticipantRowClass = (participant: EnhancedParticipant) => {
    const baseClass =
      "flex items-center justify-between p-3 rounded transition-colors group";
    const role = participant.role?.toLowerCase();

    if (selectedUser && selectedUser.wallet_address === participant.address) {
      return `${baseClass} bg-brand-500/20 border-l-2 border-brand-400`;
    }

    if (role === "superadmin") {
      return `${baseClass} bg-yellow-500/5 hover:bg-yellow-500/10 border-l border-yellow-500/30`;
    }

    if (role === "admin") {
      return `${baseClass} bg-red-500/5 hover:bg-red-500/10 border-l border-red-500/30`;
    }

    return `${baseClass} bg-dark-300/50 hover:bg-dark-300/70`;
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Participants</h3>
          <span className="text-xs text-gray-400 bg-dark-300/50 px-2 py-1 rounded">
            {participants.length}{" "}
            {participants.length === 1 ? "dueler" : "duelers"}
          </span>
        </div>

        {/* User search component */}
        <PublicUserSearch
          onSelectUser={(user) => {
            handleSelectUser(user as any);
            handleSearch(user.nickname);
          }}
          placeholder="Search participants..."
          variant="modern"
          className="w-full"
          autoFocus={false}
        />
      </CardHeader>
      <CardContent>
        {sortedParticipants.length > 0 ? (
          <div className="space-y-2">
            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.address}
                className={getParticipantRowClass(participant)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 text-sm font-mono">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Enhanced Profile Picture */}
                    <ProfilePicture
                      imageUrl={participant.profileImageUrl}
                      nickname={participant.nickname}
                      isSelected={
                        selectedUser?.wallet_address === participant.address
                      }
                      role={participant.role}
                    />

                    {/* User Info Column */}
                    <div className="flex flex-col">
                      {/* Username with Link */}
                      <Link
                        to={`/profile/${participant.address}`}
                        className={`${
                          selectedUser &&
                          selectedUser.wallet_address === participant.address
                            ? "text-brand-400 font-medium"
                            : participant.role === "superadmin"
                              ? "text-yellow-500 font-medium"
                              : participant.role === "admin"
                                ? "text-red-500 font-medium"
                                : "text-gray-300 hover:text-brand-400"
                        } transition-colors`}
                      >
                        {participant.nickname}
                      </Link>

                      {/* Level Display */}
                      <LevelDisplay levelData={participant.levelData} />
                    </div>
                  </div>
                </div>

                {/* Score Display for Live/Completed Contests */}
                {contestStatus !== "upcoming" &&
                  participant.score !== undefined && (
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-sm font-medium ${
                          participant.score >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {participant.score >= 0 ? "+" : ""}
                        {participant.score.toFixed(2)}%
                      </span>

                      {/* Optional: Portfolio Value Display */}
                      {participant.score !== undefined && (
                        <span className="text-xs text-gray-500">
                          {participant.score >= 0 ? "↗" : "↘"} Portfolio
                        </span>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              No participants match your search
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-brand-500/20 text-brand-400 text-sm rounded-md hover:bg-brand-500/30 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              No duelers have entered yet
            </div>
            <div className="text-xs text-gray-500">
              Be the first to join this contest!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
