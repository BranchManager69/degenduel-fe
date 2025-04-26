/// <reference types="vite/client" />

// Extend Window interface for Terminal data service
interface Window {
  // Terminal data service properties for logging management
  terminalDataWarningShown?: boolean;
  terminalDataErrorCount?: number;
  terminalRefreshCount?: number;
}
