import { useState } from "react";

import { useAuth } from "../../hooks/auth/legacy/useAuth";
import { UserBanModal } from "./BanUserModal";

interface BanOnSightButtonProps {
  user: {
    wallet_address: string;
    nickname?: string;
    is_banned?: boolean;
    role?: string;
  };
  size?: "sm" | "md" | "lg";
  variant?: "button" | "icon";
  className?: string;
  onSuccess?: () => void;
  currentUserRole?: string;
}

export function BanOnSightButton({
  user,
  size = "md",
  variant = "button",
  className = "",
  onSuccess,
  // currentUserRole is unused but kept for backward compatibility
}: BanOnSightButtonProps) {
  const [showBanModal, setShowBanModal] = useState(false);
  const { isAdmin, isSuperAdmin } = useAuth(); // Use the auth hook's built-in role checks

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Check if user has permission to ban
  const canBan = () => {
    // Don't allow banning already banned users
    if (user.is_banned) return false;

    // Use case-insensitive role comparison for safety
    const getRole = (roleStr?: string) => roleStr?.toLowerCase() || "user";
    const targetUserRole = getRole(user.role);

    // Log role information for debugging
    console.log("[BanOnSightButton] Checking ban permissions:", {
      targetUserRole,
      isSuperAdmin: isSuperAdmin(),
      isAdmin: isAdmin(),
      targetIsBanned: user.is_banned,
    });

    // Check permission rules:

    // 1. Only superadmins can ban other superadmins
    if (targetUserRole === "superadmin" && !isSuperAdmin()) {
      console.log(
        "[BanOnSightButton] Cannot ban superadmin: insufficient privileges",
      );
      return false;
    }

    // 2. Only superadmins can ban admins
    if (targetUserRole === "admin" && !isSuperAdmin()) {
      console.log(
        "[BanOnSightButton] Cannot ban admin: insufficient privileges",
      );
      return false;
    }

    // 3. Ensure current user has admin rights
    return isAdmin();
  };

  return (
    <>
      {variant === "button" ? (
        <button
          onClick={() => setShowBanModal(true)}
          disabled={!canBan()}
          className={`${sizeClasses[size]} rounded font-medium transition-colors ${
            canBan()
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-dark-400 text-gray-400 cursor-not-allowed"
          } ${className}`}
          title={
            user.is_banned
              ? "User is already banned"
              : "Ban this user immediately"
          }
        >
          {user.is_banned ? "Already Banned" : "Ban on Sight"}
        </button>
      ) : (
        <button
          onClick={() => setShowBanModal(true)}
          disabled={!canBan()}
          className={`rounded-full p-1.5 transition-colors ${
            canBan()
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-dark-400/20 text-gray-500 cursor-not-allowed"
          } ${className}`}
          title={
            user.is_banned
              ? "User is already banned"
              : "Ban this user immediately"
          }
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

      <UserBanModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onSuccess={() => {
          if (onSuccess) onSuccess();
          setShowBanModal(false);
        }}
        userToBan={user}
        mode="ban"
      />
    </>
  );
}
