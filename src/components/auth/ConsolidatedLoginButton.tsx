// src/components/auth/ConsolidatedLoginButton.tsx

/**
 * ConsolidatedLoginButton.tsx
 * 
 * @description A consolidated login button that expands to show all login options
 * Perfect for mobile interfaces where space is at a premium
 * 
 * @author BranchManager69
 * @version 1.9.2
 * @created 2025-02-14
 * @updated 2025-05-24
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import useBiometricAuth from '../../hooks/auth/legacy/useBiometricAuth';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import BiometricAuthButton from './BiometricAuthButton';
import ConnectWalletButton from './ConnectWalletButton';
import TwitterLoginButton from './TwitterLoginButton';

interface ConsolidatedLoginButtonProps {
  className?: string;
  onLoginComplete?: () => void;
}

/**
 * Consolidated Login Button Component
 * 
 * Shows a single "Sign In" button that expands to display all available login options
 * Much more space-efficient for mobile interfaces
 */
const ConsolidatedLoginButton: React.FC<ConsolidatedLoginButtonProps> = ({
  className = '',
  onLoginComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAvailable, isRegistered, hasCheckedRegistration, checkRegistrationStatus } = useBiometricAuth();
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const user = useStore(state => state.user);
  const auth = useMigratedAuth();
  
  // Determine if user is authenticated
  const isAuthenticated = !!user?.wallet_address;
  
  // Check biometric registration status when user expands and is authenticated
  React.useEffect(() => {
    if (isExpanded && isAvailable && isAuthenticated) {
      if (!hasCheckedRegistration) {
        checkRegistrationStatus().then(() => {
          setShowBiometricOption(true); // Always show for authenticated users (register or authenticate)
        }).catch((error) => {
          console.log('Biometric registration check failed:', error);
          setShowBiometricOption(true); // Still show registration option
        });
      } else {
        setShowBiometricOption(true); // Always show for authenticated users
      }
    } else {
      setShowBiometricOption(false);
    }
  }, [isExpanded, isAvailable, isAuthenticated, hasCheckedRegistration, checkRegistrationStatus]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Handle login completion
  const handleLoginClick = () => {
    setIsExpanded(false); // Close the dropdown
    if (onLoginComplete) {
      onLoginComplete();
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.logout();
      setIsExpanded(false);
      if (onLoginComplete) {
        onLoginComplete();
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsExpanded(false);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Main login button */}
      <Button
        onClick={toggleExpanded}
        className="w-full py-3 text-base bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-bold flex items-center justify-center"
        variant="gradient"
      >
        <svg
          className="w-5 h-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        {isExpanded 
          ? (isAuthenticated ? "Account Options" : "Choose a method")
          : (isAuthenticated ? (user?.nickname || "Account") : "Sign In")
        }
        {isExpanded ? (
          <svg
            className="w-4 h-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </Button>

      {/* Expandable login options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-50"
          >
            <div className="flex flex-col gap-2 p-2 bg-dark-400/90 backdrop-blur-sm border border-brand-500/30 rounded-md shadow-xl">
              
              {isAuthenticated ? (
                // AUTHENTICATED USER - Show account management options
                <>
                  {/* Link Twitter Account */}
                  <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                    <TwitterLoginButton 
                      linkMode={true}
                      className="w-full h-12 z-10 relative font-bold" 
                      onClick={handleLoginClick} 
                    />
                  </div>
                  
                  {/* Register/Use Passkey */}
                  {showBiometricOption && (
                    <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md">
                      <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <BiometricAuthButton 
                        mode={isRegistered ? "authenticate" : "register"}
                        buttonStyle="minimal"
                        authenticatorType="platform"
                        className="w-full h-12 z-10 relative bg-transparent hover:bg-transparent font-bold"
                        onSuccess={handleLoginClick}
                        onError={(error) => console.error("Biometric auth error:", error)}
                      />
                    </div>
                  )}
                  
                  {/* Logout Option */}
                  <div className="relative p-0.5 bg-gradient-to-r from-red-500/40 to-red-600/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full h-12 z-10 relative bg-transparent hover:bg-transparent font-bold text-white flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                // NOT AUTHENTICATED - Show login options
                <>
                  {/* Wallet Connection */}
                  <div className="relative p-0.5 bg-gradient-to-r from-brand-500/40 to-purple-600/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                    <ConnectWalletButton 
                      className="w-full h-12 z-10 relative"
                      onSuccess={handleLoginClick}
                    />
                  </div>
                  
                  {/* Twitter Login */}
                  <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                    <TwitterLoginButton 
                      linkMode={false}
                      className="w-full h-12 z-10 relative font-bold" 
                      onClick={handleLoginClick} 
                    />
                  </div>
                </>
              )}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsolidatedLoginButton;