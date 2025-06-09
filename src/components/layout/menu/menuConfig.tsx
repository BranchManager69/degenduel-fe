/**
 * Unified Menu Configuration
 * 
 * This file provides a centralized configuration for menu items used across
 * both desktop (UserMenu) and mobile (MobileMenuButton) menu components.
 * 
 * By maintaining a single source of truth for menu structure, we ensure
 * consistent navigation options across all device types.
 */

import { FaUserFriends } from "react-icons/fa";
import { User } from "../../../types";

// Define all menu items and sections in one place
export const getMenuItems = (user: User | null, _userLevel: number) => {
  // User Profile Section
  const profileItems = [
    {
      id: 'profile',
      label: "Profile",
      icon: ({ className }: { className?: string }) => (
        <svg 
          className={className}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      ),
      to: "/me"
    },
    // COMMENTED OUT: Degen Level menu item
    // {
    //   id: 'degen-level',
    //   label: "Degen Level",
    //   icon: FaTrophy,
    //   to: "/leaderboard",
    //   badge: userLevel > 0 ? `Lvl ${userLevel}` : undefined
    // },
    {
      id: 'contest-credits',
      label: "Contest Credits",
      icon: ({ className }: { className?: string }) => (
        <svg 
          className={className}
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      ),
      to: "/contest-credits",
    },
    // Removed "Noti's" item - moved to dedicated notifications dropdown
    {
      id: 'referrals',
      label: "Invite & Earn",
      icon: FaUserFriends,
      to: "/referrals",
    }
  ];

  // Contests Section
  const contestItems = [
    {
      id: 'browse-contests',
      label: "Browse Contests",
      to: "/contests"
    },
    ...(user ? [
      {
        id: 'my-contests',
        label: "My Contests",
        to: "/my-contests"
      },
      {
        id: 'my-portfolios',
        label: "My Portfolios",
        to: "/my-portfolios"
      }
    ] : [])
  ];

  // Tokens Section
  const tokenItems = [
    {
      id: 'browse-tokens',
      label: "Browse Tokens",
      to: "/tokens" // This route in App.tsx already points to TokensPage
    }
  ];

  // Rankings Section - REMOVED PER USER REQUEST
  const rankingItems: any[] = [];

  return {
    profileItems,
    contestItems,
    tokenItems,
    rankingItems
  };
};