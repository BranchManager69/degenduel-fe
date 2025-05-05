// src/components/blinks/SolanaWalletConnector.tsx

/**
 * SolanaWalletConnector component
 * 
 * This component is used to connect to the Solana wallet
 * 
 * @author @BranchManager69
 * @version 1.9.0
 * @created 2025-04-30
 * @updated 2025-04-30
 */

import React from 'react';
import { useSolanaWallet } from '../../hooks/data/useSolanaWallet'; // Import the useSolanaWallet hook

// Define the SolanaWalletConnectorProps interface
interface SolanaWalletConnectorProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

// Define the SolanaWalletConnector component
export const SolanaWalletConnector: React.FC<SolanaWalletConnectorProps> = ({
  className = '',
  variant = 'full'
}) => {
  const { publicKey, connected, connecting, connect, disconnect } = useSolanaWallet();

  // Format public key for display (e.g., "GgE7...a91p")
  const formatPublicKey = (key: string) => {
    if (!key) return '';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  // Define the handleConnect function
  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  // Define the handleDisconnect function
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

    // Minimal variant just shows connect/disconnect button
  if (variant === 'minimal') {
    return (
      // Start of button component
      <button
        onClick={connected ? handleDisconnect : handleConnect}
        disabled={connecting}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${connected 
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'} ${connecting ? 'opacity-75 cursor-wait' : ''} ${className}`}
      >
        {/* Start of button label */}
        {connecting ? 'Connecting...' : (connected ? `${formatPublicKey(publicKey || '')}` : 'Connect')}
        {/* End of button label */}
      </button>
    );
  }

  // Full variant shows more detailed wallet info and connect/disconnect button
  return (
    // Start of div component
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Solana Wallet</h3>
        {connected && (
          <span className="flex items-center text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
            Connected
          </span>
        )}
      </div>

      {/* Connected wallet info */}
      {connected && publicKey ? (
        <div>
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Public Key</div>
            <div className="font-mono text-sm bg-gray-900 p-2 rounded truncate">
              {publicKey}
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <div className="text-gray-400 text-sm mb-3">
            {/* No solana wallet detected */}
            {!window.solana ? (
              <span>No Solana wallet detected. Please install a wallet extension like <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Phantom</a> or <a href="https://backpack.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Backpack</a>.</span>
            ) : (
              <span>Connect your Solana wallet to use Blinks</span>
            )}
          </div>
          {/* Connect Wallet button */}
          <button
            onClick={handleConnect}
            disabled={connecting || !window.solana}
            className={`w-full px-4 py-2 rounded-md transition-colors ${window.solana 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'} ${connecting ? 'opacity-75 cursor-wait' : ''}`}
          >
            {/* Button label */}
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      )}
    </div>
  );
};