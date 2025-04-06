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
      if (env.USE_JUPITER_WALLET) {
        // First connect the wallet
        await jupiterWallet.connect();
        
        // After connected, get the wallet address
        if (jupiterWallet.walletAddress) {
          // Authenticate with the backend using the Jupiter wallet
          const authResult = await authenticateWithWallet(
            jupiterWallet.walletAddress,
            jupiterWallet.signMessage
          );
          
          // Update the store with user data
          if (authResult.user) {
            useStore.getState().setUser(authResult.user);
          }
        }
      } else {
        // Use the existing connectWallet flow for Phantom wallet
        connectWallet();
      }
      
      if (onClick) onClick();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  }, [jupiterWallet, connectWallet, onClick]);

  // Handle disconnect action
  const handleDisconnect = useCallback(() => {
    if (env.USE_JUPITER_WALLET) {
      jupiterWallet.disconnect();
    } else {
      disconnectWallet();
    }
    if (onClick) onClick();
  }, [jupiterWallet, disconnectWallet, onClick]);

  // If Jupiter wallet UI is enabled AND we're not in a mobile menu context, use their button component
  // Note: className containing "w-full justify-center" is a signal we're in the mobile menu
  const isMobileMenu = className.includes("w-full justify-center");
  if (env.USE_JUPITER_WALLET && !compact && !isMobileMenu) {
    return <UnifiedWalletButton />;
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