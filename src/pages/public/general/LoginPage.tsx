// src/pages/public/general/LoginPage.tsx

/**
 * LoginPage.tsx
 * 
 * This file contains the LoginPage component, which is used to display the login page.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-08
 */

import { motion } from "framer-motion";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SimpleWalletButton, TwitterLoginButton, DiscordLoginButton, TelegramLoginButton, BiometricAuthButton } from "../../../components/auth";
import Logo from "../../../components/ui/Logo";
import { authDebug } from "../../../config/config";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";

/**
 * Dedicated login page for DegenDuel
 * Displays all available login options and serves as a fallback route
 * Preserves original navigation target for post-authentication redirection
 */
const LoginPage: React.FC = () => {
  const { user, isAdministrator, isSuperAdmin } = useMigratedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the path to redirect to after login (default to home)
  const from = location.state?.from?.pathname || "/";
  
  // Store intended destination in localStorage for social auth redirects
  React.useEffect(() => {
    if (from && from !== "/") {
      localStorage.setItem("auth_redirect_path", from);
      authDebug('LoginPage', 'Stored auth redirect path', { from });
    }
  }, [from]);

  // If already logged in, redirect to original destination
  React.useEffect(() => {
    if (user) {
      const storedPath = localStorage.getItem("auth_redirect_path");
      const redirectTo = storedPath || from;
      authDebug('LoginPage', 'User authenticated, redirecting', { 
        redirectTo,
        fromState: from,
        fromStorage: storedPath,
        user: user.nickname || user.wallet_address
      });
      localStorage.removeItem("auth_redirect_path");
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        {/* Primary gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Elegant decoration lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-[20%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
          <div className="absolute bottom-[20%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
          <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-400/50 to-transparent"></div>
          <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-400/50 to-transparent"></div>
        </div>
      </div>
      
      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 
          }}
        >
          <Logo size="xl" animated={true} />
          <motion.div 
            className="mt-6 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Welcome to DegenDuel
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connect your wallet or choose an alternative method to get started
            </p>
          </motion.div>
        </motion.div>

        {/* Unified login panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              {/* Header section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4 border border-purple-500/20">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect with Wallet</h3>
                <p className="text-gray-400 text-sm">Recommended for the full DegenDuel experience</p>
              </div>
              
              {/* Primary wallet button - full width */}
              <div className="mb-8">
                <SimpleWalletButton 
                  className=""
                  isCompact={false} 
                />
              </div>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-900/90 text-gray-400">Or continue with</span>
                </div>
              </div>
              
              {/* Alternative login methods */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Twitter/X Login */}
                <div className="relative group">
                  <div className="w-full aspect-square rounded-lg bg-gray-800/60 border border-gray-600/40 hover:bg-gray-700/60 hover:border-gray-500/50 transition-all duration-200 overflow-hidden">
                    <TwitterLoginButton 
                      linkMode={false}
                      iconOnly={true}
                      className="w-full h-full p-0 bg-transparent hover:bg-transparent border-transparent flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6"
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">X (Twitter)</span>
                  </div>
                </div>

                {/* Discord Login */}
                <div className="relative group">
                  <div className="w-full aspect-square rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/40 transition-all duration-200 overflow-hidden">
                    <DiscordLoginButton 
                      linkMode={false}
                      iconOnly={true}
                      className="w-full h-full p-0 bg-transparent hover:bg-transparent border-transparent flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6"
                    />
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">Discord</span>
                  </div>
                </div>

                {/* Telegram Login */}
                <div className={`relative group ${!(isAdministrator || isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`w-full aspect-square rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 
                    ${(isAdministrator || isSuperAdmin) ? 'hover:bg-[#0088cc]/20 hover:border-[#0088cc]/40' : ''} 
                    transition-all duration-200 overflow-hidden`}>
                    {(isAdministrator || isSuperAdmin) ? (
                      <TelegramLoginButton 
                        linkMode={false}
                        iconOnly={true}
                        className="w-full h-full p-0 bg-transparent hover:bg-transparent border-transparent flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">Telegram</span>
                    {!(isAdministrator || isSuperAdmin) && (
                      <span className="text-xs text-gray-500 block">Coming Soon</span>
                    )}
                  </div>
                </div>

                {/* Passkey Login */}
                <div className={`relative group ${!(isAdministrator || isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`w-full aspect-square rounded-lg bg-purple-500/10 border border-purple-500/20 
                    ${(isAdministrator || isSuperAdmin) ? 'hover:bg-purple-500/20 hover:border-purple-500/40' : ''} 
                    transition-all duration-200 overflow-hidden`}>
                    {(isAdministrator || isSuperAdmin) ? (
                      <BiometricAuthButton 
                        mode="authenticate"
                        buttonStyle="icon-only"
                        className="w-full h-full p-0 bg-transparent hover:bg-transparent border-transparent flex flex-col items-center justify-center gap-2 [&>svg]:w-6 [&>svg]:h-6"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                          <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                          <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                          <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                          <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                          <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                          <path d="M2 16h.01"/>
                          <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                          <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">Passkey</span>
                    {!(isAdministrator || isSuperAdmin) && (
                      <span className="text-xs text-gray-500 block">Coming Soon</span>
                    )}
                  </div>
                </div>
              </div>

                {/* Note about wallet linking */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-200 text-center">
                    💡 After social login, you'll need to connect a wallet for full trading features
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
