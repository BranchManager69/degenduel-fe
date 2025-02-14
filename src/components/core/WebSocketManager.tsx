import React from "react";
import { useAnalyticsWebSocket } from "../../hooks/useAnalyticsWebSocket";
import { useCircuitBreakerSocket } from "../../hooks/useCircuitBreakerSocket";
import { usePortfolioWebSocket } from "../../hooks/usePortfolioWebSocket";
import { useServiceWebSocket } from "../../hooks/useServiceWebSocket";
import { useWalletWebSocket } from "../../hooks/useWalletWebSocket";
import { useStore } from "../../store/useStore";

export const WebSocketManager: React.FC = () => {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Initialize all required WebSocket connections
  usePortfolioWebSocket(); // Always connect for authenticated users
  useWalletWebSocket(); // Always connect for authenticated users

  // Admin-only connections
  if (isAdmin) {
    useServiceWebSocket();
    useCircuitBreakerSocket();
    useAnalyticsWebSocket();
  }

  // This component doesn't render anything
  return null;
};
