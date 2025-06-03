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

import { SimpleWalletButton, SocialAuthPanel } from "../../../components/auth";
import Logo from "../../../components/ui/Logo";
import { authDebug } from "../../../config/config";
import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";

/**
 * Dedicated login page for DegenDuel
 * Displays all available login options and serves as a fallback route
 * Preserves original navigation target for post-authentication redirection
 */
const LoginPage: React.FC = () => {
  const { user } = useMigratedAuth();
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

        {/* Main login panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="space-y-6"
        >
          {/* Primary Wallet Connection - Hero Treatment */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm"></div>
            <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4 border border-purple-500/20">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect with Wallet</h3>
                <p className="text-gray-400 text-sm">Recommended for the full DegenDuel experience</p>
              </div>
              
              {/* Enhanced wallet button container */}
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <SimpleWalletButton 
                    className="w-full transform transition-all duration-300 hover:scale-[1.02] [&>button]:w-full [&>button]:py-4 [&>button]:text-lg [&>button]:font-semibold [&>button]:rounded-xl [&>button]:border-0 [&>button]:shadow-xl [&>button]:bg-gradient-to-r [&>button]:from-purple-600 [&>button]:via-blue-600 [&>button]:to-purple-600 [&>button]:hover:from-purple-500 [&>button]:hover:via-blue-500 [&>button]:hover:to-purple-500 [&>button]:hover:shadow-2xl [&>button]:hover:shadow-purple-500/25"
                    isCompact={false} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Methods - Elegant Secondary Treatment */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500/10 to-gray-500/10 rounded-xl opacity-50"></div>
            <div className="relative bg-gray-800/50 backdrop-blur-xl border border-gray-600/30 rounded-xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <h4 className="text-lg font-medium text-gray-200 mb-2">Alternative Login Methods</h4>
                <p className="text-gray-500 text-sm">Quick access with social accounts or passkeys</p>
              </div>
              
              {/* Enhanced social auth panel */}
              <div className="space-y-1">
                <SocialAuthPanel 
                  mode="login" 
                  layout="vertical"
                  className="[&>div]:relative [&>div>button]:w-full [&>div>button]:py-4 [&>div>button]:rounded-lg [&>div>button]:font-medium [&>div>button]:transition-all [&>div>button]:duration-300 [&>div>button]:border [&>div>button]:border-transparent [&>div>button]:shadow-lg [&>div>button]:hover:scale-[1.02] [&>div>button]:hover:shadow-xl
                  
                  [&>div:nth-child(1)>button]:bg-[#1DA1F2] [&>div:nth-child(1)>button]:hover:bg-[#1a8cd8] [&>div:nth-child(1)>button]:hover:shadow-blue-500/25 [&>div:nth-child(1)>button]:text-white
                  
                  [&>div:nth-child(2)>button]:bg-[#5865F2] [&>div:nth-child(2)>button]:hover:bg-[#4752c4] [&>div:nth-child(2)>button]:hover:shadow-indigo-500/25 [&>div:nth-child(2)>button]:text-white
                  
                  [&>div:nth-child(3)>button]:bg-gradient-to-r [&>div:nth-child(3)>button]:from-emerald-600 [&>div:nth-child(3)>button]:to-teal-600 [&>div:nth-child(3)>button]:hover:from-emerald-500 [&>div:nth-child(3)>button]:hover:to-teal-500 [&>div:nth-child(3)>button]:hover:shadow-emerald-500/25 [&>div:nth-child(3)>button]:text-white"
                  onComplete={() => {
                    const storedPath = localStorage.getItem("auth_redirect_path");
                    navigate(storedPath || "/");
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
