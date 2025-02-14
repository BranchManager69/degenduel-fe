import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

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

type MarketDataMessage = MarketPrice | MarketVolume | MarketSentiment;

export const useMarketDataWebSocket = (symbols: string[]) => {
  const { updateMarketPrice, updateMarketVolume, updateMarketSentiment } =
    useStore();

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

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: `/api/v2/ws/market?symbols=${symbols.join(",")}`,
    socketType: "market",
    onMessage: handleMessage,
    heartbeatInterval: 15000, // 15 second heartbeat for market data
    maxReconnectAttempts: 5,
  });
};
