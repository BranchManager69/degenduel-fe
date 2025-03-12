// src/components/ApiPlaygroundParts/UserDetail.tsx

import { format } from "date-fns";
import { useState } from "react";

import { UserBanModal } from "../admin/BanUserModal";
import { UserSearch } from "../admin/UserSearch";
import { CopyToClipboard } from "../common/CopyToClipboard";

// TODO: Move elsewhere
type Role = "SUPERADMIN" | "ADMIN" | "USER";

// TODO: Move elsewhere
const ROLE_HIERARCHY: Record<Role, number> = {
  SUPERADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

// TODO: Move to types/index.ts
interface UserStats {
  contests_entered: number;
  contests_won: number;
  total_prize_money: string;
  best_score: string;
  avg_score: string;
  last_updated: string;
}

// TODO: Move to types/index.ts
interface UserResponse {
  wallet_address: string;
  nickname: string;
  role: string;
  is_banned: boolean;
  ban_reason: string | null;
  balance: string;
  total_contests: number;
  total_wins: number;
  total_earnings: string;
  rank_score: number;
  created_at: string;
  last_login: string;
  user_stats: UserStats;
}

// Helper function to determine if a user can ban another user
const canBanUser = (adminRole: string, targetRole: string) => {
  // First normalize roles to uppercase for consistent hierarchy checking
  const adminRoleUpper = adminRole.toUpperCase() as Role;
  const targetRoleUpper = targetRole.toUpperCase() as Role;

  const adminLevel = ROLE_HIERARCHY[adminRoleUpper] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRoleUpper] || 0;

  // Return true only if admin has higher role than target
  return adminLevel > targetLevel;
};

// Helper function to get ban button text
const getBanButtonText = (
  adminRole: string,
  targetRole: string,
  isTargetBanned: boolean,
) => {
  if (isTargetBanned) return "Already Banned";
  if (targetRole.toUpperCase() === "SUPERADMIN") return "Can't Ban Super Admin";
  if (targetRole.toUpperCase() === "ADMIN") return "Can't Ban Admin";
  if (!canBanUser(adminRole, targetRole)) return "Insufficient Permissions";
  return "Ban User";
};

// Add a helper function at the top with other helpers
const formatSolAmount = (
  amount: string | number | null | undefined,
): string => {
  const value = parseFloat(amount?.toString() || "0");
  return value.toFixed(2);
};

