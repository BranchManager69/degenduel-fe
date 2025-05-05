// src/hooks/useAffiliateSystem.ts

/**
 * Affiliate System Hook
 * 
 * This hook handles the affiliate tracking and analytics:
 * - Captures and processes UTM parameters
 * - Tracks affiliate clicks and conversions
 * - Provides analytics data for dashboards
 * - Manages affiliate rewards and leaderboards
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ddApi } from "../../../services/dd-api";
import { ReferralAnalytics } from "../../../types/referral.types";

// Device and browser detection utils
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

interface AffiliateSystemContextType {
  analytics: ReferralAnalytics | null;
  refreshAnalytics: () => Promise<void>;
  trackConversion: (referralCode: string) => Promise<void>;
}

const AffiliateSystemContext = createContext<AffiliateSystemContextType | null>(null);

export const AffiliateSystemProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const location = useLocation();

  // Set up global tracking handlers for invite system integration
  useEffect(() => {
    // Handler for invite clicks from the invite system
    window.trackInviteClick = (code, landingPage) => {
      trackClick(code, landingPage);
    };

    // Handler for invite conversions from the invite system
    window.trackInviteConversion = (code) => {
      trackConversion(code);
    };

    return () => {
      delete window.trackInviteClick;
      delete window.trackInviteConversion;
    };
  }, []);

  // Process UTM parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    // Only process if we have at least one UTM parameter
    if (!utmSource && !utmMedium && !utmCampaign) return;

    console.log("[Affiliate] Processing UTM parameters");

    // Generate session ID if needed
    if (!sessionId) {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem("affiliate_session_id", newSessionId);
    }

    // Track UTM parameters
    const utmData = {
      sessionId: sessionId || uuidv4(),
      utmParams: {
        utmSource,
        utmMedium,
        utmCampaign,
      },
      device: getDeviceType(),
      browser: getBrowserInfo(),
      landingPage: location.pathname,
      timestamp: new Date().toISOString(),
    };

    // Send UTM data to backend
    ddApi
      .fetch("/api/referrals/utm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(utmData),
      })
      .then(async (response) => {
        const responseData = await response.json().catch(() => null);
        console.log("[Affiliate] UTM tracking response:", {
          status: response.status,
          data: responseData,
        });
      })
      .catch((error) => {
        console.error("[Affiliate] Failed to track UTM parameters:", {
          error: error.message,
          utmData,
        });
      });

    // Remove UTM params from URL without triggering a reload
    ["utm_source", "utm_medium", "utm_campaign"].forEach((param) => {
      params.delete(param);
    });
  }, [location.search, sessionId]);

  const refreshAnalytics = async () => {
    try {
      const response = await ddApi.fetch("/api/referrals/analytics");
      const data = await response.json();
      setAnalytics(data);
      return data;
    } catch (error) {
      console.error("[Affiliate] Failed to fetch analytics:", error);
      throw error;
    }
  };

  // Track affiliate link click
  const trackClick = async (referralCode: string, landingPage: string) => {
    try {
      console.log("[Affiliate] Tracking click for code:", referralCode);
      
      // Generate session ID
      const sid = sessionId || uuidv4();
      if (!sessionId) {
        setSessionId(sid);
        localStorage.setItem("affiliate_session_id", sid);
      }

      // Determine source
      const source = landingPage.includes("/contests/")
        ? "contest"
        : landingPage.includes("/profile/")
          ? "profile"
          : "direct";

      // Create request payload
      const requestPayload = {
        referralCode,
        sessionId: sid,
        clickData: {
          source,
          device: getDeviceType(),
          browser: getBrowserInfo(),
          landingPage,
          timestamp: new Date().toISOString(),
        },
      };

      // Track click
      const response = await ddApi.fetch("/api/referrals/analytics/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to track click");
      }

      // Store session data for later conversion
      localStorage.setItem(
        "affiliate_metrics",
        JSON.stringify({
          referralCode,
          sessionId: sid,
          clickData: requestPayload.clickData,
        })
      );

      console.log("[Affiliate] Successfully tracked click");
    } catch (error) {
      console.error("[Affiliate] Failed to track click:", {
        error,
        referralCode,
      });
    }
  };

  // Track conversion
  const trackConversion = async (referralCode: string) => {
    try {
      console.log("[Affiliate] Tracking conversion for code:", referralCode);
      
      // Get session ID
      const sid = sessionId || localStorage.getItem("affiliate_session_id");
      if (!sid) {
        console.warn("[Affiliate] No session ID found for conversion tracking");
        return;
      }

      // Get stored metrics
      const storedMetricsStr = localStorage.getItem("affiliate_metrics");
      const storedMetrics = storedMetricsStr ? JSON.parse(storedMetricsStr) : null;
      const clickData = storedMetrics?.clickData;

      // Calculate time to convert
      const timeToConvert = clickData?.timestamp
        ? Date.now() - new Date(clickData.timestamp).getTime()
        : null;

      // Prepare conversion payload
      const conversionPayload = {
        referralCode,
        sessionId: sid,
        conversionData: {
          timeToConvert,
          completedSteps: ["signup"], // Add more steps as needed
          qualificationStatus: "pending",
          convertedAt: new Date().toISOString(),
          originalClickData: clickData,
        },
      };

      // Track conversion
      const response = await ddApi.fetch("/api/referrals/analytics/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(conversionPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to track conversion");
      }

      // Refresh analytics
      await refreshAnalytics();

      // Clear stored metrics
      localStorage.removeItem("affiliate_metrics");
      
      console.log("[Affiliate] Successfully tracked conversion");
    } catch (error) {
      console.error("[Affiliate] Failed to track conversion:", {
        error,
        referralCode,
      });
    }
  };

  const value: AffiliateSystemContextType = {
    analytics,
    refreshAnalytics,
    trackConversion,
  };

  return React.createElement(AffiliateSystemContext.Provider, { value }, children);
};

export const useAffiliateSystem = () => {
  const context = useContext(AffiliateSystemContext);
  if (!context) {
    throw new Error("useAffiliateSystem must be used within an AffiliateSystemProvider");
  }
  return context;
};

// Add global interfaces for invite system integration
declare global {
  interface Window {
    trackInviteClick?: (code: string, landingPage: string) => void;
    trackInviteConversion?: (code: string) => void;
  }
}