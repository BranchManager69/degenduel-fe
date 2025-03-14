// src/components/core/WebSocketManager.tsx

/**
 * This component is used to manage all WebSocket connections for the application. *
 *
 * WARNING: WebSocketManager may or may not be
 *          DegenDuel's preferred method for managing WebSocket connections.
 *          Do not assume this is our latest and greatest method. Look around.
 */

import React, { useEffect } from "react";

import { useAchievementWebSocket } from "../../hooks/useAchievementWebSocket";
import { useAnalyticsWebSocket } from "../../hooks/useAnalyticsWebSocket";
import { useAuth } from "../../hooks/useAuth";
import { useCircuitBreakerSocket } from "../../hooks/useCircuitBreakerSocket";
import { useContestChatWebSocket } from "../../hooks/useContestChatWebSocket";
import { useContestWebSocket } from "../../hooks/useContestWebSocket";
import { useMarketDataWebSocket } from "../../hooks/useMarketDataWebSocket";
import { usePortfolioWebSocket } from "../../hooks/usePortfolioWebSocket";
import { useServiceWebSocket } from "../../hooks/useServiceWebSocket";
import { useWalletWebSocket } from "../../hooks/useWalletWebSocket";
import { useStore } from "../../store/useStore";

// WebSocketManager
//   TODO: It may or may not be the latest and greatest tool to do so; do not assume it is our preferred method.
export const WebSocketManager: React.FC = () => {
  const { user } = useStore();
  const { isAdmin } = useAuth();
  const isAuthenticated = !!user?.session_token;

  // Only initialize WebSocket connections if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize user WebSocket connections
    const portfolio = usePortfolioWebSocket();
    const wallet = useWalletWebSocket();
    const achievements = useAchievementWebSocket();

    /* Testing new websocket connections */

    // ----- (START NEW CONTEST and CONTEST CHAT WEBSOCKETS TESTING) -----
    // Select a contest offered by DegenDuel to subscribe to
    const contest_id = 19; // id=19 is the most recently created contest as of this writing
    //   TODO: Make this dynamically fetch the most recently created contest
    // (1) Initialize the contest WebSocket connection
    const contest = useContestWebSocket(contest_id.toString());
    console.log("contest", contest); // ?? log to satisfy eslint
    // (2) Initialize the contest chat WebSocket connection
    const contestChat = useContestChatWebSocket(contest_id.toString());
    console.log("contestChat", contestChat); // ?? log to satisfy eslint
    // ----- (END NEW CONTEST and CONTEST CHAT WEBSOCKETS TESTING) -----
    // ----- (START NEW MARKET DATA WEBSOCKETS TESTING) -----
    // (3.1) Select one or more DegenDuel-supported tokens to subscribe to
    const symbols = ["SOL", "BULLY", "jailstool"];
    // (3.2) Initialize market data WebSocket connections for the selected tokens
    const marketData = useMarketDataWebSocket(symbols);
    // If administrator, show market data for debugging purposes
    if (isAdmin()) {
      // Show market data to administrators (debugging purposes)
      console.log("marketData", marketData); // ?? log to satisfy eslint
    } else {
      // Hide market data from non-administrators (debugging purposes)
      console.log("marketData is restricted to administrators");
    }
    // ----- (END NEW MARKET DATA WEBSOCKETS TESTING) -----

    /* Initialize admin-only connections */

    // Enable the administrator-only connections
    let service: any, circuit: any, analytics: any;
    if (isAdmin()) {
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
      // ----- (START NEW TESTING) -----
      marketData?.close?.();
      contest?.close?.();
      contestChat?.leaveRoom?.();
      // TODO: contestChat WSS actually doesn't have a .close method because it doesn't implement useBaseWebSocket (unlike all other WebSocket connections).
      //           >> Okay... but is there a *particular reason* that it doesn't implement useBaseWebSocket?
      // ----- (END NEW TESTING) -----

      // Close administrator-only connections if the user is a non-administrator
      if (isAdmin()) {
        service?.close?.();
        circuit?.close?.();
        analytics?.close?.();
      }

      // Close the contest chat WebSocket connection
      //contestChat?.close?.();
      //     TODO: when does the contest chat WebSocket connection ever get closed!?!?!???
    };
  }, [isAuthenticated, isAdmin]);

  // This component doesn't render anything
  return null;
};
