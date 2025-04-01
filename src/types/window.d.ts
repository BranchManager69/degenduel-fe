import { TokenData } from '.';
import { AuthContextType } from '../contexts/AuthContext';

// Extend Window interface
interface Window {
  // TokenData mock
  useTokenDataMock?: () => {
    tokens: TokenData[];
    isConnected: boolean;
    error: null | Error;
    _refresh: () => void;
  };
  
  // Store mock
  useStoreMock?: () => {
    maintenanceMode: boolean;
    setMaintenanceMode: (mode: boolean) => void;
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
}