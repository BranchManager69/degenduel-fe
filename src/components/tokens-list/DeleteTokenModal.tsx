import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface DeleteTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tokenAddress: string;
  tokenSymbol?: string;
}

export const DeleteTokenModal: React.FC<DeleteTokenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tokenAddress,
  tokenSymbol,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Reason for removal is required");
      return;
    }

    setLoading(true);

    try {
      const response = await ddApi.fetch(`/api/v2/tokens/${tokenAddress}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove token");
      }

      if (data.message !== "Token removed successfully") {
        console.warn("Unexpected success response format:", data);
      }

      toast.success(
        `Token ${tokenSymbol || tokenAddress} removed successfully`,
        {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        }
      );

      // Reset form and close modal
      setReason("");
      onClose();

      // Trigger success callback
      onSuccess?.();

      // Refresh the page to update the token list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete token:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove token";
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
            <h2 className="text-xl font-bold text-gray-100">Remove Token</h2>
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
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="text-yellow-400 text-sm">
                Warning: This action cannot be undone. The token will be removed
                from the whitelist and will no longer be available in games.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Removal <span className="text-red-400">*</span>
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-gray-100 bg-dark-300"
                  placeholder="Enter reason for removal"
                  required
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
                  variant="primary"
                  disabled={loading}
                  className="min-w-[100px] bg-red-500 hover:bg-red-600"
                >
                  {loading ? "Removing..." : "Remove Token"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
