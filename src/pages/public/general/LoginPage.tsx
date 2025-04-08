// src/pages/public/general/LoginPage.tsx

/**
 * LoginPage.tsx
 * 
 * This file contains the LoginPage component, which is used to display the login page.
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import { motion } from "framer-motion";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

// @ts-ignore - JSX component without TypeScript definitions
import LoginOptions from "../../../components/auth/LoginOptions";
import Logo from "../../../components/ui/Logo";
import { authDebug } from "../../../config/config";
import { useAuthContext } from "../../../contexts/AuthContext";

/**
 * Dedicated login page for DegenDuel
 * Displays all available login options and serves as a fallback route
 * Preserves original navigation target for post-authentication redirection
 */
const LoginPage: React.FC = () => {
  const { user } = useAuthContext();
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
      // Check localStorage first (for social auth redirects that lose React state)
      const storedPath = localStorage.getItem("auth_redirect_path");
      const redirectTo = storedPath || from;
      
      authDebug('LoginPage', 'User authenticated, redirecting', { 
        redirectTo,
        fromState: from,
        fromStorage: storedPath,
        user: user.nickname || user.wallet_address
      });
      
      // Clear stored path
      localStorage.removeItem("auth_redirect_path");
      
      // Redirect to original destination or home
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,52,221,0.1),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(114,9,183,0.1),transparent_70%)]"></div>
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-500/5 blur-[120px] rounded-full"></div>
      
      {/* Decorative lines */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-[10%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>
        <div className="absolute top-[90%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        <div className="absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-200/50 to-transparent"></div>
        <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
        <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500 to-transparent"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full space-y-10 z-10"
      >
        {/* Logo with enhanced entrance */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 
          }}
        >
          <Logo size="lg" animated={true} />
        </motion.div>

        {/* Login options panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.7, 
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <LoginOptions />
        </motion.div>

        {/* Note below login panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="space-y-2"
        >
          <p className="text-center text-sm text-gray-400">
            New to DegenDuel? Simply connect your wallet to create an account!
          </p>
          <p className="text-center text-xs text-gray-500">
            <a 
              href="/biometric-auth-demo" 
              className="text-brand-400 hover:text-brand-300 transition-colors"
            >
              Try our biometric authentication demo →
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
