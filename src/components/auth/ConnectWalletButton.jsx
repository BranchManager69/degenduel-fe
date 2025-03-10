import React from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';

/**
 * Connect Wallet Button Component
 * 
 * Primary authentication method for DegenDuel
 * Reuses the existing wallet connection logic from useStore
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 */
export const ConnectWalletButton = ({ className = '' }) => {
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
  
  // Not connected - show connect button
  return (
    <Button 
      onClick={connectWallet}
      disabled={isConnecting}
      variant="primary"
      className={`flex items-center justify-center ${className}`}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};