import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
// We'll need to update this once the diagnostics WebSocket is properly set up
// import { useBaseWebSocket } from './useBaseWebSocket';

interface UserSession {
  sessionId: string;
  userId: string;
  wallet: string;
  username: string;
  startTime: string;
  duration: number;
  device: string;
  browser: string;
  ip: string;
  location: string;
  active: boolean;
  lastActivity: string;
  activityHistory: Array<{
    action: string;
    timestamp: string;
    details?: any;
  }>;
}

interface UserError {
  id: string;
  userId: string;
  wallet: string;
  error: string;
  stack: string;
  browser: string;
  device: string;
  timestamp: string;
  url: string;
  resolved: boolean;
}

interface WalletDiagnostic {
  wallet: string;
  balance: number;
  lastTransaction: string;
  transactionCount: number;
  failedTransactions: number;
  connectedApps: string[];
  permissions: string[];
  status: 'healthy' | 'degraded' | 'error';
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
}

interface DiagnosticsData {
  activeSessions: UserSession[];
  userErrors: UserError[];
  walletDiagnostics: Record<string, WalletDiagnostic>;
}

export const useEnhancedDiagnostics = () => {
  const { user } = useStore();
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData>({
    activeSessions: [],
    userErrors: [],
    walletDiagnostics: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set up WebSocket connection for diagnostics
  // Mock these properties since we don't have a real diagnostics WebSocket yet
  const connected = true;
  const reconnect = () => console.log("Reconnecting to diagnostics websocket...");
  
  // Fetch initial diagnostic data via API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch active sessions
        const sessionsRes = await fetch('/api/superadmin/diagnostics/sessions');
        if (sessionsRes.ok) {
          const sessions = await sessionsRes.json();
          setDiagnosticsData(prev => ({ ...prev, activeSessions: sessions }));
        }
        
        // Fetch recent errors
        const errorsRes = await fetch('/api/superadmin/diagnostics/errors');
        if (errorsRes.ok) {
          const errors = await errorsRes.json();
          setDiagnosticsData(prev => ({ ...prev, userErrors: errors }));
        }
        
        // Fetch wallet diagnostics
        const walletsRes = await fetch('/api/superadmin/diagnostics/wallets');
        if (walletsRes.ok) {
          const wallets = await walletsRes.json();
          const walletMap: Record<string, WalletDiagnostic> = {};
          wallets.forEach((wallet: WalletDiagnostic) => {
            walletMap[wallet.wallet] = wallet;
          });
          setDiagnosticsData(prev => ({ ...prev, walletDiagnostics: walletMap }));
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch initial diagnostic data:', err);
        setError('Failed to load diagnostic data');
        setIsLoading(false);
      }
    };
    
    // Only fetch data if user is superadmin
    if (user?.is_superadmin) {
      fetchInitialData();
    }
  }, [user]);
  
  // Handle connection errors
  useEffect(() => {
    if (!connected && !isLoading) {
      setError('WebSocket connection lost. Attempting to reconnect...');
      
      // Auto-reconnect after 5 seconds
      const reconnectTimer = setTimeout(() => {
        reconnect();
        setError(null);
      }, 5000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [connected, isLoading]);
  
  // Utility functions
  const markErrorResolved = async (errorId: string) => {
    try {
      const response = await fetch(`/api/superadmin/diagnostics/errors/${errorId}/resolve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setDiagnosticsData(prev => ({
          ...prev,
          userErrors: prev.userErrors.map(err => 
            err.id === errorId ? { ...err, resolved: true } : err
          )
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to mark error as resolved:', err);
      return false;
    }
  };
  
  const disconnectSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/superadmin/diagnostics/sessions/${sessionId}/disconnect`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setDiagnosticsData(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.map(session => 
            session.sessionId === sessionId ? { ...session, active: false } : session
          )
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to disconnect session:', err);
      return false;
    }
  };
  
  // Make these null since they're not being used in the component
  const selectedWallet = null;
  const setSelectedWallet = () => { /* Empty function */ };
  
  return {
    isLoading,
    error,
    connected,
    diagnosticsData,
    selectedWallet,
    setSelectedWallet,
    markErrorResolved,
    disconnectSession,
    reconnect,
  };
};