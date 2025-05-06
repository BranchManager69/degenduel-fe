/**
 * Solana Wallet Type Definitions
 *
 * This file contains the type definitions for the global `window.solana` object,
 * ensuring consistency and providing type safety across the application.
 */

// NOTE: 'isConnected' is likely a custom property and not part of the standard Solana wallet API.
// It's included here for compatibility with existing code, but its presence and behavior
// may vary between wallet providers.
export interface SolanaWalletGlobal {
  isConnected?: boolean;
  publicKey?: { toString: () => string } | null;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction?: (options: { transaction: any; message?: string }) => Promise<{ signature: string }>;
  signTransaction?: (transaction: any) => Promise<any>;
  sendTransaction?: (transaction: any, connection?: any, options?: any) => Promise<string>;
  // Add other methods here as you discover or need them, e.g., for specific wallet features.
} 