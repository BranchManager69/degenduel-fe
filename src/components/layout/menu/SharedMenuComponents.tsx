/**
 * Unified Menu Shared Components
 * 
 * This file contains shared components used by both desktop (UserMenu) and mobile (MobileMenuButton)
 * menu implementations. By sharing these components, we ensure consistent functionality and appearance
 * across different device types.
 * 
 * Components in this file:
 * - WalletDetailsSection: Displays wallet balances and links to wallet details
 * - BiometricAuthComponent: Handles biometric authentication options
 * - MenuBackdrop: Provides a consistent backdrop for menus across device types
 * - SectionHeader: Consistent section headers across menu types
 * - MenuDivider: Consistent divider styling
 */

import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';
import { FaFingerprint } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { config } from '../../../config/config';
import useBiometricAuth from '../../../hooks/auth/legacy/useBiometricAuth';
import { useStore } from "../../../store/useStore";
import { User } from "../../../types";
import SolanaTokenDisplay from '../../SolanaTokenDisplay';
import SolanaWalletDisplay from '../../SolanaWalletDisplay';

/**
 * Wallet Details Section - shared between both menu types
 * Displays SOL balance, token balance, and link to wallet details
 */
export const WalletDetailsSection: React.FC<{ user: User }> = ({ user }) => (
  <div className="p-3 bg-dark-300/50 border-b border-brand-500/20">
    <div className="flex flex-col gap-2">
      {/* SOL Balance */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">SOL Balance</span>
        <div className="text-sm font-medium text-white">
          <SolanaWalletDisplay walletAddress={user.wallet_address} compact={true} />
        </div>
      </div>
      
      {/* Token Balance */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">DegenDuel</span>
        <div className="text-sm font-medium text-white flex items-center">
          <span className="text-brand-300">
            <SolanaTokenDisplay 
              mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS} 
              walletAddress={user.wallet_address} 
              compact={true} 
            />
          </span>
        </div>
      </div>
      
      <Link to="/wallet" className="text-xs text-brand-400 hover:text-brand-300 transition-colors duration-200 flex justify-end items-center">
        <span>View wallet details</span>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </Link>
    </div>
  </div>
);

/**
 * Consistent section header component for menu sections
 */
export const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {title}
  </div>
);

/**
 * Consistent divider component for menu sections
 */
export const MenuDivider: React.FC = () => (
  <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
);

/**
 * Biometric Auth Component - shared between both menu types
 * Handles registration and management of biometric authentication
 */
export const BiometricAuthComponent: React.FC<{ 
  userId: string; 
  onClose?: () => void; 
  menuItemClass: string;
}> = ({ userId, onClose, menuItemClass }) => {
  const { isAvailable, isRegistered, registerCredential } = useBiometricAuth();
  const [isLoading, setIsLoading] = useState(false);
  const user = useStore(state => state.user);
  
  // Don't show if biometric auth is not available
  if (!isAvailable) return null;
  
  // Handle registration for users who aren't registered yet
  const handleRegister = async () => {
    setIsLoading(true);
    
    try {
      // Register biometric credential with platform authenticator (Face ID, Touch ID, etc.)
      await registerCredential(
        userId, 
        user?.nickname || userId,
        { 
          authenticatorType: 'platform',
          nickname: user?.nickname || undefined
        }
      );
      if (onClose) onClose();
    } catch (err) {
      console.error('Biometric auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    isRegistered ? (
      <Link
        to="/biometric-auth-demo"
        className={menuItemClass}
        onClick={onClose}
      >
        <FaFingerprint className="w-4 h-4" />
        <span className="flex-1">Manage Biometrics</span>
      </Link>
    ) : (
      <button
        onClick={handleRegister}
        disabled={isLoading}
        className={`${menuItemClass} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        <FaFingerprint className="w-4 h-4" />
        <span className="flex-1">
          {isLoading ? "Processing..." : "Setup Biometrics"}
        </span>
      </button>
    )
  );
};

/**
 * Menu Backdrop Component - provides a consistent backdrop for menus
 * Used for creating a dimmed background and capturing outside clicks
 * Includes improved touch handling and scroll prevention
 */
export const MenuBackdrop: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  isMobile?: boolean;
}> = ({ isOpen, onClose, isMobile = false }) => {
  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position and body style
      const scrollY = window.scrollY;
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
      };
      
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Re-enable scrolling when the backdrop is removed
      return () => {
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.position = originalStyle.position;
        document.body.style.top = originalStyle.top;
        document.body.style.width = originalStyle.width;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  // For mobile menu, we start the backdrop below the header (top-16)
  // For desktop menu, we cover the full screen
  const topPosition = isMobile ? "top-16" : "top-0";
  
  // Create touch event handlers to capture and stop propagation
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onClose();
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed inset-0 ${topPosition} bg-black/60 backdrop-blur-[2px] z-40`}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ 
        touchAction: 'none', 
        pointerEvents: 'auto' 
      }}
    />
  );
};