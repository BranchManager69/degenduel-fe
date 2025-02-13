import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ddApi } from "../services/dd-api";

interface ReferralMetrics {
  source: string; // 'direct' | 'contest' | 'profile' etc
  landingPage: string; // Which page they landed on
  timestamp: number;
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  device: string;
  browser: string;
}

interface ReferralAnalytics {
  clicks: {
    by_source: Record<string, number>;
    by_device: Record<string, number>;
    by_browser: Record<string, number>;
  };
  conversions: {
    by_source: Record<string, number>;
  };
  rewards: {
    by_type: Record<string, number>;
  };
}

interface ReferralContextType {
  referralCode: string | null;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  clearReferral: () => void;
  trackConversion: () => Promise<void>;
  analytics: ReferralAnalytics | null;
  refreshAnalytics: () => Promise<void>;
}

const ReferralContext = createContext<ReferralContextType | null>(null);

const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "unknown";
  if (ua.includes("Chrome")) browser = "chrome";
  else if (ua.includes("Firefox")) browser = "firefox";
  else if (ua.includes("Safari")) browser = "safari";
  else if (ua.includes("Edge")) browser = "edge";
  return browser;
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
};

export const ReferralProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load referral state from localStorage on mount
  useEffect(() => {
    const savedReferral = localStorage.getItem("referral_code");
    const savedSessionId = localStorage.getItem("referral_session_id");
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");

    if (savedReferral) {
      setReferralCode(savedReferral);
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  const refreshAnalytics = async () => {
    try {
      const response = await ddApi.fetch("/referrals/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch referral analytics:", error);
    }
  };

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");

    if (ref) {
      // Determine referral source
      const source = location.pathname.includes("/contests/")
        ? "contest"
        : location.pathname.includes("/profile/")
        ? "profile"
        : "direct";

      // Capture UTM parameters
      const utmParams = {
        source: params.get("utm_source") || undefined,
        medium: params.get("utm_medium") || undefined,
        campaign: params.get("utm_campaign") || undefined,
      };

      // Generate session ID
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem("referral_session_id", newSessionId);

      // Create metrics object
      const metrics: ReferralMetrics = {
        source,
        landingPage: location.pathname,
        timestamp: Date.now(),
        utmParams,
        device: getDeviceType(),
        browser: getBrowserInfo(),
      };

      // Save everything to localStorage
      localStorage.setItem("referral_code", ref);
      localStorage.setItem("referral_metrics", JSON.stringify(metrics));

      // Update state
      setReferralCode(ref);

      // Only show welcome modal if user hasn't seen it before
      const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }

      // Remove ref and UTM params from URL without triggering a refresh
      ["ref", "utm_source", "utm_medium", "utm_campaign"].forEach((param) => {
        params.delete(param);
      });
      const newUrl = `${location.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      navigate(newUrl, { replace: true });

      // Send initial referral event to backend
      ddApi
        .fetch("/referrals/analytics/click", {
          method: "POST",
          body: JSON.stringify({
            referralCode: ref,
            source,
            landingPage: location.pathname,
            utmParams,
            device: getDeviceType(),
            browser: getBrowserInfo(),
            sessionId: newSessionId,
          }),
        })
        .catch(console.error); // Non-blocking
    }
  }, [location, navigate]);

  const trackConversion = async () => {
    if (referralCode && sessionId) {
      try {
        await ddApi.fetch("/referrals/analytics/conversion", {
          method: "POST",
          body: JSON.stringify({
            referralCode,
            sessionId,
          }),
        });
        // Refresh analytics after conversion
        await refreshAnalytics();
      } catch (error) {
        console.error("Failed to track referral conversion:", error);
      }
    }
  };

  const clearReferral = () => {
    setReferralCode(null);
    setShowWelcomeModal(false);
    setSessionId(null);
    localStorage.removeItem("referral_code");
    localStorage.removeItem("referral_metrics");
    localStorage.removeItem("referral_session_id");
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
    trackConversion,
    analytics,
    refreshAnalytics,
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
