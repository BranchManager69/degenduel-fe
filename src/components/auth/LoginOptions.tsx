// src/components/auth/LoginOptions.tsx

/**
 * LoginOptions.tsx
 * 
 * This file contains the LoginOptions component, which is used to display the login options for the user.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // REMOVED
import { useEffect, useState } from 'react';
import { usePrivyAuth } from "../../contexts/PrivyAuthContext";
import useBiometricAuth from "../../hooks/auth/legacy/useBiometricAuth";
import { useStore } from "../../store/useStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Divider } from "../ui/Divider";
import BiometricAuthButton from "./BiometricAuthButton";
import ConsolidatedLoginButton from "./ConsolidatedLoginButton";
import PrivyLoginButton from "./PrivyLoginButton";
import TwitterLoginButton from "./TwitterLoginButton";

/**
 * Login Options Component
 *
 * Displays all available login options for the user including:
 * 1. Primary method - Connect Wallet (Phantom, etc.)
 * 2. Alternative methods - Twitter, Privy (for email/social login)
 */
const LoginOptions = () => {
  const { isPrivyLinked, linkPrivyToWallet, isLoading: privyLoading } = usePrivyAuth();
  const { user } = useStore();
  const [isLinking, setIsLinking] = useState(false);
  const { isAvailable, isRegistered } = useBiometricAuth();
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  
  // Check if biometric auth is available and the user has a registered credential
  useEffect(() => {
    if (isAvailable && isRegistered) {
      setShowBiometricOption(true);
    }
  }, [isAvailable, isRegistered]);
  
  // Function to handle linking Privy to wallet
  const handleLinkPrivy = async () => {
    setIsLinking(true);
    try {
      const success = await linkPrivyToWallet();
      if (success) {
        console.log('Successfully linked Privy account');
      } else {
        console.error('Failed to link Privy account');
      }
    } catch (error) {
      console.error('Error linking Privy account:', error);
    } finally {
      setIsLinking(false);
    }
  };
  
  // Show link button if user is logged in with wallet but Privy isn't linked
  const showLinkPrivy = user && !isPrivyLinked && !privyLoading;
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden relative border border-brand-500/30 shadow-xl bg-dark-200/70 backdrop-blur-lg">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400/50 via-purple-500/50 to-brand-600/50"></div>
      
      <CardHeader className="text-center relative">
        <CardTitle className="text-2xl font-cyber bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
          Login to DegenDuel
        </CardTitle>
        <CardDescription className="text-gray-300">
          {showLinkPrivy 
            ? "Link your social accounts for additional login options" 
            : "Connect with your wallet or use a linked social account"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* If user is logged in with wallet but Privy isn't linked, show link option */}
        {showLinkPrivy ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Link Social Account</h3>
            <p className="text-xs text-gray-400 mb-2">
              Linking your wallet to a Privy account allows you to log in with email or social accounts in the future.
            </p>
            <button
              onClick={handleLinkPrivy}
              disabled={isLinking}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-cyber rounded-md flex items-center justify-center transition-all duration-300 shadow-md"
            >
              {isLinking ? (
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
              ) : (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 156 156" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" fill="currentColor" fillOpacity="0.3"/>
                  <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" stroke="currentColor" strokeWidth="3"/>
                  <path d="M78 39L112.55 58.5V97.5L78 117L43.4496 97.5V58.5L78 39Z" stroke="currentColor" strokeWidth="3"/>
                </svg>
              )}
              Link Privy to Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Consolidated Login Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Sign In Options</h3>
              
              {/* Desktop view: Traditional multi-button display (hidden on mobile) */}
              <div className="hidden md:block space-y-4">
                {/* Wallet login - REMOVED WalletMultiButton */}
                {/* <div className="relative p-0.5 bg-gradient-to-r from-brand-500/40 to-purple-600/80 rounded-md group overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300"></div>
                  <WalletMultiButton className="w-full h-12 bg-transparent hover:bg-transparent font-cyber !rounded-md" />
                </div> */}
                
                <div className="relative">
                  <Divider>
                    <span className="px-3 text-xs font-semibold text-gray-400 bg-dark-200 rounded-full">
                      or continue with
                    </span>
                  </Divider>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Biometric Auth option - only shown if registered and available */}
                  {showBiometricOption && (
                    <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md">
                      <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300"></div>
                      <BiometricAuthButton 
                        mode="authenticate"
                        buttonStyle="default"
                        className="w-full h-12 bg-transparent hover:bg-transparent"
                        showAvailabilityIndicator={true}
                        onError={(error) => console.error("Biometric auth error:", error)}
                      />
                    </div>
                  )}
                  
                  <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-[#1DA1F2]/10 group-hover:bg-[#1DA1F2]/20 transition-colors duration-300"></div>
                    <TwitterLoginButton className="w-full h-12" />
                  </div>
                  
                  <div className="relative p-0.5 bg-gradient-to-r from-purple-500/40 to-brand-500/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300"></div>
                    <PrivyLoginButton className="w-full h-12" />
                  </div>
                </div>
              </div>
              
              {/* Mobile view: Consolidated button display (hidden on desktop) */}
              <div className="md:hidden">
                <ConsolidatedLoginButton />
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-gray-400 relative pt-2 pb-4 border-t border-brand-500/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
        {showLinkPrivy ? (
          <p className="max-w-xs text-center">You can skip this step and link accounts later from your profile.</p>
        ) : (
          <p className="max-w-xs text-center">Don't have an account? Connect your wallet to create one instantly.</p>
        )}
      </CardFooter>
    </Card>
  );
};

export default LoginOptions;
