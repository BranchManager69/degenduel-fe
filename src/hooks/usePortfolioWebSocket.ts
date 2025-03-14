// src/hooks/usePortfolioWebSocket.ts

/**
 * This hook is used to get the portfolio updates from the portfolio service.
 * It uses a WebSocket connection to get the updates and a fallback to the Admin API if the WebSocket connection fails.
 *
 * @returns {Object} An object containing the portfolio updates, loading state, error state, and a function to refresh the updates.
 */

import { useBaseWebSocket } from "./useBaseWebSocket";
import { WS_URL } from "../config/config";
import { useStore } from "../store/useStore";

interface PortfolioUpdate {
  type: "PORTFOLIO_UPDATED";
  data: {
    tokens: Array<{
      symbol: string;
      name: string;
      amount: number;
      value: number;
    }>;
    total_value: number;
    performance_24h: number;
  };
  timestamp: string;
}

interface TradeExecution {
  type: "TRADE_EXECUTED";
  data: {
    trade_id: string;
    wallet_address: string;
    symbol: string;
    amount: number;
    price: number;
    timestamp: string;
    contest_id?: string;
  };
}

interface PriceUpdate {
  type: "PRICE_UPDATED";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    timestamp: string;
  };
}

type PortfolioMessage = PortfolioUpdate | TradeExecution | PriceUpdate;

export const usePortfolioWebSocket = () => {
  const { updatePortfolio, updateTokenPrice, addTradeNotification } =
    useStore();

  const handleMessage = (message: PortfolioMessage) => {
    switch (message.type) {
      case "PORTFOLIO_UPDATED":
        updatePortfolio(message.data);
        break;
      case "TRADE_EXECUTED":
        addTradeNotification(message.data);
        break;
      case "PRICE_UPDATED":
        updateTokenPrice(message.data);
        break;
    }
  };

  // Use WS_URL from config which handles proper environment detection
  //const { WS_URL } = require("../config/config"); // Moved to imports (top of file)

  return useBaseWebSocket({
    url: WS_URL,
    endpoint: "/v2/ws/portfolio", // Append specific endpoint for portfolio service
    socketType: "portfolio",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
