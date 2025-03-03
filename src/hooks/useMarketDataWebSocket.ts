// src/hooks/useMarketDataWebSocket.ts

/**
 * This hook is used to connect to the market data WebSocket.
 * It is used to receive market data for a given symbol.
 *
 * @param symbols - An array of symbols to subscribe to.
 * @returns An object containing the market price, volume, and sentiment functions.
 */

import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

/* Market data WebSocket */

// Data structure for a market price message
interface MarketPrice {
  type: "MARKET_PRICE";
  data: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    high_24h: number;
    low_24h: number;
    timestamp: string;
  };
}

// Data structure for a market volume message
interface MarketVolume {
  type: "MARKET_VOLUME";
  data: {
    symbol: string;
    volume: number;
    trades_count: number;
    buy_volume: number;
    sell_volume: number;
    interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    timestamp: string;
  };
}

// Data structure for a market sentiment message
interface MarketSentiment {
  type: "MARKET_SENTIMENT";
  data: {
    symbol: string;
    sentiment_score: number; // -1 to 1
    buy_pressure: number; // 0 to 1
    sell_pressure: number; // 0 to 1
    volume_trend: "increasing" | "decreasing" | "stable";
    timestamp: string;
  };
}

// Data structure for a market data message
type MarketDataMessage = MarketPrice | MarketVolume | MarketSentiment;

export const useMarketDataWebSocket = (symbols: string[]) => {
  const { updateMarketPrice, updateMarketVolume, updateMarketSentiment } =
    useStore();

  // Handle incoming messages from the server
  const handleMessage = (message: MarketDataMessage) => {
    switch (message.type) {
      case "MARKET_PRICE":
        updateMarketPrice(message.data);
        break;
      case "MARKET_VOLUME":
        updateMarketVolume(message.data);
        break;
      case "MARKET_SENTIMENT":
        updateMarketSentiment(message.data);
        break;
    }
  };

  // Initialize the WebSocket connection
  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/v2/ws/market?symbols=${symbols.join(",")}`,
    socketType: "market",
    onMessage: handleMessage,
    heartbeatInterval: 15000, // 15 second heartbeat for market data
    maxReconnectAttempts: 5,
  });
};
