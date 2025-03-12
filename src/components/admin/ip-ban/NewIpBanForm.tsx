// src/components/admin/ip-ban/NewIpBanForm.tsx

import React, { useState } from "react";
import { toast } from "react-hot-toast";

import { admin } from "../../../services/api/admin";
import { IpBanCreateParams } from "../../../types";

interface NewIpBanFormProps {
  onBanAdded: () => void;
}

export const NewIpBanForm: React.FC<NewIpBanFormProps> = ({ onBanAdded }) => {
  const [ipAddress, setIpAddress] = useState("");
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [trollLevel, setTrollLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default expiration to 24 hours from now
  const setDefaultExpiresAt = () => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString().substring(0, 16); // Format for datetime-local input
  };

  // Reset form to initial state
  const resetForm = () => {
    setIpAddress("");
    setReason("");
    setIsPermanent(false);
    setExpiresAt(setDefaultExpiresAt());
    setTrollLevel(1);
    setError(null);
  };

  // Validate IP address format
  const isValidIpAddress = (ip: string) => {
    // IPv4 regex pattern
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

    if (!ipv4Pattern.test(ip)) return false;

    // Validate each octet
    const octets = ip.split(".");
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate IP address
    if (!isValidIpAddress(ipAddress)) {
      setError("Please enter a valid IPv4 address");
      return;
    }

    // Validate reason
    if (!reason.trim()) {
      setError("Ban reason is required");
      return;
    }

    // Validate expiration for temporary bans
    if (!isPermanent && !expiresAt) {
      setError("Expiration date is required for temporary bans");
      return;
    }

    // Create ban data
    const banData: IpBanCreateParams = {
      ip_address: ipAddress,
      reason,
      is_permanent: isPermanent,
      troll_level: trollLevel,
    };

    // Add expiration for temporary bans
    if (!isPermanent) {
      banData.expires_at = new Date(expiresAt).toISOString();
    }

    try {
      setLoading(true);
      await admin.ipBan.add(banData);
      toast.success("IP address banned successfully");
      resetForm();
      onBanAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban IP address");
      toast.error("Failed to ban IP address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* IP Address */}
      <div>
        <label
          htmlFor="ipAddress"
          className="block text-sm font-medium text-gray-400 mb-1"
        >
          IP Address *
        </label>
        <input
          type="text"
          id="ipAddress"
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          placeholder="192.168.1.1"
          required
          className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {/* Ban Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-400 mb-1"
        >
          Reason *
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this IP being banned?"
          rows={2}
          required
          className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {/* Ban Type */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Ban Type
        </label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="permanent"
              checked={isPermanent}
              onChange={() => setIsPermanent(true)}
              className="mr-2"
            />
            <label htmlFor="permanent" className="text-white">
              Permanent Ban
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="temporary"
              checked={!isPermanent}
              onChange={() => {
                setIsPermanent(false);
                if (!expiresAt) setExpiresAt(setDefaultExpiresAt());
              }}
              className="mr-2"
            />
            <label htmlFor="temporary" className="text-white">
              Temporary Ban
            </label>
          </div>
        </div>
      </div>

      {/* Expiration Date (only for temporary bans) */}
      {!isPermanent && (
        <div>
          <label
            htmlFor="expiresAt"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Expires At *
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
            className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
      )}

      {/* Troll Level */}
      <div>
        <label
          htmlFor="trollLevel"
          className="block text-sm font-medium text-gray-400 mb-1"
        >
          Troll Level
        </label>
        <select
          id="trollLevel"
          value={trollLevel}
          onChange={(e) => setTrollLevel(Number(e.target.value))}
          className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value={1}>Level 1 - Basic</option>
          <option value={2}>Level 2 - Moderate</option>
          <option value={3}>Level 3 - High</option>
          <option value={4}>Level 4 - Severe</option>
          <option value={5}>Level 5 - Maximum</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Determines trolling response level to banned users.
        </p>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Banning..." : "Ban IP Address"}
        </button>
      </div>
    </form>
  );
};
