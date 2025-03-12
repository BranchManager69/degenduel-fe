// src/components/auth/ReferralCodeInput.tsx

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

import { ddApi } from "../../services/dd-api";

interface ReferralCodeInputProps {
  walletAddress: string;
  onSuccess?: () => void;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [location]);

  const applyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    try {
      setLoading(true);
      const response = await ddApi.fetch("/api/referrals/apply", {
        method: "POST",
        body: JSON.stringify({
          referral_code: referralCode,
          wallet_address: walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Referral code applied successfully.");
        onSuccess?.();
      } else {
        throw new Error(data.message || "Failed to apply referral code");
      }
    } catch (err) {
      console.error("Failed to apply referral code:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to apply referral code",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-400">
          Referral Code (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            className="flex-1 px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
          />
          <button
            onClick={applyReferralCode}
            disabled={loading || !referralCode.trim()}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              loading || !referralCode.trim()
                ? "bg-brand-500/50 text-gray-400 cursor-not-allowed"
                : "bg-brand-500 text-white hover:bg-brand-600"
            }`}
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400">
        Have a referral code? Who knows; you might someday be glad you were
        referred by and/or referred another Degen.
      </p>
    </div>
  );
};
