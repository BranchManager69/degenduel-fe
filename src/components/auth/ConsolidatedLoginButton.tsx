// src/components/auth/ConsolidatedLoginButton.tsx

/**
 * ConsolidatedLoginButton.tsx
 * 
 * @description A consolidated login button that expands to show all login options
 * Perfect for mobile interfaces where space is at a premium
 * 
 * @author BranchManager69
 * @version 1.9.3
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
import DiscordLoginButton from './DiscordLoginButton';
import TwitterLoginButton from './TwitterLoginButton';

interface ConsolidatedLoginButtonProps {
  className?: string;
  onLoginComplete?: () => void;
  isCompact?: boolean;
}

/**
 * Consolidated Login Button Component
 * 
 * Shows a single "Sign In" button that expands to display all available login options
 * Much more space-efficient for mobile interfaces
 */
const ConsolidatedLoginButton: React.FC<ConsolidatedLoginButtonProps> = ({
  className = '',
  onLoginComplete,
  isCompact = false
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
        className={`${isCompact ? 'h-7 px-4 text-xs' : 'h-8 px-6 text-sm'} bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-mono flex items-center justify-center transition-all duration-300 rounded-full border border-brand-400/30 hover:border-brand-400/50 shadow-md hover:shadow-lg`}
        variant="gradient"
      >
        {isAuthenticated ? (user?.nickname || "Account") : "Sign In"}
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
                  {/* Link for EZ Login subtitle */}
                  <div className="text-center mb-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Link for EZ Login
                    </p>
                  </div>
                  
                  {/* Link Options (3 compact squares) */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Link Twitter Account - Icon Only */}
                    <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                      <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <div className="w-full h-full z-10 relative flex items-center justify-center">
                      <TwitterLoginButton 
                        linkMode={true}
                          className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden text-transparent"
                          onClick={handleLoginClick}
                        />
                      </div>
                    </div>
                    
                    {/* Link Discord Account - Icon Only */}
                    <div className="relative p-0.5 bg-gradient-to-r from-[#5865F2]/40 to-[#5865F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                      <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <div className="w-full h-full z-10 relative flex items-center justify-center">
                        <DiscordLoginButton 
                          linkMode={true}
                          className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden text-transparent"
                        onClick={handleLoginClick} 
                      />
                      </div>
                    </div>
                    
                    {/* Register/Use Passkey - Icon Only */}
                    {showBiometricOption && (
                      <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md aspect-square">
                        <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                        <div className="w-full h-full z-10 relative flex items-center justify-center">
                        <BiometricAuthButton 
                          mode={isRegistered ? "authenticate" : "register"}
                            buttonStyle="icon-only"
                            className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0"
                          onSuccess={handleLoginClick}
                            onError={(error) => console.error("Passkey auth error:", error)}
                        />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Logout Option (full width below) */}
                  <div className="relative p-0.5 bg-gradient-to-r from-red-500/40 to-red-600/80 rounded-md group overflow-hidden shadow-md mt-4">
                    <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full h-10 z-10 relative bg-transparent hover:bg-transparent font-bold text-white flex items-center justify-center gap-2 text-xs"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                // NOT AUTHENTICATED - Show login options
                <>
                  {/* Primary: Wallet Connection (full width) */}
              <ConnectWalletButton 
                className="w-full h-12"
                onSuccess={handleLoginClick}
              />
              
                  {/* Secondary: Social & Passkey Login Options (3 compact squares) */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Twitter Login - Icon Only */}
                    <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <div className="w-full h-full z-10 relative flex items-center justify-center">
                <TwitterLoginButton 
                      linkMode={false}
                          className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden text-transparent"
                          onClick={handleLoginClick}
                        />
                      </div>
                    </div>
                    
                    {/* Discord Login - Icon Only */}
                    <div className="relative p-0.5 bg-gradient-to-r from-[#5865F2]/40 to-[#5865F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                      <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <div className="w-full h-full z-10 relative flex items-center justify-center">
                        <DiscordLoginButton 
                          linkMode={false}
                          className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden text-transparent"
                  onClick={handleLoginClick} 
                />
                      </div>
                    </div>
                    
                    {/* Passkey Login - Icon Only (if available) */}
                    {isAvailable && (
                      <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md aspect-square">
                        <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                        <div className="w-full h-full z-10 relative flex items-center justify-center">
                          <BiometricAuthButton 
                            mode="authenticate"
                            buttonStyle="icon-only"
                            className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0"
                            onSuccess={handleLoginClick}
                            onError={(error) => console.error("Passkey auth error:", error)}
                          />
                        </div>
                      </div>
                    )}
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