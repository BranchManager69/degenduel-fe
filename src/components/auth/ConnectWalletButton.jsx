import React from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';

/**
 * Connect Wallet Button Component
 * 
 * Primary authentication method for DegenDuel
 * Reuses the existing wallet connection logic from useStore
 * Follows the style of the Header button
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Whether to use compact styling
 */
export const ConnectWalletButton = ({ className = '', compact = false }) => {
  const { connectWallet, disconnectWallet, isConnecting, user } = useStore();
  
  // If connected, show the "Connected" button with truncated address
  if (user?.wallet_address) {
    return (
      <Button 
        onClick={disconnectWallet}
        variant="outline"
        className={`flex items-center justify-center ${className}`}
      >
        <span className="mr-2">Connected:</span>
        <span className="font-mono text-xs truncate max-w-[120px]">
          {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
        </span>
      </Button>
    );
  }
  
  // Not connected - show connect button with gradient styling
  return (
    <Button 
      onClick={connectWallet}
      disabled={isConnecting}
      className={`bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 
        text-white font-cyber transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${compact 
          ? "text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3" 
          : "text-sm sm:text-base py-1.5 sm:py-2 px-3 sm:px-4"
        } ${className}`}
      variant="gradient"
      size={compact ? "sm" : "md"}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};