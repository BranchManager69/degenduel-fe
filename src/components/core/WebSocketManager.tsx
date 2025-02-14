import React, { useEffect } from "react";
import { useAchievementWebSocket } from "../../hooks/useAchievementWebSocket";
import { useAnalyticsWebSocket } from "../../hooks/useAnalyticsWebSocket";
import { useCircuitBreakerSocket } from "../../hooks/useCircuitBreakerSocket";
import { usePortfolioWebSocket } from "../../hooks/usePortfolioWebSocket";
import { useServiceWebSocket } from "../../hooks/useServiceWebSocket";
import { useWalletWebSocket } from "../../hooks/useWalletWebSocket";
import { useStore } from "../../store/useStore";

export const WebSocketManager: React.FC = () => {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isAuthenticated = !!user?.session_token;

  // Only initialize WebSocket connections if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize user WebSocket connections
    const portfolio = usePortfolioWebSocket();
    const wallet = useWalletWebSocket();
    const achievements = useAchievementWebSocket();

    // Initialize admin-only connections
    let service: any, circuit: any, analytics: any;
    if (isAdmin) {
      service = useServiceWebSocket();
      circuit = useCircuitBreakerSocket();
      analytics = useAnalyticsWebSocket();
    }

    // Cleanup function
    return () => {
      // Close all active connections
      portfolio?.close?.();
      wallet?.close?.();
      achievements?.close?.();
      if (isAdmin) {
        service?.close?.();
        circuit?.close?.();
        analytics?.close?.();
      }
    };
  }, [isAuthenticated, isAdmin]);

  // This component doesn't render anything
  return null;
};
