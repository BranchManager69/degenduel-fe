import React, { useMemo, useState } from "react";

import { ddApi } from "../../services/dd-api";
import { User } from "../../types/index";
import { Button } from "../ui/Button";

interface UserBalanceManagementProps {
  users: User[];
}

export const UserBalanceManagement: React.FC<UserBalanceManagementProps> = ({
  users = [],
}) => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);
  const [balanceLabel, setBalanceLabel] = useState<string>("");

  // Sort users alphabetically by nickname/address and format for display
  const sortedUsers = useMemo(() => {
    const userArray = Array.isArray(users) ? users : [];
    return userArray.sort((a, b) => {
      const nameA = (a.nickname || a.wallet_address).toLowerCase();
      const nameB = (b.nickname || b.wallet_address).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  const formatBalance = (balance: number) => {
    return `${Math.round(balance).toLocaleString(
      "en-US",
    )} Bonus Points (Updated)`;
  };

  const handleUserChange = async (walletAddress: string) => {
    try {
      const selectedUser = users.find(
        (u) => u.wallet_address === walletAddress,
      );
      setSelectedUser(walletAddress);
      if (selectedUser) {
        const balanceData = await ddApi.balance.get(walletAddress);
        const balance = Math.round(parseFloat(balanceData.balance || "0"));
        setCurrentBalance(balance.toString());
        setBalanceLabel(formatBalance(balance));
      }
    } catch (err) {
      console.error("Failed to fetch user balance:", err);
      setError("Failed to fetch user balance");
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!selectedUser || !amount) {
        throw new Error("Please select a user and enter an amount");
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        throw new Error("Please enter a valid number");
      }

      await ddApi.admin.adjustUserBalance(selectedUser, numAmount);

      // After successful adjustment, fetch the new balance
      const balanceData = await ddApi.balance.get(selectedUser);
      const newBalance = Math.round(parseFloat(balanceData.balance || "0"));
      setCurrentBalance(newBalance.toString());
      setBalanceLabel(formatBalance(newBalance));

      setSuccess(
        `Successfully adjusted balance for user. Current balance: ${formatBalance(
          newBalance,
        )}`,
      );
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this right after the component declaration to see what we're getting
  console.log("Raw props in UserBalanceManagement:", {
    users,
    usersLength: users?.length,
    firstUser: users?.[0],
  });

  // Let's modify the dropdown to make sure we're editing the right thing
  console.log("UserBalanceManagement received users:", users);
  console.log("Sorted users:", sortedUsers);

  return (
    <div className="bg-dark-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">
        Manually Adjust User Points
      </h2>

      <form
        onSubmit={(e: React.FormEvent) => handleAdjustBalance(e)}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            DegenDuel Username
          </label>
          <select
            value={selectedUser}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
            required
          >
            <option value="">Select a user ({users?.length || 0} total)</option>
            {users?.map((user) => (
              <option key={user.wallet_address} value={user.wallet_address}>
                {user.nickname || "NoNameDegen"} (
                {user.wallet_address.slice(0, 4)}...
                {user.wallet_address.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        {currentBalance && (
          <div className="text-sm text-gray-400">
            Current Balance:{" "}
            <span className="text-gray-200">{balanceLabel}</span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            ± Points Adjustment
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
            placeholder="Enter amount (negative to deduct)"
            required
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Processing..." : "Adjust Points"}
        </Button>
      </form>
    </div>
  );
};
