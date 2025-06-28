/**
 * Role-based color system for DegenDuel
 * Provides consistent color styling across the app based on user roles
 */

export interface RoleColors {
  text: string;
  bg: string;
  border: string;
  glow?: string;
  hover?: {
    text: string;
    bg: string;
    border: string;
  };
}

// Flair types for cosmetic purposes (matches backend implementation)
export type FlairType = 'victor' | 'whale' | 'legend' | null;

/**
 * Get role-based colors for a user
 * @param user - User object with role information
 * @returns Color classes for the user's role
 */
export function getUserRoleColors(user: { is_superadmin?: boolean; is_admin?: boolean; role?: string } | null): RoleColors {
  if (!user) {
    return getDefaultColors();
  }

  // Check string-based role field first
  if (user.role) {
    if (user.role === "superadmin") {
      return {
        text: "text-yellow-300",
        bg: "bg-yellow-900/60",
        border: "border-yellow-500/50",
        glow: "drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]", // bright yellow glow
        hover: {
          text: "hover:text-yellow-200",
          bg: "hover:bg-yellow-800/70",
          border: "hover:border-yellow-400/60",
        }
      };
    }
    
    if (user.role === "admin") {
      return {
        text: "text-red-400",
        bg: "bg-red-900/60",
        border: "border-red-600/50",
        glow: "drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]", // red glow
        hover: {
          text: "hover:text-red-300",
          bg: "hover:bg-red-800/70",
          border: "hover:border-red-500/60",
        }
      };
    }
  }

  // Fall back to boolean flags for backward compatibility
  if (user.is_superadmin) {
    return {
      text: "text-yellow-300",
      bg: "bg-yellow-900/60",
      border: "border-yellow-500/50",
      glow: "drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]", // bright yellow glow
      hover: {
        text: "hover:text-yellow-200",
        bg: "hover:bg-yellow-800/70",
        border: "hover:border-yellow-400/60",
      }
    };
  }

  if (user.is_admin) {
    return {
      text: "text-red-400",
      bg: "bg-red-900/60",
      border: "border-red-600/50",
      glow: "drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]", // red glow
      hover: {
        text: "hover:text-red-300",
        bg: "hover:bg-red-800/70",
        border: "hover:border-red-500/60",
      }
    };
  }

  // Regular users - Purple theme (matches DUEL branding)
  return getDefaultColors();
}

/**
 * Get text-only role colors (for inline text like usernames)
 */
export function getUserNameColor(user: { is_superadmin?: boolean; is_admin?: boolean; role?: string } | null): string {
  if (!user) return "text-gray-300";
  
  // Check string role first
  if (user.role === "superadmin") return "text-yellow-300";
  if (user.role === "admin") return "text-red-400";
  
  // Fall back to boolean flags
  if (user.is_superadmin) return "text-yellow-300";
  if (user.is_admin) return "text-red-400";
  
  return "text-gray-300"; // Regular users get neutral color for better readability
}

/**
 * Get role badge/label for display
 */
export function getUserRoleLabel(user: { is_superadmin?: boolean; is_admin?: boolean; role?: string } | null): string | null {
  if (!user) return null;
  
  // Check string role first
  if (user.role === "superadmin") return "DEV";
  if (user.role === "admin") return "BETA TESTER";
  
  // Fall back to boolean flags
  if (user.is_superadmin) return "DEV";
  if (user.is_admin) return "BETA TESTER";
  
  return null; // Don't show labels for regular users
}

/**
 * Get a styled role badge component classes
 */
export function getRoleBadgeClasses(user: { is_superadmin?: boolean; is_admin?: boolean; role?: string } | null): string {
  if (!user) return "";
  
  // Check string role first
  if (user.role === "superadmin" || user.is_superadmin) {
    return "bg-yellow-900/80 text-yellow-300 border border-yellow-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full";
  }
  
  if (user.role === "admin" || user.is_admin) {
    return "bg-red-900/80 text-red-300 border border-red-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full";
  }
  
  return "";
}

/**
 * Default colors for regular users
 */
