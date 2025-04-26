/**
 * useTokenBalance Hook
 * 
 * Hook for subscribing to real-time token balance updates via WebSocket.
 * Balances are automatically updated via server polling (every 10s) and
 * on-chain transaction monitoring through Helius.
 * 
 * @author Branch Manager
 * @created 2025-04-10
 */

import { useCallback, useEffect, useState } from 'react';

type TokenBalanceHookReturn = {
  balance: number;
  tokenAddress: string;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refreshBalance: () => void;
};

/**
 * Hook to get and subscribe to token balance updates
 */
export function useTokenBalance(walletAddress?: string): TokenBalanceHookReturn {
  const [balance, setBalance] = useState<number>(0);
  const [tokenAddress, setTokenAddress] = useState<string>('');
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
      console.log('Token balance WebSocket connected');
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
      
      // Get token address
      ws.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'token_balance',
        action: 'getTokenAddress',
        requestId: `token-address-${Date.now()}`
      }));
      
      // Subscribe to token balance
      ws.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'token_balance',
        action: 'subscribe',
        walletAddress
      }));
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle token balance updates
        if (message.type === 'TOKEN_BALANCE_UPDATE' && message.balance !== undefined) {
          setBalance(message.balance);
          setIsLoading(false);
        }
        
        // Handle token address response
        else if (message.type === 'TOKEN_ADDRESS' && message.address) {
          setTokenAddress(message.address);
        }
        
        // Handle errors
        else if (message.type === 'ERROR') {
          console.error('Token Balance WebSocket error:', message.message);
          setError(message.message || 'Unknown error');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('Token balance WebSocket disconnected');
      setIsConnected(false);
    });

    // Connection error
    ws.addEventListener('error', (err) => {
      console.error('Token balance WebSocket error:', err);
      setError('Connection error');
    });

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        // Unsubscribe from token balance
        ws.send(JSON.stringify({
          type: 'REQUEST',
          topic: 'token_balance',
          action: 'unsubscribe',
          walletAddress
        }));
        
        ws.close();
      }
    };
  }, [walletAddress]);

  // Refresh token balance
  const refreshBalance = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !walletAddress) {
      return;
    }
    
    setIsLoading(true);
    
    // Request fresh token balance
    socket.send(JSON.stringify({
      type: 'REQUEST',
      topic: 'token_balance',
      action: 'getBalance',
      walletAddress,
      refresh: true,
      requestId: `refresh-token-${Date.now()}`
    }));
    
    // Set a timeout to reset loading state if we don't get a response
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [socket, walletAddress]);

  return {
    balance,
    tokenAddress,
    isLoading,
    isConnected,
    error,
    refreshBalance
  };
}