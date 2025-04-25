import React, { useEffect, useState } from "react";
import { admin } from "../../services/api/admin";
import { VanityWalletListResponse } from "../../types";

// Counts by status
interface StatusCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  used: number;
  unused: number;
  total: number;
}

export const VanityWalletSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<StatusCounts>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    used: 0,
    unused: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      // We'll get all wallets and then calculate counts on the client side
      // In a production environment, ideally the API would provide these counts directly
      const response: VanityWalletListResponse = await admin.vanityWallets.list({
        limit: 1000, // Get as many as possible for the summary
      });

      // Calculate counts by status
      const newCounts: StatusCounts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        used: 0,
        unused: 0,
        total: response.wallets.length,
      };

      // Count by status
      response.wallets.forEach((wallet) => {
        newCounts[wallet.status] += 1;
        
        // Count used/unused (only completed wallets can be used)
        if (wallet.status === "completed") {
          // Let's assume a wallet with a wallet_address but no private_key has been used
          if (wallet.wallet_address && !wallet.private_key) {
            newCounts.used += 1;
          } else {
            newCounts.unused += 1;
          }
        }
      });

      setCounts(newCounts);
    } catch (error) {
      console.error("Failed to fetch vanity wallet summary data:", error);
      setError("Failed to load summary data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
      <h3 className="text-lg font-medium text-gray-100 mb-4">Vanity Wallet Summary</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Total Count */}
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Total Wallets</p>
          <p className="text-xl font-semibold text-gray-100">{counts.total}</p>
        </div>
        
        {/* Status Counts */}
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Completed</p>
          <p className="text-xl font-semibold text-green-400">{counts.completed}</p>
        </div>
        
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Pending</p>
          <p className="text-xl font-semibold text-yellow-400">{counts.pending}</p>
        </div>
        
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Processing</p>
          <p className="text-xl font-semibold text-blue-400">{counts.processing}</p>
        </div>
        
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Failed</p>
          <p className="text-xl font-semibold text-red-400">{counts.failed}</p>
        </div>
        
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Cancelled</p>
          <p className="text-xl font-semibold text-gray-400">{counts.cancelled}</p>
        </div>
        
        {/* Usage Counts */}
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Used</p>
          <p className="text-xl font-semibold text-brand-300">{counts.used}</p>
        </div>
        
        <div className="bg-dark-400/30 p-3 rounded-lg border border-dark-400">
          <p className="text-xs text-gray-400 mb-1">Available</p>
          <p className="text-xl font-semibold text-brand-400">{counts.unused}</p>
        </div>
      </div>
      
      {/* Refresh Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={fetchSummaryData}
          className="px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};