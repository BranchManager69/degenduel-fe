import React, { useState } from "react";

import { admin } from "../../services/api/admin";

interface BanIPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ipAddress: string;
}

const BanIPModal: React.FC<BanIPModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ipAddress,
}) => {
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiration, setExpiration] = useState("");
  const [trollLevel, setTrollLevel] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBanIP = async () => {
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    // Define banData outside the try block so it's available in the catch block
    const banData = {
      ip_address: ipAddress,
      reason: reason.trim(),
      is_permanent: isPermanent,
      expires_at: !isPermanent ? expiration : undefined,
      troll_level: trollLevel,
    };

    try {
      setLoading(true);
      setError(null);

      await admin.ipBan.add(banData);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[BanIPButton] Ban IP error:", {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
        ipAddress,
        request: banData,
        timestamp: new Date().toISOString(),
      });
      setError(
        error instanceof Error ? error.message : "Failed to ban IP address",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">
          Ban IP Address
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              IP Address
            </label>
            <div className="w-full px-3 py-2 bg-dark-300/70 border border-dark-300 rounded text-gray-100">
              {ipAddress}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Reason for Ban
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for banning this IP..."
              className="w-full px-3 py-2 bg-dark-300/50 border border-dark-300 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyber-500 transition-colors"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              id="permanent-ban"
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="h-4 w-4 text-cyber-500 focus:ring-cyber-500 border-dark-300 rounded"
            />
            <label
              htmlFor="permanent-ban"
              className="ml-2 block text-sm text-gray-400"
            >
              Permanent Ban
            </label>
          </div>

          {!isPermanent && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Expiration Date
              </label>
              <input
                type="datetime-local"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full px-3 py-2 bg-dark-300/50 border border-dark-300 rounded text-gray-100 focus:outline-none focus:border-cyber-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Troll Level (1-5)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={trollLevel}
                onChange={(e) => setTrollLevel(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 w-6">{trollLevel}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher levels receive more elaborate ban screens
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBanIP}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Banning...
              </>
            ) : (
              "Ban IP"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface BanIPButtonProps {
  ipAddress: string;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "icon";
  className?: string;
  onSuccess?: () => void;
}

export function BanIPButton({
  ipAddress,
  size = "md",
  variant = "button",
  className = "",
  onSuccess = () => {},
}: BanIPButtonProps) {
  const [showBanModal, setShowBanModal] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <>
      {variant === "button" ? (
        <button
          onClick={() => setShowBanModal(true)}
          className={`${sizeClasses[size]} rounded font-medium transition-colors bg-red-500 hover:bg-red-600 text-white ${className}`}
          title={`Ban IP: ${ipAddress}`}
        >
          Ban IP
        </button>
      ) : (
        <button
          onClick={() => setShowBanModal(true)}
          className={`rounded-full p-1.5 transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20 ${className}`}
          title={`Ban IP: ${ipAddress}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={
              size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
            }
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </button>
      )}

      <BanIPModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onSuccess={() => {
          onSuccess();
          setShowBanModal(false);
        }}
        ipAddress={ipAddress}
      />
    </>
  );
}
