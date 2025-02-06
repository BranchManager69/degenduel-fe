import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";
import { Card } from "../ui/Card";

interface ContestWallet {
  address: string;
  solBalance: number;
  tokens: Array<{
    mint: string;
    balance: number;
    address: string;
  }>;
  contest_info: {
    id: number;
    name: string;
    status: string;
  };
}

interface TransferFormData {
  fromWallet: string;
  toAddress: string;
  amount: string;
  description?: string;
}

export const WalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<ContestWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<ContestWallet | null>(
    null
  );
  const [transferForm, setTransferForm] = useState<TransferFormData>({
    fromWallet: "",
    toAddress: "",
    amount: "",
    description: "",
  });
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await ddApi.fetch(
        "/admin/wallet-management/contest-wallets"
      );
      const data = await response.json();
      setWallets(data.wallets);
    } catch (err) {
      setError("Failed to fetch wallet data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    try {
      setIsTransferring(true);
      await ddApi.fetch("/admin/wallet-management/transfer/sol", {
        method: "POST",
        body: JSON.stringify({
          from_wallet: transferForm.fromWallet,
          to_address: transferForm.toAddress,
          amount: parseFloat(transferForm.amount),
          description: transferForm.description,
        }),
      });

      toast.success("Transfer completed successfully");
      fetchWallets(); // Refresh wallet list
      setTransferForm({
        fromWallet: "",
        toAddress: "",
        amount: "",
        description: "",
      });
    } catch (err) {
      toast.error("Transfer failed");
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExportWallet = async (address: string) => {
    try {
      const response = await ddApi.fetch(
        `/admin/wallet-management/export-wallet/${address}`
      );
      const data = await response.json();

      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wallet-${address.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Wallet exported successfully");
    } catch (err) {
      toast.error("Failed to export wallet");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-300/50 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-dark-300/50 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((wallet) => (
          <Card
            key={wallet.address}
            className="bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-1">
                    Contest Wallet
                  </h3>
                  <p className="text-sm text-gray-400 font-mono">
                    {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWallet(wallet)}
                    className="px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 rounded-md transition-colors text-sm"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => handleExportWallet(wallet.address)}
                    className="px-3 py-1 bg-dark-300/50 hover:bg-dark-300/70 text-gray-300 rounded-md transition-colors text-sm"
                  >
                    Export
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">SOL Balance</span>
                  <span className="text-gray-100 font-mono">
                    {wallet.solBalance.toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Contest</span>
                  <span className="text-gray-100">
                    {wallet.contest_info.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      wallet.contest_info.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : wallet.contest_info.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {wallet.contest_info.status}
                  </span>
                </div>
              </div>

              {wallet.tokens.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Tokens
                  </h4>
                  <div className="space-y-1">
                    {wallet.tokens.map((token) => (
                      <div
                        key={token.mint}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-400 font-mono">
                          {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                        </span>
                        <span className="text-gray-100">{token.balance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Transfer Modal */}
      {selectedWallet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">
              Transfer SOL
            </h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  From Wallet
                </label>
                <input
                  type="text"
                  value={selectedWallet.address}
                  disabled
                  className="w-full bg-dark-300/50 border border-dark-400 rounded px-3 py-2 text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  To Address
                </label>
                <input
                  type="text"
                  value={transferForm.toAddress}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      toAddress: e.target.value,
                    })
                  }
                  className="w-full bg-dark-300/50 border border-dark-400 rounded px-3 py-2 text-gray-100"
                  placeholder="Enter recipient address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  step="0.000000001"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                  }
                  className="w-full bg-dark-300/50 border border-dark-400 rounded px-3 py-2 text-gray-100"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-dark-300/50 border border-dark-400 rounded px-3 py-2 text-gray-100"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedWallet(null)}
                  className="px-4 py-2 bg-dark-300 text-gray-300 rounded hover:bg-dark-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTransferring ? "Transferring..." : "Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
