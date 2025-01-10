import React from "react";
import { ddApi } from "../../services/dd-api";
import { User } from "../../types";
import { Card } from "../ui/Card";

interface UserManagementProps {
  users: User[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
  const handleBanUser = async (walletAddress: string) => {
    if (window.confirm("Are you sure you want to ban this user?")) {
      try {
        // Update this to use the correct API endpoint signature
        await ddApi.users.update(walletAddress, "banned");
        // Refresh user data or handle UI update
      } catch (error) {
        console.error("Failed to ban user:", error);
      }
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">User Management</h2>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Nickname
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.wallet_address}>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {user.nickname}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {user.wallet_address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        !user.is_banned
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {!user.is_banned ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleBanUser(user.wallet_address)}
                      className="text-red-400 hover:text-red-300 mr-2"
                      disabled={user.is_banned}
                    >
                      {user.is_banned ? "Banned" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default UserManagement;
