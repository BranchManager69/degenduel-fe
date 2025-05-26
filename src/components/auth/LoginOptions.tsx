// src/components/auth/LoginOptions.tsx

/**
 * Login Options Component
 *
 * @description Displays all available login options for the user including:
 * 
 * Auth methods:
 * 1. web3 - Connect Wallet (uses ConnectWalletButton, a universal web3 wallet connector)
 * 2. Social - Twitter (uses TwitterLoginButton)
 * 3. Social - Discord (uses DiscordLoginButton)
 * 4. Passkey - Passkey authentication (uses BiometricAuthButton)
 * 
 * ?. Consolidated login button (uses ConsolidatedLoginButton (???))
 * 
 * @author BranchManager69
 * @version 1.9.2
 * @created 2025-02-14
 * @updated 2025-05-24
 */

// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // REMOVED
import { useEffect, useState } from 'react';
import { useBiometricAuth } from "../../hooks/auth"; // Only useBiometricAuth
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "../ui/Card";
import { Divider } from "../ui/Divider";
import {
    BiometricAuthButton,
    ConnectWalletButton,
    ConsolidatedLoginButton,
    DiscordLoginButton,
    TwitterLoginButton
} from "./index";

// Login Options component
const LoginOptions = () => {
  const { user } = useStore();
  const auth = useMigratedAuth();
  const { 
    isAvailable,
    isRegistered,
    error: biometricError
  } = useBiometricAuth();
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  
  // Determine if user is authenticated
  const isAuthenticated = !!user?.wallet_address;
  
  useEffect(() => {
    if (isAvailable && isAuthenticated) {
      // For authenticated users, always show biometric option (register or authenticate)
      setShowBiometricOption(true);
    } else {
      setShowBiometricOption(false);
    }
  }, [isAvailable, isAuthenticated]);
  
  useEffect(() => {
    if (biometricError) {
      console.warn("Biometric Auth Hook Error:", biometricError);
    }
  }, [biometricError]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto relative border border-brand-500/30 shadow-xl bg-dark-200/25 backdrop-blur-lg">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400/50 via-purple-500/50 to-brand-600/50"></div>
      
      <CardHeader className="text-center relative">
        <CardTitle className="text-2xl font-cyber bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
          {isAuthenticated ? "Account Settings" : "Login to DegenDuel"}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {isAuthenticated ? "Manage your account options" : "Connect with your wallet"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wallet login options */}
            {/* Consolidated Login Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">
                {isAuthenticated ? "Account Options" : "Sign In Options"}
              </h3>
              
              {/* Desktop view: Traditional multi-button display (hidden on mobile) */}
              <div className="hidden md:block space-y-4">
                
                {isAuthenticated ? (
                  // AUTHENTICATED USER - Show account management options
                  <>
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-300">
                        Welcome back, {user?.nickname || (user?.wallet_address ? `${user.wallet_address.slice(0, 8)}...` : 'User')}
                      </p>
                    </div>
                    
                    {/* Link for EZ Login subtitle */}
                    <div className="text-center mb-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Link for EZ Login
                      </p>
                    </div>
                    
                    {/* Link Options (3 compact squares) */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Link Twitter Account - Icon Only */}
                      <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                        <div className="absolute inset-0 bg-[#1DA1F2]/10 group-hover:bg-[#1DA1F2]/20 transition-colors duration-300"></div>
                        <div className="w-full h-full z-10 relative flex items-center justify-center">
                          <TwitterLoginButton 
                            linkMode={true}
                            className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden"
                          />
                        </div>
                      </div>
                      
                      {/* Link Discord Account - Icon Only */}
                      <div className="relative p-0.5 bg-gradient-to-r from-[#5865F2]/40 to-[#5865F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                        <div className="absolute inset-0 bg-[#5865F2]/10 group-hover:bg-[#5865F2]/20 transition-colors duration-300"></div>
                        <div className="w-full h-full z-10 relative flex items-center justify-center">
                          <DiscordLoginButton 
                            linkMode={true}
                            className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden"
                          />
                        </div>
                      </div>
                      
                      {/* Register/Use Passkey - Icon Only */}
                      {showBiometricOption && (
                        <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md aspect-square">
                          <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300"></div>
                          <div className="w-full h-full z-10 relative flex items-center justify-center">
                            <BiometricAuthButton 
                              mode={isRegistered ? "authenticate" : "register"}
                              buttonStyle="icon-only"
                              className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0"
                              onError={(error) => console.error("Passkey auth error:", error)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative mt-6">
                      <Divider>
                        <span className="px-3 text-xs font-semibold text-gray-400 bg-dark-200 rounded-full">
                          account
                        </span>
                      </Divider>
                    </div>
                    
                    {/* Logout Option */}
                    <div className="relative p-0.5 bg-gradient-to-r from-red-500/40 to-red-600/80 rounded-md group overflow-hidden shadow-md">
                      <div className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-colors duration-300"></div>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full h-12 bg-transparent hover:bg-transparent border-transparent text-white font-bold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"></path>
                        </svg>
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  // NOT AUTHENTICATED - Show login options
                  <>
                    {/* Login Options */}
                    <div className="space-y-4">
                      {/* Primary: Wallet Connection (full width) */}
                    <div className="relative p-0.5 bg-gradient-to-r from-brand-500/40 to-purple-600/80 rounded-md group overflow-hidden shadow-md">
                        <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                      <ConnectWalletButton 
                          className="w-full h-12 z-10 relative"
                      />
                    </div>
                    
                      {/* Login With subtitle */}
                      <div className="text-center mb-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Login With
                        </p>
                      </div>

                      {/* Secondary: Social & Passkey Login Options (3 compact squares) */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Twitter Login - Icon Only */}
                        <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                          <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                          <div className="w-full h-full z-10 relative flex items-center justify-center">
                            <TwitterLoginButton 
                              linkMode={false}
                              className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden"
                            />
                          </div>
                        </div>

                        {/* Discord Login - Icon Only */}
                        <div className="relative p-0.5 bg-gradient-to-r from-[#5865F2]/40 to-[#5865F2]/80 rounded-md group overflow-hidden shadow-md aspect-square">
                          <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                          <div className="w-full h-full z-10 relative flex items-center justify-center">
                            <DiscordLoginButton 
                              linkMode={false}
                              className="w-full h-full bg-transparent hover:bg-transparent border-transparent p-0 flex items-center justify-center [&>*:not(svg)]:hidden [&>span]:hidden"
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
                                onError={(error) => console.error("Passkey auth error:", error)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
              </div>
              
              {/* Mobile view: Consolidated button display (hidden on desktop) */}
              <div className="md:hidden">
                <ConsolidatedLoginButton />
              </div>
            </div>
      </CardContent>
    </Card>
  );
};

export default LoginOptions;
