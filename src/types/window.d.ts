import { TokenData } from '.';

// Extend Window interface
interface Window {
  useTokenDataMock?: () => {
    tokens: TokenData[];
    isConnected: boolean;
    error: null | Error;
    _refresh: () => void;
  };
  useStoreMock?: () => {
    maintenanceMode: boolean;
    setMaintenanceMode: (mode: boolean) => void;
  };
  // Terminal component properties
  contractAddress?: string;
}