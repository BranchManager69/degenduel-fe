import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TokenSearch } from "../common/TokenSearch";
import { SearchToken } from "../../types";
// Note: Admin functionality still uses API for mutations
// WebSocket is read-only for token data

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contractAddress: "",
    chain: "SOLANA",
  });

  const handleTokenSearchSelect = (token: SearchToken) => {
    setFormData({
      ...formData,
      contractAddress: token.address,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await ddApi.fetch("/dd-serv/tokens", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Verify the response contains the token data
      if (!data.token || !data.token.contractAddress) {
        throw new Error("Invalid response from server");
      }

      console.log("Token added successfully:", {
        token: data.token,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      toast.success(
        `Token ${
          data.token.symbol || data.token.contractAddress
        } added successfully`,
        {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        },
      );

      // Reset form and close modal
      setFormData({ contractAddress: "", chain: "SOLANA" });
      onClose();

      // Trigger success callback
      onSuccess?.();

      // Refresh the page to show the new token
      window.location.reload();
    } catch (error) {
      console.error("Failed to add token:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add token";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 4000,
        position: "bottom-right",
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid #262626",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-dark-200 rounded-lg w-full max-w-md flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-gray-100">Add New Token</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Token (Optional)
                </label>
                <TokenSearch
                  onSelectToken={handleTokenSearchSelect}
                  placeholder="Search existing tokens to auto-fill address..."
                  variant="minimal"
                  showPriceData={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Address
                </label>
                <Input
                  value={formData.contractAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contractAddress: e.target.value.trim(),
                    })
                  }
                  className="w-full text-gray-100 bg-dark-300"
                  placeholder="Enter contract address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chain
                </label>
                <Select
                  value={formData.chain}
                  onChange={(value) =>
                    setFormData({ ...formData, chain: value })
                  }
                  options={[
                    { value: "SOLANA", label: "Solana" },
                    { value: "ETH", label: "Ethereum" },
                    { value: "BASE", label: "Base" },
                    { value: "BSC", label: "BSC" },
                  ]}
                  className="w-full text-gray-100"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-gray-300 border-gray-600 hover:bg-dark-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? "Adding..." : "Add Token"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
