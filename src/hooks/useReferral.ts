import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { ddApi } from "../services/dd-api";
import { ReferralAnalytics } from "../types/referral.types";

// Referrer profile information
interface ReferrerProfile {
  nickname: string;
  wallet_address: string;
  profile_image?: {
    url: string;
    thumbnail_url?: string;
  };
}

// Reward information
interface ReferralRewards {
  user_bonus: string;
  referrer_bonus: string;
}

interface ReferralContextType {
  referralCode: string | null;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  clearReferral: () => void;
  trackConversion: () => Promise<void>;
  analytics: ReferralAnalytics | null;
  refreshAnalytics: () => Promise<void>;
  referrerProfile: ReferrerProfile | null;
  referralRewards: ReferralRewards | null;
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
      ua,
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
  const [referrerProfile, setReferrerProfile] =
    useState<ReferrerProfile | null>(null);
  const [referralRewards, setReferralRewards] =
    useState<ReferralRewards | null>(null);
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

  // Function to fetch referrer profile details
  const fetchReferrerDetails = async (code: string) => {
    try {
      console.log("[Referral] Fetching referrer details for code:", code);
      // Only fetch referrer details if the code passes validation (A-Z, 0-9, underscore, 4-20 chars)
      if (!/^[A-Z0-9_]{4,20}$/.test(code)) {
        console.warn("[Referral] Invalid code format, skipping details fetch:", code);
        return null;
      }
      
      const response = await fetch(
        `/api/referrals/details?code=${encodeURIComponent(code)}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch referrer details: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("[Referral] Received referrer details:", data);

      if (data.referrer) {
        setReferrerProfile(data.referrer);
      }

      if (data.rewards) {
        setReferralRewards(data.rewards);
      }

      return data;
    } catch (error) {
      console.error("[Referral] Error fetching referrer details:", error);
      return null;
    }
  };

  useEffect(() => {
    // Primary method: Check for referral code in URL query parameters
    const params = new URLSearchParams(location.search);
    let ref = params.get("ref");

    // No secondary method - we ONLY support ?ref=CODE in query parameters
    // The old code incorrectly processed URL path segments as potential referral codes
    // which caused regular navigation to trigger unintended referral tracking

    // Enhanced logging for troubleshooting
    console.log("[Referral] Processing URL:", window.location.href);
    console.log("[Referral] URL Path:", location.pathname);
    console.log("[Referral] URL Search:", location.search);
    console.log("[Referral] URL Hash:", location.hash);
    console.log("[Referral] Found referral code:", ref ?? "none");

    // Debug info for developers
    if (import.meta.env.DEV) {
      console.log(
        "[Referral Debug] All URL params:",
        Object.fromEntries(params.entries()),
      );
      console.log(
        "[Referral Debug] Path segments:",
        location.pathname.split("/").filter(Boolean),
      );
    }

    if (ref) {
      // Validate referral code format - only uppercase letters, numbers, and underscores allowed
      // Must be 4-20 characters in length and UPPERCASE only (not case-insensitive)
      if (!/^[A-Z0-9_]{4,20}$/.test(ref)) {
        console.warn("[Referral] Invalid referral code format:", ref);
        return;
      }

      // Determine referral source
      const source = location.pathname.includes("/contests/")
        ? "contest"
        : location.pathname.includes("/profile/")
          ? "profile"
          : "direct";

      // Capture UTM parameters
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");

      // Generate session ID
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem("referral_session_id", newSessionId);

      // Create request payload
      const requestPayload = {
        referralCode: ref,
        sessionId: newSessionId,
        clickData: {
          source,
          device: getDeviceType(),
          browser: getBrowserInfo(),
          landingPage: location.pathname,
          ...(utmSource && { utmSource }),
          ...(utmMedium && { utmMedium }),
          ...(utmCampaign && { utmCampaign }),
          timestamp: new Date().toISOString(),
        },
      };

      console.log(
        "Referral Click Tracking - Request Payload:",
        JSON.stringify(requestPayload, null, 2),
      );

      // Save everything to localStorage
      localStorage.setItem("referral_code", ref);
      localStorage.setItem(
        "referral_metrics",
        JSON.stringify(requestPayload.clickData),
      );

      // Update state
      setReferralCode(ref);

      // Fetch referrer profile details
      fetchReferrerDetails(ref).catch((error) => {
        console.error("[Referral] Failed to fetch referrer details:", error);
      });

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

      // Send initial referral event to backend - only called for valid ?ref=CODE params
      ddApi
        .fetch("/api/referrals/analytics/click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestPayload),
        })
        .then(async (response) => {
          const responseData = await response.json().catch(() => null);
          console.log("Referral Click Tracking - Response:", {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });
          if (!response.ok) {
            throw new Error(
              `API Error: ${responseData?.error || response.statusText}`,
            );
          }
        })
        .catch((error) => {
          console.error("Failed to track referral click:", {
            error: error.message,
            stack: error.stack,
            requestPayload,
          });
        });
    }
  }, [location, navigate]);

  const trackConversion = async () => {
    if (referralCode && sessionId) {
      try {
        // Get stored metrics from localStorage
        const storedMetrics = localStorage.getItem("referral_metrics");
        const clickData = storedMetrics ? JSON.parse(storedMetrics) : null;

        // Calculate time to convert if we have original click timestamp
        const timeToConvert = clickData?.timestamp
          ? Date.now() - new Date(clickData.timestamp).getTime()
          : null;

        // Prepare conversion payload
        const conversionPayload = {
          referralCode,
          sessionId,
          conversionData: {
            timeToConvert,
            completedSteps: ["signup"], // Add more steps as needed
            qualificationStatus: "pending",
            convertedAt: new Date().toISOString(),
            originalClickData: clickData,
          },
        };

        // Track conversion
        const response = await ddApi.fetch("/referrals/analytics/conversion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(conversionPayload),
        });

        if (!response.ok) {
          throw new Error("Failed to track conversion");
        }

        // Refresh analytics after successful conversion
        await refreshAnalytics();

        // Clear stored metrics after successful conversion
        localStorage.removeItem("referral_metrics");
      } catch (error) {
        console.error("Failed to track referral conversion:", {
          error,
          referralCode,
          sessionId,
        });
        throw error;
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
    referrerProfile,
    referralRewards,
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
