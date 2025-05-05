import { TokenData } from '.';
import { AuthContextType } from '../contexts/AuthContext';

/**
 * ✨ UNIFIED WEBSOCKET SYSTEM ✨
 * This file has been updated to include global WebSocketContext reference 
 * used by the client log forwarder and other utility modules.
 */

// Extend Window interface
interface Window {
  // Flag for Storybook environment
  STORYBOOK_ENV?: boolean;
  STORYBOOK_BASE_PATH?: string;
  STORYBOOK_BASE_URL?: string;
  
  // Solana wallet
  solana?: {
    isConnected: boolean;
    isPhantom?: boolean;
    publicKey?: { toString: () => string };
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (options: {transaction: any}) => Promise<{ signature: string }>;
    signMessage?: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
    signTransaction?: (transaction: any) => Promise<any>;
  };
  
  // TokenData mock
  useTokenDataMock?: () => {
    tokens: TokenData[];
    isConnected: boolean;
    error: null | Error;
    _refresh: () => void;
  };
  
  // WebSocket hooks mock
  useUnifiedWebSocketMock?: (id: string, types: string[], callback: Function, topics?: string[]) => any;
  
  // RPC Benchmark WebSocket hooks mock
  useRPCBenchmarkWebSocket?: () => {
    data: any;
    isLoading: boolean;
    error: string | null;
    isConnected: boolean;
    isAuthenticated: boolean;
    isBenchmarkRunning: boolean;
    triggerBenchmark: () => boolean;
    refreshData: () => void;
  };
  
  // Store mock
  useStoreMock?: () => {
    maintenanceMode: boolean;
    setMaintenanceMode: (mode: boolean) => void;
    user?: any;
    setUser?: (user: any) => void;
  };
  
  // Direct mock of useStore for Storybook
  useStore?: () => {
    user: any | null;
    setUser: (user: any) => void;
    isWalletConnected: boolean;
    walletAddress: string | undefined;
    maintenanceMode: boolean;
    [key: string]: any; // Allow other props
  };
  
  // Auth context mock for Storybook
  useAuthContext?: () => AuthContextType;
  
  // ScrollFooter mock for Storybook
  useScrollFooterMock?: () => {
    isCompact: boolean;
    scrollDirection: 'up' | 'down' | 'none';
  };
  
  // Privy auth context mock for Storybook
  usePrivyAuth?: () => {
    isAuthenticated: boolean;
    isLoading: boolean;
    isPrivyLinked: boolean;
    user: any | null;
    login: () => void;
    logout: () => void;
    getAuthToken: () => Promise<string | null>;
    linkPrivyToWallet: () => Promise<boolean>;
    checkAuthStatus: () => Promise<void>;
  };
  
  // Terminal component properties
  contractAddress?: string;
  
  // Terminal data service properties for logging management
  terminalDataWarningShown?: boolean;
  terminalDataErrorCount?: number;
  terminalRefreshCount?: number;
  
  // WebSocketContext global reference for utilities
  // This allows non-React utilities to access the WebSocket connection
  __DD_WEBSOCKET_CONTEXT?: {
    sendMessage: (message: any) => boolean;
    isConnected: boolean;
  };
}