export function UserDetail() {
  const [walletAddress, setWalletAddress] = useState("");
  const [response, setResponse] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserRole = "SUPERADMIN"; // TODO: Get this from auth context
  const [showBanModal, setShowBanModal] = useState(false);

  const handleGetUserDetail = async () => {
    if (!walletAddress) {
      setError("Please select a user");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/users/${walletAddress}`,
        {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user details");
      console.error("Get User Detail Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (wallet: string) => {
    setWalletAddress(wallet);
    setError(null);
    setResponse(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Search User
          </label>
          <UserSearch
            onSearch={handleSearch}
            placeholder="Search by wallet address or nickname..."
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleGetUserDetail}
            disabled={!walletAddress || loading}
            className="w-full sm:w-auto px-6 py-2 bg-cyber-500 text-dark-100 rounded hover:bg-cyber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-dark-100 border-t-transparent" />
                Loading...
              </>
            ) : (
              "Get User Detail"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-dark-300/20 rounded border border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {response && (
        <div className="bg-dark-300/30 rounded-lg border border-dark-300 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-dark-300">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-1">
                  {response.nickname || "Anonymous"}
                </h3>
                <CopyToClipboard
                  text={response.wallet_address}
                  className="text-sm text-gray-400 hover:text-gray-300"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {response.role && (
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-cyber-500/10 text-cyber-400 rounded-full text-xs font-medium">
                      {response.role.toUpperCase()}
                    </span>
                  )}
                  {response.is_banned ? (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">
                        BANNED
                      </span>
                      <button
                        onClick={() => setShowBanModal(true)}
                        disabled={!canBanUser(currentUserRole, response.role)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          canBanUser(currentUserRole, response.role)
                            ? "bg-cyber-500 hover:bg-cyber-600 text-white"
                            : "bg-dark-400 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Unban User
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                        ACTIVE
                      </span>
                      <button
                        onClick={() => setShowBanModal(true)}
                        disabled={!canBanUser(currentUserRole, response.role)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          canBanUser(currentUserRole, response.role)
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-dark-400 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {getBanButtonText(
                          currentUserRole,
                          response.role,
                          response.is_banned,
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {response.ban_reason && (
              <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-400">
                Ban reason: {response.ban_reason}
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-100">
                Account Info
              </h4>
              <div className="space-y-2">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-gray-100 font-medium">
                    {formatSolAmount(response.balance)} SOL
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-gray-100">
                    {response.created_at
                      ? format(new Date(response.created_at), "PPp")
                      : "N/A"}
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Last Login:</span>
                  <span className="text-gray-100">
                    {response.last_login
                      ? format(new Date(response.last_login), "PPp")
                      : "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Contest Stats */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-100">
                Contest Stats
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-200/50 rounded p-3">
                  <p className="text-3xl font-semibold text-gray-100 mb-1">
                    {response.total_contests || 0}
                  </p>
                  <p className="text-sm text-gray-400">Total Contests</p>
                </div>
                <div className="bg-dark-200/50 rounded p-3">
                  <p className="text-3xl font-semibold text-gray-100 mb-1">
                    {response.total_contests > 0
                      ? (
                          (response.total_wins / response.total_contests) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </p>
                  <p className="text-sm text-gray-400">Win Rate</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Total Wins:</span>
                  <span className="text-gray-100">
                    {response.total_wins || 0}
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Total Earnings:</span>
                  <span className="text-gray-100">
                    {formatSolAmount(response.total_earnings)} SOL
                  </span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-gray-400">Rank Score:</span>
                  <span className="text-gray-100">
                    {response.rank_score || 0}
                  </span>
                </p>
              </div>
            </div>

            {/* User Stats */}
            {response.user_stats && (
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-lg font-medium text-gray-100">
                  Detailed Stats
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-dark-200/50 rounded p-3">
                    <p className="text-3xl font-semibold text-gray-100 mb-1">
                      {response.user_stats.contests_entered || 0}
                    </p>
                    <p className="text-sm text-gray-400">Contests Entered</p>
                  </div>
                  <div className="bg-dark-200/50 rounded p-3">
                    <p className="text-3xl font-semibold text-gray-100 mb-1">
                      {response.user_stats.contests_won || 0}
                    </p>
                    <p className="text-sm text-gray-400">Contests Won</p>
                  </div>
                  <div className="bg-dark-200/50 rounded p-3">
                    <p className="text-3xl font-semibold text-gray-100 mb-1">
                      {formatSolAmount(response.user_stats.total_prize_money)}{" "}
                      SOL
                    </p>
                    <p className="text-sm text-gray-400">Total Prize Money</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-400">Best Score:</span>
                      <span className="text-green-400">
                        {response.user_stats.best_score || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-400">Average Score:</span>
                      <span className="text-gray-100">
                        {response.user_stats.avg_score || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="text-gray-100">
                        {response.user_stats.last_updated
                          ? format(
                              new Date(response.user_stats.last_updated),
                              "PPp",
                            )
                          : "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ban/Unban Modal */}
      {response && (
        <UserBanModal
          isOpen={showBanModal}
          onClose={() => setShowBanModal(false)}
          onSuccess={handleGetUserDetail}
          userToBan={{
            wallet_address: response.wallet_address,
            nickname: response.nickname,
            is_banned: response.is_banned,
            role: response.role,
          }}
          mode={response.is_banned ? "unban" : "ban"}
        />
      )}
    </section>
  );
}