function getDefaultColors(): RoleColors {
  return {
    text: "text-purple-200",
    bg: "bg-purple-800/60",
    border: "border-purple-600/50",
    hover: {
      text: "hover:text-purple-100",
      bg: "hover:bg-purple-700/70",
      border: "hover:border-purple-500/60",
    }
  };
}

/**
 * Check if user has elevated privileges (admin or super admin)
 */
export function hasElevatedRole(user: { is_superadmin?: boolean; is_admin?: boolean } | null): boolean {
  return user?.is_superadmin === true || user?.is_admin === true;
}

/**
 * Get nickname by wallet address
 * This is a placeholder that returns a shortened wallet address
 * In the future, this should query a user cache or API
 */
export function getNicknameByWalletAddress(walletAddress: string | null | undefined): string {
  if (!walletAddress || walletAddress === "unknown") {
    return "Unknown Player";
  }
  
  // For now, return shortened wallet address
  // TODO: Implement actual user lookup from cache/API
  return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
}

/**
 * Get flair colors (cosmetic roles)
 * These don't affect permissions, just visual style
 */
export function getFlairColors(flair: FlairType): RoleColors | null {
  if (!flair) return null;
  
  switch (flair) {
    case 'victor':
      // Purple - for users with at least one victory
      return {
        text: "text-purple-400",
        bg: "bg-purple-900/60",
        border: "border-purple-600/50",
        glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]", // purple glow
        hover: {
          text: "hover:text-purple-300",
          bg: "hover:bg-purple-800/70",
          border: "hover:border-purple-500/60",
        }
      };
      
    case 'whale':
      // Vivid blue - for high rollers
      return {
        text: "text-blue-400",
        bg: "bg-blue-900/60",
        border: "border-blue-600/50",
        glow: "drop-shadow-[0_0_10px_rgba(59,130,246,0.7)]", // bright blue glow
        hover: {
          text: "hover:text-blue-300",
          bg: "hover:bg-blue-800/70",
          border: "hover:border-blue-500/60",
        }
      };
      
    case 'legend':
      // Emerald green - for legendary players (my suggestion for the last one)
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-900/60",
        border: "border-emerald-600/50",
        glow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]", // emerald glow
        hover: {
          text: "hover:text-emerald-300",
          bg: "hover:bg-emerald-800/70",
          border: "hover:border-emerald-500/60",
        }
      };
      
    default:
      return null;
  }
}

/**
 * Get combined colors - primary role takes precedence over flair
 * @param user - User object with role information
 * @param flair - The user's cosmetic flair
 */
export function getCombinedRoleColors(
  user: { is_superadmin?: boolean; is_admin?: boolean; role?: string } | null,
  flair?: FlairType
): RoleColors {
  // Primary roles (admin/superadmin) always take precedence
  const primaryColors = getUserRoleColors(user);
  
  // If user has a primary role color (admin/superadmin), use it
  if (user?.role === 'superadmin' || user?.role === 'admin' || 
      user?.is_superadmin || user?.is_admin) {
    return primaryColors;
  }
  
  // Otherwise, check for flair
  if (flair) {
    const flairColors = getFlairColors(flair);
    if (flairColors) return flairColors;
  }
  
  // Default to regular user colors
  return primaryColors;
}

/**
 * Get flair label
 */
export function getFlairLabel(flair: FlairType): string | null {
  if (!flair) return null;
  
  switch (flair) {
    case 'victor':
      return 'VICTOR';  // Short and punchy
    case 'whale':
      return 'WHALE';
    case 'legend':
      return 'LEGEND';
    default:
      return null;
  }
}

/**
 * Get colors for a user that has both role and flair fields
 * This is the main function to use when you have the full user data
 */
export function getUserColors(user: { 
  role?: string; 
  flair?: FlairType;
  is_superadmin?: boolean; 
  is_admin?: boolean;
} | null): RoleColors {
  return getCombinedRoleColors(user, user?.flair);
}

/**
 * Get name color for a user with flair
 */
export function getUserNameColorWithFlair(
  user: { role?: string; flair?: FlairType; is_superadmin?: boolean; is_admin?: boolean } | null
): string {
  const colors = getUserColors(user);
  return colors.text;
}