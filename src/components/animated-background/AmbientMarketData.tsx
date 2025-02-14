import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ddApi } from "../../services/dd-api";

interface TokenUpdate {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  priceChange: number;
  updateType: "price" | "volume" | "milestone" | "volatility";
  description: string;
}

interface TokenMetrics {
  price: number;
  priceChange: {
    "5m": number;
    "15m": number;
    "30m": number;
  };
  volume: {
    "5m": number;
    previous5m: number;
    change: number;
  };
  volatility?: number;
}

export const AmbientMarketData: React.FC = () => {
  const [updates, setUpdates] = useState<TokenUpdate[]>([]);
  const [lastMetrics, setLastMetrics] = useState<Record<string, TokenMetrics>>(
    {}
  );

  const checkForSignificantUpdates = (
    newData: Record<string, TokenMetrics>
  ) => {
    const significantUpdates: TokenUpdate[] = [];

    Object.entries(newData).forEach(([symbol, metrics]) => {
      const lastMetric = lastMetrics[symbol];

      // Price Change Detection (5m)
      if (Math.abs(metrics.priceChange["5m"]) >= 2) {
        significantUpdates.push({
          id: `${symbol}-price-${Date.now()}`,
          symbol,
          name: symbol,
          logo: `/assets/tokens/${symbol.toLowerCase()}.png`,
          price: metrics.price,
          priceChange: metrics.priceChange["5m"],
          updateType: "price",
          description: `${Math.abs(metrics.priceChange["5m"]).toFixed(1)}% ${
            metrics.priceChange["5m"] > 0 ? "surge" : "drop"
          } in 5min`,
        });
      }

      // Volume Spike Detection (>200% increase in 5m volume compared to previous 5m)
      if (metrics.volume.change > 200) {
        significantUpdates.push({
          id: `${symbol}-volume-${Date.now()}`,
          symbol,
          name: symbol,
          logo: `/assets/tokens/${symbol.toLowerCase()}.png`,
          price: metrics.price,
          priceChange: metrics.volume.change,
          updateType: "volume",
          description: `${metrics.volume.change.toFixed(0)}% volume spike`,
        });
      }

      // Volatility Alert (if available)
      if (metrics.volatility && metrics.volatility > 50) {
        significantUpdates.push({
          id: `${symbol}-volatility-${Date.now()}`,
          symbol,
          name: symbol,
          logo: `/assets/tokens/${symbol.toLowerCase()}.png`,
          price: metrics.price,
          priceChange: metrics.volatility,
          updateType: "volatility",
          description: "High volatility detected",
        });
      }

      // Price Milestone Detection
      const milestones = [1, 10, 100, 1000, 10000];
      if (lastMetric) {
        const crossedMilestone = milestones.find(
          (m) =>
            (lastMetric.price < m && metrics.price >= m) ||
            (lastMetric.price >= m && metrics.price < m)
        );

        if (crossedMilestone) {
          significantUpdates.push({
            id: `${symbol}-milestone-${Date.now()}`,
            symbol,
            name: symbol,
            logo: `/assets/tokens/${symbol.toLowerCase()}.png`,
            price: metrics.price,
            priceChange: 0,
            updateType: "milestone",
            description: `${
              metrics.price >= crossedMilestone
                ? "crossed above"
                : "dropped below"
            } $${crossedMilestone}`,
          });
        }
      }
    });

    setLastMetrics(newData);
    return significantUpdates;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchTokenData = async () => {
      try {
        const response = await ddApi.fetch("/api/tokens/metrics");
        const data = await response.json();

        if (data.success) {
          const newUpdates = checkForSignificantUpdates(data.metrics);
          if (newUpdates.length > 0) {
            setUpdates((prev) => [...prev, ...newUpdates].slice(-5));
          }
        }
      } catch (err) {
        console.error("Failed to fetch token metrics:", err);
      }
    };

    // Initial fetch after 5 second buffer
    const initialTimeout = setTimeout(() => {
      fetchTokenData();
      // Then start the 30-second interval
      interval = setInterval(fetchTokenData, 30000);
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const getUpdateStyles = (updateType: string) => {
    switch (updateType) {
      case "price":
        return "border-brand-400/20";
      case "volume":
        return "border-purple-400/20";
      case "volatility":
        return "border-red-400/20";
      case "milestone":
        return "border-cyan-400/20";
      default:
        return "border-brand-400/20";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {updates.map((update) => (
          <motion.div
            key={update.id}
            initial={{
              opacity: 0,
              scale: 0.8,
              x: Math.random() < 0.5 ? -100 : window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: Math.random() * 20 - 10,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1.1, 1, 0.9],
              x: Math.random() < 0.5 ? window.innerWidth : -100,
              y: Math.random() * window.innerHeight,
              rotate: [Math.random() * 20 - 10, 0, 0, Math.random() * 20 - 10],
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotate: Math.random() * 20 - 10,
            }}
            transition={{
              duration: 8,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={`absolute flex items-center gap-2 bg-dark-200/80 backdrop-blur-sm border ${getUpdateStyles(
              update.updateType
            )} rounded-lg px-3 py-2 shadow-lg shadow-brand-400/5`}
          >
            <div className="relative">
              <img
                src={update.logo}
                alt={update.symbol}
                className="w-6 h-6 rounded-full"
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-white/10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeOut",
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-200">
                {update.symbol}
              </span>
              <span
                className={`text-xs ${
                  update.updateType === "price"
                    ? update.priceChange > 0
                      ? "text-green-400"
                      : "text-red-400"
                    : update.updateType === "volume"
                    ? "text-purple-400"
                    : update.updateType === "volatility"
                    ? "text-red-400"
                    : "text-cyan-400"
                }`}
              >
                {update.description}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
