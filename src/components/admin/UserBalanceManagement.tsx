import React, { useMemo, useState } from "react";
import { ddApi } from "../../services/dd-api";
import { User } from "../../types";
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

  // Sort users alphabetically by nickname/address and format for display
  const sortedUsers = useMemo(() => {
    const userArray = Array.isArray(users) ? users : [];
    return userArray.sort((a, b) => {
      const nameA = (a.nickname || a.wallet_address).toLowerCase();
      const nameB = (b.nickname || b.wallet_address).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  // Fetch balance when user is selected
  const handleUserSelect = async (walletAddress: string) => {
    setSelectedUser(walletAddress);
    if (walletAddress) {
      try {
        const balanceData = await ddApi.balance.get(walletAddress);
        setCurrentBalance(balanceData.balance?.toString());
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setCurrentBalance(null);
      }
    } else {
      setCurrentBalance(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Refresh the balance after adjustment
      const newBalance = await ddApi.balance.get(selectedUser);
      setCurrentBalance(
        newBalance.formatted_balance || newBalance.balance?.toString()
      );

      setSuccess(`Successfully adjusted balance for user`);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: string | number) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-dark-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">
        Adjust User Balance
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Select User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => handleUserSelect(e.target.value)}
            className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
            required
          >
            <option value="">Select a user...</option>
            {sortedUsers.map((user) => (
              <option key={user.wallet_address} value={user.wallet_address}>
                {user.nickname || user.wallet_address}
                {user.balance !== undefined &&
                  ` (${formatNumber(user.balance)} Bonus Points)`}
              </option>
            ))}
          </select>
        </div>

        {currentBalance && (
          <div className="text-sm text-gray-400">
            Current Balance:{" "}
            <span className="text-gray-200">
              {formatNumber(currentBalance)} Bonus Points
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            ± Balance Adjustment
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
            placeholder="Enter amount..."
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
          {isSubmitting ? "Processing..." : "Adjust Balance"}
        </Button>
      </form>
    </div>
  );
};
