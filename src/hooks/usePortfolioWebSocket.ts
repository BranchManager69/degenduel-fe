import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

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

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/api/v2/ws/portfolio",
    socketType: "portfolio",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
