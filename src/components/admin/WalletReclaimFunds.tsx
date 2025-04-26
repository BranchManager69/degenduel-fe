import axios from "axios";
import React, { useState } from "react";

interface ReclaimFormValues {
  status_filter: string[];
  min_balance?: string;
  min_transfer?: string;
  contest_id?: string;
}

interface ReclaimResult {
  totalWallets: number;
  walletsThatMeetCriteria: number;
  successfulTransfers: number;
  failedTransfers: number;
  totalAmountReclaimed: number;
  details: ReclaimDetail[];
}

interface ReclaimDetail {
  wallet_address: string;
  contest_id: number;
  contest_code: string;
  balance: number;
  transferAmount?: number;
  status: string;
  signature?: string;
}

const WalletReclaimFunds: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReclaimResult | null>(null);
  const [formValues, setFormValues] = useState<ReclaimFormValues>({
    status_filter: ["completed", "cancelled"],
    min_balance: "0.001",
    min_transfer: "0.0005",
    contest_id: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (value: string) => {
    setFormValues((prev) => {
      const newStatusFilter = prev.status_filter.includes(value)
        ? prev.status_filter.filter((status) => status !== value)
        : [...prev.status_filter, value];

      return {
        ...prev,
        status_filter: newStatusFilter,
      };
    });
  };

  const handleReclaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // Transform values for API
      const payload = {
        status_filter: formValues.status_filter,
        min_balance: formValues.min_balance
          ? parseFloat(formValues.min_balance)
          : undefined,
        min_transfer: formValues.min_transfer
          ? parseFloat(formValues.min_transfer)
          : undefined,
        contest_id: formValues.contest_id
          ? parseInt(formValues.contest_id, 10)
          : undefined,
      };

      // Call the API
      const response = await axios.post(
        "/api/admin/wallet-management/reclaim-unused-funds",
        payload,
      );

      // Update state with results
      setResults(response.data.data);

      // Show success message (could be implemented with a toast notification)
      console.log(
        "Reclaim operation completed successfully:",
        response.data.message,
      );
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to reclaim funds",
      );
      console.error("Failed to reclaim funds:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form and results
  const handleReset = () => {
    setFormValues({
      status_filter: ["completed", "cancelled"],
      min_balance: "0.001",
      min_transfer: "0.0005",
      contest_id: "",
    });
    setResults(null);
    setError(null);
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "skipped_low_balance":
      case "skipped_small_transfer":
        return "text-amber-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-green-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-200">
          Reclaim Unused Contest Funds
        </h2>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-dark-300/50 text-gray-300 rounded-md hover:bg-dark-300/80 transition-colors"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleReclaim} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Contest Status Filter
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formValues.status_filter.includes("completed")}
                onChange={() => handleCheckboxChange("completed")}
                className="rounded bg-dark-300 border-gray-600 text-green-500 focus:ring-green-500"
              />
              <span className="text-gray-300">Completed</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formValues.status_filter.includes("cancelled")}
                onChange={() => handleCheckboxChange("cancelled")}
                className="rounded bg-dark-300 border-gray-600 text-green-500 focus:ring-green-500"
              />
              <span className="text-gray-300">Cancelled</span>
            </label>
          </div>
          {formValues.status_filter.length === 0 && (
            <p className="mt-1 text-xs text-red-400">
              Please select at least one status
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum Balance (SOL)
              <span className="ml-2 text-xs text-gray-500">
                Minimum balance a wallet must have to be considered
              </span>
            </label>
            <input
              type="number"
              name="min_balance"
              value={formValues.min_balance}
              onChange={handleInputChange}
              step="0.0001"
              min="0"
              placeholder="0.001"
              className="w-full bg-dark-300/50 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum Transfer Amount (SOL)
              <span className="ml-2 text-xs text-gray-500">
                Minimum amount to transfer (to avoid dust transfers)
              </span>
            </label>
            <input
              type="number"
              name="min_transfer"
              value={formValues.min_transfer}
              onChange={handleInputChange}
              step="0.0001"
              min="0"
              placeholder="0.0005"
              className="w-full bg-dark-300/50 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Specific Contest ID (Optional)
            <span className="ml-2 text-xs text-gray-500">
              Leave empty to reclaim from all eligible contest wallets
            </span>
          </label>
          <input
            type="text"
            name="contest_id"
            value={formValues.contest_id}
            onChange={handleInputChange}
            placeholder="Enter contest ID"
            className="w-full bg-dark-300/50 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || formValues.status_filter.length === 0}
            className={`px-4 py-2 rounded-lg font-medium ${
              loading || formValues.status_filter.length === 0
                ? "bg-green-700/30 text-green-300/50 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-500 transition-colors"
            }`}
          >
            {loading ? "Processing..." : "Reclaim Unused Funds"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-300">Processing reclaim operation...</p>
        </div>
      )}

      {results && (
        <div className="mt-8">
          <div className="h-px bg-gray-700 my-6"></div>
          <h3 className="text-xl font-bold text-green-200 mb-4">
            Reclaim Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-300/50 p-4 rounded-lg border border-green-500/10">
              <div className="text-xs text-gray-400 mb-1">Total Wallets</div>
              <div className="text-xl font-bold text-white">
                {results.totalWallets}
              </div>
            </div>
            <div className="bg-dark-300/50 p-4 rounded-lg border border-green-500/10">
              <div className="text-xs text-gray-400 mb-1">Eligible Wallets</div>
              <div className="text-xl font-bold text-white">
                {results.walletsThatMeetCriteria}
              </div>
            </div>
            <div className="bg-dark-300/50 p-4 rounded-lg border border-green-500/10">
              <div className="text-xs text-gray-400 mb-1">
                Successful Transfers
              </div>
              <div className="text-xl font-bold text-green-400">
                {results.successfulTransfers}
              </div>
            </div>
            <div className="bg-dark-300/50 p-4 rounded-lg border border-green-500/10">
              <div className="text-xs text-gray-400 mb-1">Failed Transfers</div>
              <div className="text-xl font-bold text-red-400">
                {results.failedTransfers}
              </div>
            </div>
            <div className="bg-dark-300/50 p-4 rounded-lg border border-green-500/10 col-span-1 md:col-span-2 lg:col-span-1">
              <div className="text-xs text-gray-400 mb-1">
                Total Amount Reclaimed
              </div>
              <div className="text-xl font-bold text-green-400">
                {results.totalAmountReclaimed.toFixed(6)} SOL
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-dark-300/30 rounded-lg overflow-hidden">
              <thead className="bg-dark-400/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contest ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contest Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount Transferred
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {results.details.map((detail, index) => (
                  <tr
                    key={detail.wallet_address}
                    className={
                      index % 2 === 0 ? "bg-dark-300/20" : "bg-dark-300/40"
                    }
                  >
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {detail.contest_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {detail.contest_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <a
                        href={`https://solscan.io/account/${detail.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 hover:underline"
                      >
                        {detail.wallet_address.substring(0, 8)}...
                        {detail.wallet_address.substring(
                          detail.wallet_address.length - 4,
                        )}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {detail.balance.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {detail.transferAmount?.toFixed(6) || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusColor(detail.status)}>
                        {formatStatus(detail.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {detail.signature ? (
                        <a
                          href={`https://solscan.io/tx/${detail.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-300 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletReclaimFunds;
