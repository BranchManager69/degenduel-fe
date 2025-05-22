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
import { useBiometricAuth } from "../../hooks/auth"; // Only useBiometricAuth
import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";
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
import ConnectWalletButton from "./ConnectWalletButton";
import ConsolidatedLoginButton from "./ConsolidatedLoginButton";
import TwitterLoginButton from "./TwitterLoginButton";

/**
 * Login Options Component
 *
 * Displays all available login options for the user including:
 * 1. Primary method - Connect Wallet (Phantom, etc.)
 * 2. Alternative methods - Twitter
 */
const LoginOptions = () => {
  const { user } = useStore();
  const { 
    isAvailable,
    isRegistered,
    authenticate,
    error: biometricError
  } = useBiometricAuth();
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  
  useEffect(() => {
    if (isAvailable && isRegistered) {
      setShowBiometricOption(true);
    } else {
      setShowBiometricOption(false);
    }
  }, [isAvailable, isRegistered]);
  
  useEffect(() => {
    if (biometricError) {
      console.warn("Biometric Auth Hook Error:", biometricError);
    }
  }, [biometricError]);
  
  
  const handleBiometricAuth = async () => {
    if (authenticate && isAvailable) {
      try {
        await authenticate(user?.id || "No user ID found");
      } catch (err) {
        console.error("Biometric auth failed during prompt:", err);
      }
    }
  };
  
  
  return (
    <Card className="w-full max-w-md mx-auto relative border border-brand-500/30 shadow-xl bg-dark-200/70 backdrop-blur-lg">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400/50 via-purple-500/50 to-brand-600/50"></div>
      
      <CardHeader className="text-center relative">
        <CardTitle className="text-2xl font-cyber bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
          Login to DegenDuel
        </CardTitle>
        <CardDescription className="text-gray-300">
          Connect with your wallet
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wallet login options */}
            {/* Consolidated Login Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Sign In Options</h3>
              
              {/* Desktop view: Traditional multi-button display (hidden on mobile) */}
              <div className="hidden md:block space-y-4">
                {/* Wallet Connect Button */}
                <div className="relative p-0.5 bg-gradient-to-r from-brand-500/40 to-purple-600/80 rounded-md group overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300"></div>
                  <ConnectWalletButton 
                    className="w-full h-12"
                    size="lg"
                  />
                </div>
                
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
                  
                </div>
              </div>
              
              {/* Mobile view: Consolidated button display (hidden on desktop) */}
              <div className="md:hidden">
                <ConsolidatedLoginButton />
              </div>
            </div>

        {showBiometricOption && (
          <>
            <div className="relative">
              <Divider>
                <span className="px-3 text-xs font-semibold text-gray-400 bg-dark-200 rounded-full">
                  or continue with
                </span>
              </Divider>
            </div>
            <Button 
              variant="outline"
              className="w-full justify-center py-3 mt-2 text-sm border-dark-300 hover:bg-dark-400/50 space-x-2"
              onClick={handleBiometricAuth}
              disabled={!isAvailable}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.789-2.756 9.362m-3.612-3.612A9.006 9.006 0 012.884 12c0-1.033.167-2.024.473-2.955m17.213 0A9.006 9.006 0 0112 2.884c-1.033 0-2.024.167-2.955.473m12.322 8.643L12 17.75M3.937 9.362L12 6.25m0 0L20.063 9.362M12 6.25V3m0 3.25V1m0 0v2.25" />
              </svg>
              <span>Sign in with Passkey / Biometrics</span>
            </Button>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-gray-400 relative pt-2 pb-4 border-t border-brand-500/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
        <p className="max-w-xs text-center">Don't have an account? Connect your wallet to create one instantly.</p>
      </CardFooter>
    </Card>
  );
};

export default LoginOptions;
