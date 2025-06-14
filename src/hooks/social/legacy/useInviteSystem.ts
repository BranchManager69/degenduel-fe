// src/hooks/useInviteSystem.ts

/**
 * Invite System Hook
 * 
 * This hook handles the invite code functionality:
 * - Detects invite codes in URL parameters
 * - Fetches inviter profile info
 * - Manages welcome modal state
 * - Handles basic conversion tracking
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ddApi } from "../../../services/dd-api";

// Inviter profile information
interface InviterProfile {
  nickname: string;
  wallet_address: string;
  profile_image?: {
    url: string;
    thumbnail_url?: string;
  };
}

// Reward information
interface InviteRewards {
  user_bonus: string;
  inviter_bonus: string;
}

interface InviteSystemContextType {
  inviteCode: string | null;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  clearInvite: () => void;
  trackSignup: () => Promise<void>;
  inviterProfile: InviterProfile | null;
  inviteRewards: InviteRewards | null;
}

const InviteSystemContext = createContext<InviteSystemContextType | null>(null);

export const InviteSystemProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [inviterProfile, setInviterProfile] = useState<InviterProfile | null>(null);
  const [inviteRewards, setInviteRewards] = useState<InviteRewards | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load invite state from localStorage on mount
  useEffect(() => {
    const savedInvite = localStorage.getItem("invite_code");
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");

    if (savedInvite) {
      setInviteCode(savedInvite);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  // Function to fetch inviter profile details
  const fetchInviterDetails = async (code: string) => {
    try {
      console.log("[Invite] Fetching inviter details for code:", code);
      // Only fetch inviter details if the code passes validation (A-Z, 0-9, underscore, 4-20 chars)
      if (!/^[A-Z0-9_]{4,20}$/.test(code)) {
        console.warn("[Invite] Invalid code format, skipping details fetch:", code);
        return null;
      }

      const response = await fetch(
        `/api/referrals/details?code=${encodeURIComponent(code)}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch inviter details: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("[Invite] Received inviter details:", data);

      if (data.inviter) {
        setInviterProfile(data.inviter);
      }

      if (data.rewards) {
        setInviteRewards(data.rewards);
      }

      return data;
    } catch (error) {
      console.error("[Invite] Error fetching inviter details:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check for invite code in URL query parameters
    const params = new URLSearchParams(location.search);
    let ref = params.get("ref");

    // Skip all processing if no invite code is present
    if (!ref) return;

    console.log("[Invite] Found invite code:", ref);

    // Validate invite code format
    if (!/^[A-Z0-9_]{4,20}$/.test(ref)) {
      console.warn("[Invite] Invalid invite code format:", ref);
      return;
    }

    // Save to localStorage
    localStorage.setItem("invite_code", ref);

    // Update state
    setInviteCode(ref);

    // Fetch inviter profile details
    fetchInviterDetails(ref).catch((error) => {
      console.error("[Invite] Failed to fetch inviter details:", error);
    });

    // Only show welcome modal if user hasn't seen it before
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }

    // Remove ref from URL without triggering a refresh
    ["ref"].forEach((param) => {
      params.delete(param);
    });
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""
      }`;
    navigate(newUrl, { replace: true });

    // Notify affiliate system (if it exists) about the invite code
    if (window.trackInviteClick && typeof window.trackInviteClick === 'function') {
      window.trackInviteClick(ref, location.pathname);
    }
  }, [location.search, navigate]);

  const trackSignup = async () => {
    if (!inviteCode) {
      console.warn("[Invite] No invite code to track");
      return;
    }

    try {
      console.log("[Invite] Tracking signup for invite code:", inviteCode);

      // Track signup with new API format
      const response = await ddApi.fetch("/api/referrals/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inviteCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success (200) - log referrer info if available
        console.log("[Invite] Successfully tracked signup", {
          referrer: data.referrer,
          message: data.message
        });

        if (data.referrer) {
          console.log("[Invite] Referred by:", {
            wallet: data.referrer.wallet_address,
            username: data.referrer.username
          });
        }

        // Notify affiliate system if it exists
        if (window.trackInviteConversion && typeof window.trackInviteConversion === 'function') {
          window.trackInviteConversion(inviteCode);
        }

        return data;
      } else {
        // Handle error responses based on status code and error message
        if (response.status === 400) {
          if (data.error === "Missing invite code") {
            console.error("[Invite] Missing invite code error");
            throw new Error("Invite code is required");
          } else if (data.error === "This invite code is no longer valid") {
            console.error("[Invite] Banned referrer - invite code no longer valid");
            throw new Error("This invite code is no longer valid");
          } else {
            console.error("[Invite] Bad request error:", data.error);
            throw new Error(data.error || "Invalid request");
          }
        } else if (response.status === 404 && data.error === "Invalid invite code") {
          console.error("[Invite] Invalid invite code error");
          throw new Error("Invalid invite code - please check and try again");
        } else {
          console.error("[Invite] Unexpected error:", {
            status: response.status,
            error: data.error,
            success: data.success
          });
          throw new Error(data.error || "Failed to track signup");
        }
      }
    } catch (error) {
      console.error("[Invite] Failed to track signup:", error);
      // Re-throw the error so calling code can handle it appropriately
      throw error;
    }
  };

  const clearInvite = () => {
    setInviteCode(null);
    setShowWelcomeModal(false);
    localStorage.removeItem("invite_code");
  };

  const value: InviteSystemContextType = {
    inviteCode,
    showWelcomeModal,
    setShowWelcomeModal: (show: boolean) => {
      setShowWelcomeModal(show);
      if (!show) {
        localStorage.setItem("has_seen_welcome", "true");
      }
    },
    clearInvite,
    trackSignup,
    inviterProfile,
    inviteRewards,
  };

  return React.createElement(InviteSystemContext.Provider, { value }, children);
};

export const useInviteSystem = () => {
  const context = useContext(InviteSystemContext);
  if (!context) {
    throw new Error("useInviteSystem must be used within an InviteSystemProvider");
  }
  return context;
};

// Add global interfaces for affiliate system integration
declare global {
  interface Window {
    trackInviteClick?: (code: string, landingPage: string) => void;
    trackInviteConversion?: (code: string) => void;
  }
}