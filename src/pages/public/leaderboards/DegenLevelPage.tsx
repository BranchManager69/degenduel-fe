// src/pages/public/leaderboards/DegenLevelPage.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useStore } from "../../../store/useStore";

interface UserLevel {
  rank: number;
  username: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  profile_image?: {
    url: string;
    thumbnail_url?: string;
  };
  wallet_address: string;
  achievements_count: number;
}

export const DegenLevelPage: React.FC = () => {
  const { user, achievements } = useStore();
  const [topUsers, setTopUsers] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"level" | "achievements">("level");

  const isAuthenticated = !!user;
  const currentUserLevel = achievements?.userProgress?.level || 0;
  const currentUserXp = achievements?.userProgress?.experiencePoints || 0;
  const currentUserNextLevelXp =
    achievements?.userProgress?.nextLevelThreshold || 100;
  const xpProgress = (currentUserXp / currentUserNextLevelXp) * 100;

  // Calculate discount based on level (matching whitelist page logic)
  const MAX_DISCOUNT_PERCENT = 50;
  const discountPercent = Math.min(currentUserLevel, MAX_DISCOUNT_PERCENT);

  // Token submission costs
  const BASE_SUBMISSION_COST = 0.25; // SOL
  const finalCost = BASE_SUBMISSION_COST * ((100 - discountPercent) / 100);

  useEffect(() => {
    // In a real implementation, this would fetch data from an API
    // For now, we'll use mock data
    const mockTopUsers: UserLevel[] = [
      {
        rank: 1,
        username: "DegenMaster",
        level: 50,
        xp: 9800,
        nextLevelXp: 10000,
        wallet_address: "8xjB...a9qK",
        achievements_count: 42,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 2,
        username: "CryptoChad",
        level: 47,
        xp: 9100,
        nextLevelXp: 10000,
        wallet_address: "5tR3...z7Yx",
        achievements_count: 39,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 3,
        username: "TokenQueenX",
        level: 45,
        xp: 8900,
        nextLevelXp: 10000,
        wallet_address: "3fG9...q1Bp",
        achievements_count: 37,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 4,
        username: "MoonHunter",
        level: 43,
        xp: 8500,
        nextLevelXp: 10000,
        wallet_address: "7kL2...n5Qr",
        achievements_count: 35,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 5,
        username: "DiamondHands",
        level: 41,
        xp: 8200,
        nextLevelXp: 10000,
        wallet_address: "9pO7...v3Hz",
        achievements_count: 33,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 6,
        username: "SolKing",
        level: 39,
        xp: 7800,
        nextLevelXp: 10000,
        wallet_address: "2dA5...c8Jt",
        achievements_count: 32,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
      {
        rank: 7,
        username: "ApeWarrior",
        level: 36,
        xp: 7200,
        nextLevelXp: 10000,
        wallet_address: "6gF4...m2Ks",
        achievements_count: 30,
        profile_image: {
          url: "/assets/media/default/profile_pic.png",
        },
      },
    ];

    // Simulate API call
    setTimeout(() => {
      setTopUsers(mockTopUsers);
      setLoading(false);
    }, 800);
  }, []);

  // Insert current user into the ranking if authenticated
  const rankingsWithUser = React.useMemo(() => {
    if (!isAuthenticated || !user?.nickname) return topUsers;

    // Create user entry
    const userEntry: UserLevel = {
      rank: 99, // Placeholder rank
      username:
        user.nickname ||
        user.wallet_address.slice(0, 6) + "..." + user.wallet_address.slice(-4),
      level: currentUserLevel,
      xp: currentUserXp,
      nextLevelXp: currentUserNextLevelXp,
      wallet_address: user.wallet_address,
      achievements_count: achievements?.unlockedAchievements?.length || 0,
      profile_image: user.profile_image,
    };

    // Insert and sort
    const combinedRankings = [...topUsers, userEntry].sort((a, b) =>
      filter === "level"
        ? b.level - a.level
        : b.achievements_count - a.achievements_count,
    );

    // Reassign ranks
    return combinedRankings.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
  }, [
    topUsers,
    user,
    isAuthenticated,
    currentUserLevel,
    currentUserXp,
    currentUserNextLevelXp,
    achievements,
    filter,
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                Degen Level Rankings
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Level up by participating in contests, earning achievements, and
                being active on DegenDuel. Higher levels unlock better rewards
                and discounts!
              </p>
            </div>

            {/* User's Current Level Card - Only show if authenticated */}
            {isAuthenticated && (
              <Card className="bg-dark-200/50 backdrop-blur-lg border border-brand-500/30 p-6 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-400/5"></div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        Your Degen Profile
                      </h2>
                      <div className="flex items-center justify-center md:justify-start mb-2">
                        <div className="bg-brand-500/20 px-3 py-1 rounded-full flex items-center">
                          <span className="text-brand-400 font-bold mr-1">
                            Level {currentUserLevel}
                          </span>
                          <span className="text-gray-400 text-sm">
                            • {achievements?.unlockedAchievements?.length || 0}{" "}
                            Achievements
                          </span>
                        </div>
                      </div>

                      <div className="text-gray-400 text-sm mb-4">
                        <p>
                          XP: {currentUserXp} / {currentUserNextLevelXp}
                        </p>
                        <div className="w-full bg-dark-300 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full"
                            style={{ width: `${xpProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-dark-300/30 rounded-lg p-3 mb-2 max-w-md">
                        <h3 className="text-brand-400 font-semibold mb-1">
                          Token Listing Discount
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Your discount:</span>
                          <span className="text-white font-bold">
                            {discountPercent}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            Listing fee with discount:
                          </span>
                          <span className="text-white font-bold">
                            {finalCost.toFixed(4)} SOL
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-dark-300/50 flex items-center justify-center overflow-hidden border-4 border-brand-500/30">
                          {user?.profile_image?.url ? (
                            <img
                              src={
                                user.profile_image.thumbnail_url ||
                                user.profile_image.url
                              }
                              alt={user.nickname || "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-4xl">👤</div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-dark-200 border border-brand-500/30 flex items-center justify-center font-bold text-brand-400">
                          #
                          {rankingsWithUser.find(
                            (u) => u.wallet_address === user.wallet_address,
                          )?.rank || "?"}
                        </div>
                      </div>
                      <p className="mt-2 font-semibold text-white">
                        {user.nickname ||
                          user.wallet_address.slice(0, 6) +
                            "..." +
                            user.wallet_address.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Users */}
            <Card className="bg-dark-200/50 backdrop-blur-lg border border-brand-500/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Top Degens</h2>
                <div className="flex space-x-2">
                  <Button
                    variant={filter === "level" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setFilter("level")}
                  >
                    By Level
                  </Button>
                  <Button
                    variant={
                      filter === "achievements" ? "primary" : "secondary"
                    }
                    size="sm"
                    onClick={() => setFilter("achievements")}
                  >
                    By Achievements
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center p-3 rounded-lg bg-dark-300/30"
                    >
                      <div className="w-10 h-10 rounded-full bg-dark-300 mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-dark-300 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-dark-300 rounded w-1/3"></div>
                      </div>
                      <div className="w-16 h-8 bg-dark-300 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {rankingsWithUser.map((userRank) => {
                    const isCurrentUser =
                      isAuthenticated &&
                      userRank.wallet_address === user?.wallet_address;
                    return (
                      <div
                        key={userRank.wallet_address}
                        className={`flex items-center p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-brand-500/20 border border-brand-500/30"
                            : "bg-dark-300/30 hover:bg-dark-300/50"
                        } transition-colors`}
                      >
                        <div className="w-10 text-center font-bold text-gray-400">
                          #{userRank.rank}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-dark-300/50 flex items-center justify-center overflow-hidden border-2 border-dark-400/30 mr-3">
                          {userRank.profile_image?.url ? (
                            <img
                              src={
                                userRank.profile_image.thumbnail_url ||
                                userRank.profile_image.url
                              }
                              alt={userRank.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xl">👤</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {userRank.username}
                          </div>
                          <div className="text-sm text-gray-400">
                            {filter === "level"
                              ? `Level ${userRank.level} • ${userRank.xp}/${userRank.nextLevelXp} XP`
                              : `${userRank.achievements_count} Achievements`}
                          </div>
                        </div>
                        <div className="bg-dark-300/50 px-3 py-1 rounded-full text-sm">
                          <span
                            className={`font-semibold ${filter === "level" ? "text-brand-400" : "text-brand-300"}`}
                          >
                            {filter === "level"
                              ? `Level ${userRank.level}`
                              : `${userRank.achievements_count} 🏆`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Call to action for non-authenticated users */}
            {!isAuthenticated && (
              <div className="text-center mt-8">
                <p className="text-gray-400 mb-4">
                  Connect your wallet to see your Degen Level and unlock
                  discounts!
                </p>
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            )}

            {/* Link to submit tokens */}
            <div className="text-center mt-8">
              <Link to="/tokens/whitelist">
                <Button variant="primary" size="lg">
                  Submit Your Token
                </Button>
              </Link>
              <p className="text-gray-400 mt-2 text-sm">
                Leverage your Degen Level to get discounts on token submissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
