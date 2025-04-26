/**
 * useSolanaBalance Hook
 * 
 * Hook for subscribing to real-time Solana balance updates via WebSocket.
 * Balances are automatically updated via server polling (every 10s) and
 * on-chain transaction monitoring.
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';

type SolanaBalanceHookReturn = {
  balance: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refreshBalance: () => void;
  formatBalance: (decimals?: number) => string;
};

/**
 * Hook to get and subscribe to Solana balance updates
 */
export function useSolanaBalance(walletAddress?: string): SolanaBalanceHookReturn {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Only connect if we have a wallet address
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    // Create WebSocket connection
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'wss://dev.degenduel.me/api/v69/ws');
    setSocket(ws);

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('Solana balance WebSocket connected');
      setIsConnected(true);
      
      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      // Authenticate if we have a token
      if (authToken) {
        ws.send(JSON.stringify({
          type: 'AUTH',
          token: authToken
        }));
      }
      
      // Subscribe to Solana balance
      ws.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'solana_balance',
        action: 'subscribe',
        walletAddress
      }));
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle Solana balance updates
        if (message.type === 'SOLANA_BALANCE_UPDATE' && message.balance !== undefined) {
          setBalance(message.balance);
          setIsLoading(false);
        }
        
        // Handle errors
        else if (message.type === 'ERROR') {
          console.error('Solana Balance WebSocket error:', message.message);
          setError(message.message || 'Unknown error');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('Solana balance WebSocket disconnected');
      setIsConnected(false);
    });

    // Connection error
    ws.addEventListener('error', (err) => {
      console.error('Solana balance WebSocket error:', err);
      setError('Connection error');
    });

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        // Unsubscribe from Solana balance
        ws.send(JSON.stringify({
          type: 'REQUEST',
          topic: 'solana_balance',
          action: 'unsubscribe',
          walletAddress
        }));
        
        ws.close();
      }
    };
  }, [walletAddress]);

  // Refresh Solana balance
  const refreshBalance = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !walletAddress) {
      return;
    }
    
    setIsLoading(true);
    
    // Request fresh Solana balance
    socket.send(JSON.stringify({
      type: 'REQUEST',
      topic: 'solana_balance',
      action: 'getBalance',
      walletAddress,
      requestId: `refresh-sol-${Date.now()}`
    }));
    
    // Set a timeout to reset loading state if we don't get a response
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [socket, walletAddress]);

  // Format balance with specified decimal places
  const formatBalance = useCallback((decimals = 4) => {
    return balance.toFixed(decimals);
  }, [balance]);

  return {
    balance,
    isLoading,
    isConnected,
    error,
    refreshBalance,
    formatBalance
  };
}