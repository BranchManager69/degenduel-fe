import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";

// Types
interface Wallet {
  id: string;
  address: string;
  type: string; // Allow any type instead of restricting
  balance: number;
  status: string; // Allow any status instead of restricting
  lastActivity: string;
  label?: string;
  tokens?: {
    mint: string;
    symbol: string;
    balance: number;
    dollarValue?: number;
  }[];
}

interface WalletStats {
  totalSOL: number;
  totalFiat: number;
  walletsByType: Record<string, number>;
  walletsByStatus: Record<string, number>;
}

interface WalletGenerationParams {
  count: number;
  type: string;
  initialBalance: number;
  label: string;
}

// Main Component
export const SuperAdminWalletManagement: React.FC = () => {
  // State
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [createWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    amount: 0.1,
    destination: "",
    token: "SOL",
  });
  const [generationParams, setGenerationParams] =
    useState<WalletGenerationParams>({
      count: 5,
      type: "liquidity",
      initialBalance: 0.5,
      label: "",
    });
  const [sortBy, setSortBy] = useState<"balance" | "type" | "status">(
    "balance",
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Functions
  const fetchWalletData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await ddApi.fetch("/api/superadmin/wallets");
      const data = await response.json();

      if (data.success) {
        const formattedWallets: Wallet[] = data.wallets.map((wallet: any) => ({
          id: wallet.id || wallet.address,
          address: wallet.address,
          type: wallet.type || wallet.purpose || "unknown",
          balance: wallet.balance || 0,
          status: wallet.status || "unknown",
          lastActivity: wallet.lastActivity || Date.now(),
          label: wallet.label || wallet.purpose || "Wallet",
          tokens: wallet.tokens || [],
        }));

        // Process wallet stats
        const totalSOL = formattedWallets.reduce(
          (sum: number, wallet: Wallet) => sum + wallet.balance,
          0,
        );
        const totalFiat = totalSOL * 100; // Simple conversion - would normally use real rates

        // Count wallets by type dynamically
        const walletsByType: Record<string, number> = {};
        formattedWallets.forEach((wallet) => {
          if (!walletsByType[wallet.type]) {
            walletsByType[wallet.type] = 0;
          }
          walletsByType[wallet.type]++;
        });

        // Count wallets by status dynamically
        const walletsByStatus: Record<string, number> = {};
        formattedWallets.forEach((wallet) => {
          if (!walletsByStatus[wallet.status]) {
            walletsByStatus[wallet.status] = 0;
          }
          walletsByStatus[wallet.status]++;
        });

        setWallets(formattedWallets);
        setStats({
          totalSOL,
          totalFiat,
          walletsByType,
          walletsByStatus,
        });
      } else {
        throw new Error(data.error || "Failed to fetch wallet data");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch wallet data",
      );
      toast.error("Failed to load wallet data");

      // Fallback to dummy data for demo
      setDummyData();
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const setDummyData = () => {
    const dummyWallets: Wallet[] = [
      {
        id: "w1",
        address: "DdKTuK94x2vdhvtRHTpAn72TPme9BzRJUb7HQpZQm9G1",
        type: "liquidity",
        balance: 123.45,
        status: "active",
        lastActivity: "2025-02-24T15:30:00Z",
        label: "Main Liquidity Pool",
        tokens: [
          {
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            symbol: "USDC",
            balance: 5000,
            dollarValue: 5000,
          },
          {
            mint: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
            symbol: "BTC",
            balance: 0.5,
            dollarValue: 25000,
          },
        ],
      },
      {
        id: "w2",
        address: "A8Rx3vQRmUpAyeMZkbRnx6rgNPTnKmZr5gD1vVSEJ6it",
        type: "faucet",
        balance: 75.2,
        status: "active",
        lastActivity: "2025-02-23T10:15:00Z",
        label: "Testnet Faucet",
        tokens: [
          {
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            symbol: "USDC",
            balance: 10000,
            dollarValue: 10000,
          },
        ],
      },
      {
        id: "w3",
        address: "BnA9NnvGuEfRYgbVX3HgT6XGzGrNNAtJdNXcacgStdEP",
        type: "admin",
        balance: 35.8,
        status: "inactive",
        lastActivity: "2025-02-20T08:45:00Z",
        label: "Admin Operations",
      },
      {
        id: "w4",
        address: "C7RJpGuNUqLFA8yhWbgQeNnbQj9mwxUfBwvrMqc3rsT8",
        type: "liquidity",
        balance: 245.1,
        status: "active",
        lastActivity: "2025-02-25T11:20:00Z",
        label: "Secondary Liquidity",
        tokens: [
          {
            mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            symbol: "USDT",
            balance: 8000,
            dollarValue: 8000,
          },
        ],
      },
      {
        id: "w5",
        address: "D8qYE2TZkMnSYnzu1EZQJoHnxEWbwKgmmKpTrVEpAJvx",
        type: "faucet",
        balance: 15.3,
        status: "reserved",
        lastActivity: "2025-02-22T16:50:00Z",
        label: "Community Rewards",
      },
      {
        id: "w6",
        address: "E1bncM2U1YdKFsGBELMrRkAFbkrFVLv8oVeiJ3XnDQdM",
        type: "admin",
        balance: 52.7,
        status: "active",
        lastActivity: "2025-02-24T09:10:00Z",
        label: "Developer Fund",
      },
      {
        id: "w7",
        address: "FnqKbMtQFcE5dfQP3iiN6vYwRwHDVbGN2qREhPAGE8cK",
        type: "liquidity",
        balance: 320.9,
        status: "active",
        lastActivity: "2025-02-25T14:05:00Z",
        label: "High-Value Pool",
        tokens: [
          {
            mint: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
            symbol: "SOL",
            balance: 320.9,
            dollarValue: 32090,
          },
        ],
      },
    ];

    const dummyStats = {
      totalSOL: 868.45,
      totalFiat: 80090,
      walletsByType: {
        liquidity: 3,
        faucet: 2,
        admin: 2,
      },
      walletsByStatus: {
        active: 5,
        inactive: 1,
        reserved: 1,
      },
    };

    setWallets(dummyWallets);
    setStats(dummyStats);
  };

  const generateWallets = async () => {
    try {
      const response = await ddApi.fetch("/api/superadmin/wallets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: generationParams.count,
          purpose: generationParams.type,
          initialBalance: generationParams.initialBalance,
          label: generationParams.label,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Successfully generated ${generationParams.count} ${generationParams.type} wallets`,
        );
        setCreateWalletModalOpen(false);
        fetchWalletData();
      } else {
        throw new Error(data.error || "Failed to generate wallets");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate wallets",
      );
    }
  };

  const updateWalletStatus = async (
    walletAddress: string,
    newStatus: "active" | "inactive",
  ) => {
    try {
      const endpoint = `/api/superadmin/wallets/${walletAddress}/${newStatus === "active" ? "activate" : "deactivate"}`;
      const response = await ddApi.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setWallets(
          wallets.map((wallet) =>
            wallet.address === walletAddress
              ? { ...wallet, status: newStatus }
              : wallet,
          ),
        );

        toast.success(`Wallet status updated to ${newStatus}`);
      } else {
        throw new Error(
          data.error ||
            `Failed to ${newStatus === "active" ? "activate" : "deactivate"} wallet`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update wallet status");
    }
  };

  const executeTransfer = async () => {
    try {
      if (!selectedWallet) return;

      const response = await ddApi.fetch("/api/superadmin/wallets/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: selectedWallet.address,
          toAddress: transferFormData.destination,
          amount: transferFormData.amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Successfully transferred ${transferFormData.amount} SOL`,
        );
        setTransferModalOpen(false);
        fetchWalletData();
      } else {
        throw new Error(data.error || "Transfer failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  // Filtered and sorted wallets
  const filteredWallets = wallets.filter((wallet) => {
    const matchesType = filterType === "all" || wallet.type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wallet.label?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sortedWallets = [...filteredWallets].sort((a, b) => {
    if (sortBy === "balance") return b.balance - a.balance;
    if (sortBy === "type") return a.type.localeCompare(b.type);
    return a.status.localeCompare(b.status);
  });

  // Helper function to get color based on wallet type
  const getTypeColor = (type: string) => {
    // Convert type to lowercase for consistent matching
    const normalizedType = type.toLowerCase();

    // Colors for different wallet types
    if (
      normalizedType.includes("liquidity") ||
      normalizedType.includes("pool")
    ) {
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    } else if (
      normalizedType.includes("faucet") ||
      normalizedType.includes("distributor")
    ) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    } else if (
      normalizedType.includes("admin") ||
      normalizedType.includes("management")
    ) {
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    } else if (
      normalizedType.includes("treasury") ||
      normalizedType.includes("reserve")
    ) {
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    } else if (
      normalizedType.includes("contest") ||
      normalizedType.includes("event")
    ) {
      return "bg-pink-500/20 text-pink-400 border-pink-500/30";
    }

    // Default color if no match
    return "bg-brand-500/20 text-brand-400 border-brand-500/30";
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes("active")) {
      return "bg-green-500/20 text-green-400 border-green-500/30";
    } else if (status.toLowerCase().includes("inactive")) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    } else if (status.toLowerCase().includes("reserved")) {
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }

    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Format wallet description
  const formatWalletLabel = (wallet: Wallet) => {
    if (wallet.label) return wallet.label;
    if (wallet.type)
      return `${wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)} Wallet`;
    return "Wallet";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            WALLET COMMAND CENTER
          </h1>
          <p className="text-gray-400 mt-1 font-mono">
            SUPERADMIN_WALLET_MANAGEMENT_INTERFACE
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchWalletData}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-lg border border-brand-500/30 
              ${isRefreshing ? "bg-brand-500/10" : "bg-dark-200/50 hover:bg-brand-500/10"} 
              text-brand-400 transition-colors flex items-center gap-2`}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? "Syncing..." : "Refresh"}
          </button>

          <button
            onClick={() => setCreateWalletModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-cyber-500/30 bg-dark-200/50 hover:bg-cyber-500/10 text-cyber-400 transition-colors flex items-center gap-2"
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
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Generate Wallets
          </button>
        </div>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-1">
              Total Balance
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-brand-400">
                {stats.totalSOL.toFixed(2)}
              </span>
              <span className="ml-1 text-gray-400">SOL</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${stats.totalFiat.toLocaleString()}
            </div>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-2">
              Wallets by Type
            </div>
            <div className="space-y-2">
              {Object.entries(stats.walletsByType).map(
                ([type, count], index) => {
                  // Cycle through different colors for different types
                  const colors = [
                    { bg: "bg-cyan-500", text: "text-cyan-400" },
                    { bg: "bg-emerald-500", text: "text-emerald-400" },
                    { bg: "bg-amber-500", text: "text-amber-400" },
                    { bg: "bg-purple-500", text: "text-purple-400" },
                    { bg: "bg-pink-500", text: "text-pink-400" },
                    { bg: "bg-blue-500", text: "text-blue-400" },
                  ];
                  const colorIndex = index % colors.length;
                  const { bg, text } = colors[colorIndex];

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={text}>{type || "Unknown"}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-dark-300/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`${bg} h-full rounded-full`}
                          style={{
                            width: `${(count / wallets.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
            <div className="text-sm text-gray-400 font-normal mb-2">Status</div>
            <div className="space-y-2">
              {Object.entries(stats.walletsByStatus).map(([status, count]) => {
                // Assign colors based on status
                let bgColor = "bg-gray-500";
                let textColor = "text-gray-400";

                if (status.toLowerCase().includes("active")) {
                  bgColor = "bg-green-500";
                  textColor = "text-green-400";
                } else if (status.toLowerCase().includes("inactive")) {
                  bgColor = "bg-red-500";
                  textColor = "text-red-400";
                } else if (status.toLowerCase().includes("reserved")) {
                  bgColor = "bg-purple-500";
                  textColor = "text-purple-400";
                }

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={textColor}>{status || "Unknown"}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-dark-300/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${bgColor} h-full rounded-full`}
                        style={{ width: `${(count / wallets.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filterType === "all"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "border-dark-300 bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            All
          </button>

          {/* Dynamic filter buttons for each wallet type that exists in the data */}
          {stats &&
            Object.keys(stats.walletsByType).map((type, index) => {
              if (!type) return null;

              // Cycle through colors for different types
              const colors = [
                { active: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
                {
                  active:
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                },
                {
                  active: "border-amber-500/30 bg-amber-500/10 text-amber-400",
                },
                {
                  active:
                    "border-purple-500/30 bg-purple-500/10 text-purple-400",
                },
                { active: "border-pink-500/30 bg-pink-500/10 text-pink-400" },
                { active: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
              ];
              const colorIndex = index % colors.length;

              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filterType === type
                      ? colors[colorIndex].active
                      : "border-dark-300 bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("balance")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              sortBy === "balance"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "border-dark-300 bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Sort by Balance
          </button>
          <button
            onClick={() => setSortBy("type")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              sortBy === "type"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "border-dark-300 bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Sort by Type
          </button>
          <button
            onClick={() => setSortBy("status")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              sortBy === "status"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                : "border-dark-300 bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Sort by Status
          </button>
        </div>

        <div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wallets..."
              className="w-full bg-dark-300/30 border border-dark-300 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")}>×</button>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sortedWallets.map((wallet) => (
              <motion.div
                key={wallet.id}
                className={`
                  bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300/50 overflow-hidden flex flex-col
                  ${wallet.status.toLowerCase().includes("inactive") && "opacity-60"}
                `}
                whileHover={{
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.2 },
                }}
                layout
              >
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`px-2 py-0.5 text-xs rounded-full border ${getTypeColor(wallet.type)}`}
                    >
                      {wallet.type.toUpperCase()}
                    </div>
                    <div
                      className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(wallet.status)}`}
                    >
                      {wallet.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-gray-200 truncate">
                      {formatWalletLabel(wallet)}
                    </h3>
                    <p className="text-xs text-gray-400 break-all">
                      {wallet.address.substring(0, 8)}...
                      {wallet.address.substring(wallet.address.length - 8)}
                    </p>
                  </div>

                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-brand-400">
                      {wallet.balance.toFixed(2)}
                    </span>
                    <span className="ml-1 text-gray-400">SOL</span>
                  </div>

                  {wallet.tokens && wallet.tokens.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs text-gray-500">Token Balances</p>
                      {wallet.tokens.map((token) => (
                        <div
                          key={token.mint}
                          className="flex justify-between items-center"
                        >
                          <span className="text-xs text-gray-400">
                            {token.symbol}
                          </span>
                          <span className="text-xs text-gray-300">
                            {token.balance.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-dark-300/30 px-4 py-2 flex justify-between">
                  <button
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setTransferModalOpen(true);
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() =>
                      updateWalletStatus(
                        wallet.address,
                        wallet.status === "active" ? "inactive" : "active",
                      )
                    }
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {wallet.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Transfer Funds
            </h3>

            {selectedWallet && (
              <div className="mb-4 p-3 bg-dark-300/50 rounded-lg">
                <p className="text-sm text-gray-400">From Wallet</p>
                <p className="text-sm text-gray-300 break-all">
                  {selectedWallet.address}
                </p>
                <div className="mt-1 flex items-baseline">
                  <span className="text-brand-400 font-medium">
                    {selectedWallet.balance.toFixed(2)}
                  </span>
                  <span className="ml-1 text-gray-500 text-sm">
                    SOL available
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  value={transferFormData.destination}
                  onChange={(e) =>
                    setTransferFormData((prev) => ({
                      ...prev,
                      destination: e.target.value,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  placeholder="Enter wallet address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0.000001"
                    step="0.000001"
                    value={transferFormData.amount}
                    onChange={(e) =>
                      setTransferFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Token
                  </label>
                  <select
                    value={transferFormData.token}
                    onChange={(e) =>
                      setTransferFormData((prev) => ({
                        ...prev,
                        token: e.target.value,
                      }))
                    }
                    className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  >
                    <option value="SOL">SOL</option>
                    {selectedWallet?.tokens?.map((token) => (
                      <option key={token.mint} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-dark-300 hover:bg-dark-400 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeTransfer}
                className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Wallets Modal */}
      {createWalletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Generate New Wallets
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Number of Wallets
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={generationParams.count}
                  onChange={(e) =>
                    setGenerationParams((prev) => ({
                      ...prev,
                      count: Math.min(
                        50,
                        Math.max(1, parseInt(e.target.value) || 1),
                      ),
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 50 wallets per batch
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Wallet Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      setGenerationParams((prev) => ({
                        ...prev,
                        type: "liquidity",
                      }))
                    }
                    className={`px-3 py-2 rounded text-sm border ${
                      generationParams.type === "liquidity"
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                        : "border-dark-400 bg-dark-300 text-gray-400 hover:bg-dark-400"
                    }`}
                  >
                    Liquidity
                  </button>
                  <button
                    onClick={() =>
                      setGenerationParams((prev) => ({
                        ...prev,
                        type: "faucet",
                      }))
                    }
                    className={`px-3 py-2 rounded text-sm border ${
                      generationParams.type === "faucet"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-dark-400 bg-dark-300 text-gray-400 hover:bg-dark-400"
                    }`}
                  >
                    Faucet
                  </button>
                  <button
                    onClick={() =>
                      setGenerationParams((prev) => ({
                        ...prev,
                        type: "admin",
                      }))
                    }
                    className={`px-3 py-2 rounded text-sm border ${
                      generationParams.type === "admin"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-dark-400 bg-dark-300 text-gray-400 hover:bg-dark-400"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Initial Balance (SOL)
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={generationParams.initialBalance}
                  onChange={(e) =>
                    setGenerationParams((prev) => ({
                      ...prev,
                      initialBalance: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={generationParams.label}
                  onChange={(e) =>
                    setGenerationParams((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  className="w-full bg-dark-300 rounded px-3 py-2 text-gray-100 border border-dark-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  placeholder="e.g., April Contest Wallets"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCreateWalletModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-dark-300 hover:bg-dark-400 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateWallets}
                className="px-4 py-2 rounded-lg bg-cyber-500 hover:bg-cyber-600 text-white transition-colors flex items-center gap-2"
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
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Generate {generationParams.count} Wallets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
