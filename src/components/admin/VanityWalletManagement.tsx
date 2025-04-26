import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { admin } from "../../services/api/admin";
import { VanityWallet, VanityWalletListParams, VanityWalletStatus } from "../../types";

// Status color mapping for visual indicators
const STATUS_COLORS = {
  pending: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  processing: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
  },
  completed: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
  },
  failed: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
  },
  cancelled: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-400",
  },
};

// VanityWalletList component
export const VanityWalletList: React.FC = () => {
  const [wallets, setWallets] = useState<VanityWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VanityWalletListParams>({
    status: undefined,
    isUsed: undefined,
    pattern: "",
    limit: 100, // Always have a default for pagination
    offset: 0,  // Always have a default for pagination
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
  });
  const [selectedWallet, setSelectedWallet] = useState<VanityWallet | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  // Fetch wallets when filters change
  useEffect(() => {
    fetchWallets();
  }, [filters]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const response = await admin.vanityWallets.list(filters);
      setWallets(response.wallets);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch vanity wallets:", error);
      toast.error("Failed to fetch vanity wallets");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      status: value as VanityWalletStatus | undefined,
      offset: 0, // Reset pagination when filters change
    });
  };

  const handleUsedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      isUsed: value === "" ? undefined : value === "true",
      offset: 0, // Reset pagination when filters change
    });
  };

  const handlePatternSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      pattern: e.target.value,
      offset: 0, // Reset pagination when filters change
    });
  };

  const handlePageChange = (direction: "next" | "prev") => {
    // Ensure we have default values for offset and limit
    const currentOffset = filters.offset ?? 0;
    const currentLimit = filters.limit ?? 100;
    
    const newOffset = direction === "next" 
      ? currentOffset + currentLimit 
      : Math.max(0, currentOffset - currentLimit);
    
    setFilters({
      ...filters,
      offset: newOffset,
    });
  };

  const viewWalletDetails = async (id: number) => {
    try {
      const wallet = await admin.vanityWallets.get(id);
      setSelectedWallet(wallet);
      setShowDetailModal(true);
    } catch (error) {
      console.error(`Failed to get details for wallet ID ${id}:`, error);
      toast.error("Failed to load wallet details");
    }
  };

  const cancelWalletJob = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this vanity wallet job?")) {
      return;
    }
    
    setActionInProgress(id);
    try {
      await admin.vanityWallets.cancel(id);
      toast.success("Vanity wallet job cancelled successfully");
      // Update the wallet in the list
      setWallets(wallets.map(wallet =>
        wallet.id === id ? { ...wallet, status: "cancelled" } : wallet
      ));
    } catch (error) {
      console.error(`Failed to cancel wallet job with ID ${id}:`, error);
      toast.error("Failed to cancel wallet job");
    } finally {
      setActionInProgress(null);
    }
  };

  // Function to truncate wallet address for display
  const truncateAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-100">Vanity Wallet Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchWallets}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-300/30 p-4 rounded-lg border border-dark-300">
        <h3 className="text-md font-medium text-gray-100 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              id="statusFilter"
              value={filters.status || ""}
              onChange={handleStatusFilterChange}
              className="w-full bg-dark-400 border border-dark-300 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Used Filter */}
          <div>
            <label htmlFor="usedFilter" className="block text-sm text-gray-400 mb-1">Usage</label>
            <select
              id="usedFilter"
              value={filters.isUsed?.toString() || ""}
              onChange={handleUsedFilterChange}
              className="w-full bg-dark-400 border border-dark-300 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All</option>
              <option value="true">Used</option>
              <option value="false">Unused</option>
            </select>
          </div>

          {/* Pattern Search */}
          <div>
            <label htmlFor="patternSearch" className="block text-sm text-gray-400 mb-1">Pattern</label>
            <input
              id="patternSearch"
              type="text"
              value={filters.pattern || ""}
              onChange={handlePatternSearch}
              placeholder="Search patterns..."
              className="w-full bg-dark-400 border border-dark-300 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-dark-300/30 rounded-lg border border-dark-300">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No vanity wallets found matching the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-400/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Pattern</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Wallet Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Completed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300">
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-dark-400/20">
                    <td className="px-4 py-3 text-sm text-gray-200">{wallet.id}</td>
                    <td className="px-4 py-3 text-sm font-mono">
                      <span className="text-brand-400">
                        {wallet.is_suffix ? `*${wallet.pattern}` : `${wallet.pattern}*`}
                      </span>
                      {wallet.case_sensitive && <span className="ml-2 text-xs text-gray-400">(case sensitive)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-md ${STATUS_COLORS[wallet.status].bg} ${STATUS_COLORS[wallet.status].border} ${STATUS_COLORS[wallet.status].text}`}>
                        {wallet.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-200">
                      {truncateAddress(wallet.wallet_address)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {formatDate(wallet.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {formatDate(wallet.completed_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewWalletDetails(wallet.id)}
                          className="px-2 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded transition-colors text-xs"
                        >
                          View
                        </button>
                        {(wallet.status === "pending" || wallet.status === "processing") && (
                          <button
                            onClick={() => cancelWalletJob(wallet.id)}
                            disabled={actionInProgress === wallet.id}
                            className={`px-2 py-1 ${
                              actionInProgress === wallet.id
                                ? "bg-red-500/10 text-red-300/50"
                                : "bg-red-500/20 hover:bg-red-500/30 text-red-300"
                            } rounded transition-colors text-xs`}
                          >
                            {actionInProgress === wallet.id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-4 border-t border-dark-300">
          <div className="text-sm text-gray-400">
            Showing {(filters.offset ?? 0) + 1} to {Math.min((filters.offset ?? 0) + wallets.length, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange("prev")}
              disabled={(filters.offset ?? 0) === 0}
              className={`px-3 py-1 rounded-lg ${
                (filters.offset ?? 0) === 0
                  ? "bg-dark-400/30 text-gray-500"
                  : "bg-dark-400 hover:bg-dark-500 text-gray-200"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange("next")}
              disabled={(filters.offset ?? 0) + (filters.limit ?? 100) >= pagination.total}
              className={`px-3 py-1 rounded-lg ${
                (filters.offset ?? 0) + (filters.limit ?? 100) >= pagination.total
                  ? "bg-dark-400/30 text-gray-500"
                  : "bg-dark-400 hover:bg-dark-500 text-gray-200"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Details Modal */}
      {showDetailModal && selectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-dark-300 rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-dark-400 p-4">
              <h3 className="text-lg font-semibold text-gray-100">Vanity Wallet Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">ID</p>
                  <p className="text-gray-100">{selectedWallet.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pattern</p>
                  <p className="text-gray-100 font-mono">
                    {selectedWallet.is_suffix ? `*${selectedWallet.pattern}` : `${selectedWallet.pattern}*`}
                    {selectedWallet.case_sensitive && <span className="ml-2 text-xs text-gray-400">(case sensitive)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={`${STATUS_COLORS[selectedWallet.status].text}`}>{selectedWallet.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Wallet Address</p>
                  <p className="text-gray-100 font-mono break-all">
                    {selectedWallet.wallet_address || "Not generated yet"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created At</p>
                  <p className="text-gray-100">{formatDate(selectedWallet.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completed At</p>
                  <p className="text-gray-100">{formatDate(selectedWallet.completed_at)}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-dark-400">
                {(selectedWallet.status === "pending" || selectedWallet.status === "processing") && (
                  <button
                    onClick={() => {
                      cancelWalletJob(selectedWallet.id);
                      setShowDetailModal(false);
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                  >
                    Cancel Job
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-dark-400 hover:bg-dark-500 text-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};