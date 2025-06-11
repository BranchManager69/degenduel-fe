// src/contexts/SolanaConnectionContext.tsx

/**
 * SolanaConnectionContext
 * 
 * @description This context provides a centralized Solana Connection management system
 * that automatically selects the appropriate RPC endpoint based on user role.
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-04-24
 * @updated 2025-05-01
 */

import { Connection } from '@solana/web3.js';
import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../contexts/UnifiedAuthContext';

// Config
import { config } from '../config/config';

// Define the context type
interface SolanaConnectionContextType {
  connection: Connection;
  // The tier of connection being used
  connectionTier: 'public' | 'user' | 'admin';
  // The RPC endpoint URL
  rpcEndpoint: string;
  // Whether the connection is using a high-volume tier
  isHighVolumeTier: boolean;
  isAdministrator: boolean;
}

// Create the context with a default value using the public endpoint
const defaultConnection = new Connection(
  `${window.location.origin}/api/solana-rpc/public`,
  { commitment: 'confirmed' }
);

const SolanaConnectionContext = createContext<SolanaConnectionContextType>({
  connection: defaultConnection,
  connectionTier: 'public',
  rpcEndpoint: `${window.location.origin}/api/solana-rpc/public`,
  isHighVolumeTier: false,
  isAdministrator: false,
});

// Provider component
export const SolanaConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const connectionInfo = useMemo(() => {
    const isAdministrator = user?.role === 'admin' || user?.role === 'superadmin';
    
    let tier: 'public' | 'user' | 'admin' = 'public';
    if (isAdministrator) {
      tier = 'admin';
    } else if (user) {
      tier = 'user';
    }
    
    const baseEndpoint = config.SOLANA.RPC_BASE_URL;
    const endpoint = tier === 'admin'
      ? `${baseEndpoint}/admin`
      : tier === 'user'
        ? baseEndpoint
        : `${baseEndpoint}/public`;
    
    const connection = new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000, 
    });
    
    return {
      connection,
      connectionTier: tier,
      rpcEndpoint: endpoint,
      isHighVolumeTier: tier === 'admin',
      isAdministrator,
    };
  }, [user]);
  
  return (
    <SolanaConnectionContext.Provider value={connectionInfo}>
      {children}
    </SolanaConnectionContext.Provider>
  );
};

// Custom hook to use the Solana Connection context
export const useSolanaConnection = () => {
  const context = useContext(SolanaConnectionContext);
  if (!context) {
    throw new Error('useSolanaConnection must be used within a SolanaConnectionProvider');
  }
  return context;
};