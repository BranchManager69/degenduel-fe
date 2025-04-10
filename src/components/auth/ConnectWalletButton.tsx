import React, { useCallback } from "react";

import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";
import { env } from "../../config/env";
import { useJupiterWallet } from "../../hooks/useJupiterWallet";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { useAuth } from "../../hooks/useAuth";
import { authenticateWithWallet } from "../../services/authenticationService";

interface ConnectWalletButtonProps {
  className?: string;
  compact?: boolean;
  onClick?: () => void;
}

/**
 * Connect Wallet Button Component
 *
 * Primary authentication method for DegenDuel
 * Can use either the original wallet connection logic or Jupiter wallet
 * based on the feature flag
 */
export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  className = "",
  compact = false,
  onClick,
}) => {
  const { connectWallet, disconnectWallet, isConnecting, user } = useStore();
  const { walletAddress } = useAuth();
  const jupiterWallet = useJupiterWallet();

  // Handle connect action
  const handleConnect = useCallback(async () => {
    try {
      // Use environment flag to choose which wallet to connect
      const useJupiterWallet = env.USE_JUPITER_WALLET;
      console.log("[WALLET DEBUG] Using wallet implementation:", useJupiterWallet ? "Jupiter" : "Phantom");
      
      if (useJupiterWallet) {
        // Jupiter wallet flow
        console.log("[WALLET DEBUG] Connecting to Jupiter wallet...");
        await jupiterWallet.connect();
        
        if (!jupiterWallet.walletAddress) {
          throw new Error("No wallet address obtained from Jupiter wallet");
        }
        
        console.log("[WALLET DEBUG] Jupiter wallet connected:", {
          address: jupiterWallet.walletAddress,
          name: jupiterWallet.walletName
        });
        
        // Authenticate with backend
        console.log("[WALLET DEBUG] Authenticating with backend using Jupiter wallet");
        const authResult = await authenticateWithWallet(
          jupiterWallet.walletAddress,
          jupiterWallet.signMessage
        );
        
        if (authResult.user) {
          console.log("[WALLET DEBUG] Authentication successful");
          useStore.getState().setUser(authResult.user);
          
          // Force a re-check of the auth state
          setTimeout(() => {
            useAuth().checkAuth();
          }, 300);
        }
      } else {
        // Phantom wallet flow
        console.log("[WALLET DEBUG] Connecting to Phantom wallet...");
        await connectWallet();
        console.log("[WALLET DEBUG] Phantom wallet connection succeeded");
      }
      
      if (onClick) onClick();
    } catch (error: any) {
      console.error('[WALLET DEBUG] Wallet connection failed:', error);
      console.log('[WALLET DEBUG] Error details:', {
        message: error.message || 'Unknown error',
        type: env.USE_JUPITER_WALLET ? 'Jupiter' : 'Phantom',
        status: error.response?.status,
        data: error.response?.data
      });
      throw error; // Re-throw to show error to user
    }
  }, [jupiterWallet, connectWallet, onClick]);

  // Handle disconnect action
  const handleDisconnect = useCallback(() => {
    try {
      // Disconnect from all possible wallet providers to avoid any confusion
      console.log("[WALLET DEBUG] Disconnecting from all wallet providers");
      
      // Disconnect Jupiter if available
      if (jupiterWallet?.disconnect) {
        console.log("[WALLET DEBUG] Disconnecting Jupiter wallet");
        jupiterWallet.disconnect().catch(err => 
          console.warn("[WALLET DEBUG] Error disconnecting Jupiter wallet:", err)
        );
      }
      
      // Always run the main disconnect wallet function which handles storage cleanup
      console.log("[WALLET DEBUG] Running global disconnectWallet function");
      disconnectWallet();
      
      // Notify WebSocket system of disconnection via custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wallet-disconnected', {
          detail: { timestamp: new Date().toISOString() }
        }));
      }
      
      if (onClick) onClick();
    } catch (error) {
      console.error("[WALLET DEBUG] Error during wallet disconnection:", error);
    }
  }, [jupiterWallet, disconnectWallet, onClick]);

  // When Jupiter wallet is enabled, always use their UnifiedWalletButton component
  // with styling to match our design system
  if (env.USE_JUPITER_WALLET) {
    // For dropdown menus, apply custom styling to match our design
    const isMobileMenu = className?.includes("w-full justify-center");
    
    if (isMobileMenu) {
      return (
        <div 
          className={`relative cursor-pointer rounded-lg overflow-hidden ${className}`}
          onClick={onClick}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 transition-colors duration-300"></div>
          <div className="relative flex items-center justify-center py-2 px-4 font-cyber text-white">
            Connect Wallet
          </div>
        </div>
      );
    }
    
    // Detect LoginOptions context by parent div classes or props
    const isLoginPage = className?.includes("bg-transparent") && 
                      (className?.includes("h-12") || className?.includes("w-full"));
    
    // This variation is specifically for the login page
    if (isLoginPage) {
      // Create a custom styled button that looks like our other buttons
      // but actually wraps the UnifiedWalletButton
      return (
        <div className={`${className} relative overflow-hidden rounded-md`}>
          {/* Background gradient - visible through the transparent button */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 transition-colors duration-300"></div>
          
          {/* Custom styled Jupiter wallet button */}
          <div className="relative flex items-center justify-center h-full w-full">
            <button
              onClick={handleConnect}
              className="w-full h-full bg-transparent border-0 text-white font-cyber flex items-center justify-center py-3 px-4"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a5 5 0 00-5 5v6a5 5 0 005 5h6a5 5 0 005-5V7a5 5 0 00-5-5H7zm6 2a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h6z" clipRule="evenodd" />
              </svg>
              Connect Wallet
            </button>
          </div>
        </div>
      );
    }
    
    // Default case - use UnifiedWalletButton with improved styling
    return (
      <div className={className}>
        <UnifiedWalletButton 
          buttonClassName="bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-cyber border-0 rounded-md py-2 px-4"
        />
      </div>
    );
  }

  // If connected, show the "Connected" button with truncated address
  const displayAddress = user?.wallet_address || walletAddress;
  if (displayAddress) {
    return (
      <Button
        onClick={handleDisconnect}
        variant="outline"
        className={`flex items-center justify-center ${className}`}
      >
        <span className="mr-2">Connected:</span>
        <span className="font-mono text-xs truncate max-w-[120px]">
          {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
        </span>
      </Button>
    );
  }

  // Not connected - show connect button with gradient styling
  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting || jupiterWallet.isConnecting}
      className={`bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 
        text-white font-cyber transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${
          compact
            ? "text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3"
            : "text-sm sm:text-base py-1.5 sm:py-2 px-3 sm:px-4"
        } ${className}`}
      variant="gradient"
      size={compact ? "sm" : "md"}
    >
      {isConnecting || jupiterWallet.isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};