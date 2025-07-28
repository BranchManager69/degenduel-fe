import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ddApi } from "../../services/dd-api";
import { ReferrerDetails } from "../../types/referral.types";

interface ReferralContextType {
  referralCode: string | null;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  clearReferral: () => void;
  trackSignup: () => Promise<void>;
  referrerProfile: ReferrerDetails | null;
}

const ReferralContext = createContext<ReferralContextType | null>(null);

export const ReferralProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [referrerProfile, setReferrerProfile] = useState<ReferrerDetails | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load referral state from localStorage on mount
  useEffect(() => {
    const savedReferral = localStorage.getItem("referral_code");
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");

    if (savedReferral) {
      setReferralCode(savedReferral);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  // Fetch referrer profile details
  const fetchReferrerDetails = async (code: string) => {
    try {
      if (!/^[A-Z0-9_]{4,20}$/.test(code)) {
        console.warn("Invalid referral code format:", code);
        return;
      }
      
      const response = await ddApi.fetch(`/api/referrals/details?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) return;

      const data = await response.json();
      setReferrerProfile(data);
    } catch (error) {
      console.error("Error fetching referrer details:", error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");

    if (!ref) return;

    // Validate referral code format
    if (!/^[A-Z0-9_]{4,20}$/.test(ref)) {
      console.warn("Invalid referral code format:", ref);
      return;
    }

    // Save to localStorage
    localStorage.setItem("referral_code", ref);
    setReferralCode(ref);

    // Fetch referrer details
    fetchReferrerDetails(ref);

    // Show welcome modal if user hasn't seen it
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }

    // Clean URL
    params.delete("ref");
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    navigate(newUrl, { replace: true });
  }, [location.search, navigate]);

  const trackSignup = async () => {
    if (!referralCode) return;

    try {
      await ddApi.fetch("/api/referrals/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          referral_code: referralCode,
        }),
      });
    } catch (error) {
      console.error("Failed to track referral signup:", error);
    }
  };

  const clearReferral = () => {
    setReferralCode(null);
    setShowWelcomeModal(false);
    setReferrerProfile(null);
    localStorage.removeItem("referral_code");
    localStorage.removeItem("has_seen_welcome");
  };

  const value: ReferralContextType = {
    referralCode,
    showWelcomeModal,
    setShowWelcomeModal: (show: boolean) => {
      setShowWelcomeModal(show);
      if (!show) {
        localStorage.setItem("has_seen_welcome", "true");
      }
    },
    clearReferral,
    trackSignup,
    referrerProfile,
  };

  return React.createElement(ReferralContext.Provider, { value }, children);
};

export const useReferral = () => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return context;
};