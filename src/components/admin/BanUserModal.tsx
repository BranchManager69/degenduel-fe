import { useState } from "react";
import { API_URL } from "../../config/config";

interface UserBanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToBan: {
    wallet_address: string;
    nickname?: string;
    is_banned?: boolean;
    role?: string;
  };
  mode: "ban" | "unban";
}

export function UserBanModal({
  isOpen,
  onClose,
  onSuccess,
  userToBan,
  mode,
}: UserBanModalProps) {
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    if (mode === "ban" && !banReason.trim()) {
      setError("Ban reason is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const endpoint = mode === "ban" ? "ban" : "unban";
      const banResponse = await fetch(
        `${API_URL}/admin/users/${userToBan.wallet_address}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: mode === "ban" ? JSON.stringify({ reason: banReason }) : null,
        }
      );

      const data = await banResponse.json();

      if (!banResponse.ok) {
        switch (banResponse.status) {
          case 400:
            throw new Error(
              mode === "ban" ? "Ban reason is required" : "Invalid request"
            );
          case 403:
            throw new Error(
              "You don't have permission to modify this user's ban status"
            );
          case 404:
            throw new Error("User not found");
          default:
            throw new Error(data.error || `Failed to ${mode} user`);
        }
      }

      onSuccess();
      onClose();
      setBanReason("");
    } catch (error) {
      console.error(`[BanUserModal] ${mode} user error:`, {
        error: error instanceof Error ? 
          { message: error.message, stack: error.stack } : 
          error,
        user: userToBan.wallet_address,
        nickname: userToBan.nickname,
        role: userToBan.role,
        roleUpperCase: userToBan.role?.toUpperCase(),
        mode,
        reason: banReason
      });
      setError(
        error instanceof Error ? error.message : `Failed to ${mode} user`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">
          {mode === "ban" ? "Ban User" : "Unban User"}
        </h3>
        <p className="text-gray-400 mb-4">
          Are you sure you want to {mode} {userToBan.nickname || "Anonymous"}?
          {mode === "ban" && " This action cannot be undone."}
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {mode === "ban" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Ban Reason
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter reason for ban..."
              className="w-full px-3 py-2 bg-dark-300/50 border border-dark-300 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyber-500 transition-colors"
              rows={3}
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              setBanReason("");
              setError(null);
            }}
            className="px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            disabled={(mode === "ban" && !banReason.trim()) || loading}
            className={`px-4 py-2 ${
              mode === "ban"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-cyber-500 hover:bg-cyber-600"
            } text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {mode === "ban" ? "Banning..." : "Unbanning..."}
              </>
            ) : mode === "ban" ? (
              "Ban User"
            ) : (
              "Unban User"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
