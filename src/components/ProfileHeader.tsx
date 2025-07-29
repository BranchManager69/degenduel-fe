// src/components/ProfileHeader.tsx

/**
 * Profile Header Component
 * 
 * @description Reusable profile header with username, wallet, level/title, XP, and profile picture
 * Shows username (clickable), wallet address (click to copy), level+title badge, XP badge, and profile image
 * 
 * @author BranchManager69
 * @created 2025-07-26
 */

import React from 'react';
import { getFullImageUrl } from '../utils/profileImageUtils';

interface UserLevel {
  level_number: number;
  title: string;
}

interface User {
  nickname?: string;
  profile_image_url?: string;
  wallet_address?: string;
  user_level?: UserLevel | null;
  experience_points?: number;
}

interface ProfileHeaderProps {
  user: User | null;
  className?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  className = '',
}) => {
  const walletAddress = user?.wallet_address;

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="text-right">
        {/* Row 1: Username */}
        <a href="/me" className="text-lg font-semibold text-white hover:text-gray-200 hover:underline transition-all duration-200">
          {user?.nickname || 'Unknown'}
        </a>
        
        {/* Row 2: Wallet address */}
        {walletAddress && (
          <div className="flex justify-end mt-0.5">
            <button
              onClick={() => {
                navigator.clipboard.writeText(walletAddress);
                // You might want to add a toast notification here
              }}
              className="text-gray-500 hover:text-gray-400 transition-colors text-xs font-mono flex items-center gap-1"
            >
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Row 3: Combined Level/Title and XP */}
        <div className="flex items-center mt-1 justify-end">
          <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-l text-xs font-medium border border-amber-500/30">
            LVL {user?.user_level?.level_number || 0} • {user?.user_level?.title || 'Unranked'}
          </span>
          <span className="bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-r text-xs font-medium border border-gray-600/30 border-l-0">
            {(user?.experience_points || 0).toLocaleString()} XP
          </span>
        </div>
      </div>
      {user?.profile_image_url && (
        <a href="/me" className="relative hover:opacity-90 transition-opacity">
          <img 
            src={getFullImageUrl(user.profile_image_url)} 
            alt={user.nickname || ''}
            className="w-20 h-16 object-cover rounded-r-lg shadow-inner cursor-pointer"
            style={{ boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-900/20 to-transparent pointer-events-none rounded-l-lg"></div>
        </a>
      )}
    </div>
  );
};

export default ProfileHeader;