import React, { useState } from "react";
import { adminService } from "../../services/adminService";
import { UserSearch } from "./UserSearch";

interface BalanceAdjustment {
  wallet_address: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  timestamp: string;
}

export const BalanceManager: React.FC = () => {
  const [selectedWallet, setSelectedWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<BalanceAdjustment | null>(null);

  const handleSearch = (wallet: string) => {
    setSelectedWallet(wallet);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet || !amount) {
      setError("Please select a user and enter an amount");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setError("Please enter a valid number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await adminService.adjustUserBalance(
        selectedWallet,
        numAmount
      );
      setSuccess({
        wallet_address: selectedWallet,
        amount: numAmount,
        previous_balance: parseFloat(result.previous_balance),
        new_balance: parseFloat(result.new_balance),
        timestamp: new Date().toISOString(),
      });
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-200 border border-dark-300 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dark-300">
        <h3 className="text-lg font-medium text-cyber-300">Balance Manager</h3>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyber-300 mb-1">
            Search User
          </label>
          <UserSearch
            onSearch={handleSearch}
            placeholder="Enter wallet address or nickname..."
          />
        </div>

        {selectedWallet && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-cyber-300 mb-1"
              >
                Adjustment Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (use negative for deductions)"
                  className="w-full px-4 py-2 bg-dark-300/50 border border-dark-300 rounded text-cyber-300 placeholder-cyber-300/50 focus:outline-none focus:border-cyber-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-brand-900/20 rounded">
                <p className="text-brand-500">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-dark-300/50 rounded space-y-2">
                <p className="text-cyber-300">Balance adjusted successfully:</p>
                <div className="font-mono text-sm space-y-1">
                  <p className="text-cyber-300">
                    Previous Balance:{" "}
                    <span className="text-cyber-400">
                      {success.previous_balance.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-cyber-300">
                    Adjustment:{" "}
                    <span
                      className={
                        success.amount >= 0
                          ? "text-green-400"
                          : "text-brand-500"
                      }
                    >
                      {success.amount >= 0 ? "+" : ""}
                      {success.amount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-cyber-300">
                    New Balance:{" "}
                    <span className="text-cyber-400">
                      {success.new_balance.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedWallet || !amount}
              className="w-full px-4 py-2 bg-cyber-500 text-dark-100 rounded hover:bg-cyber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Adjust Balance"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
