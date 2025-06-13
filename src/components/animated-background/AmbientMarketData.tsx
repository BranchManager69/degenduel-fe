import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";

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
    {},
  );
  const { tokens, isConnected, lastUpdate } = useStandardizedTokenData("all", "volume", {}, 20, 50);
  const prevTokensRef = useRef<{
    [symbol: string]: { price: string; volume24h: string };
  }>({});
  const checkIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkForSignificantUpdates = () => {
    if (!tokens.length) return;

    const newData: Record<string, TokenMetrics> = {};
    const significantUpdates: TokenUpdate[] = [];

    // Process token data into metrics format
    tokens.forEach((token) => {
      const currentPrice = parseFloat(token.price?.toString() || "0");
      const currentVolume = parseFloat(token.volume24h?.toString() || "0");
      const prevToken = prevTokensRef.current[token.symbol];
      const prevPrice = prevToken
        ? parseFloat(prevToken.price || "0")
        : currentPrice;
      const prevVolume = prevToken
        ? parseFloat(prevToken.volume24h || "0")
        : currentVolume;

      // Calculate metrics
      const priceChange5m = prevPrice
        ? ((currentPrice - prevPrice) / prevPrice) * 100
        : 0;
      const volumeChange = prevVolume
        ? ((currentVolume - prevVolume) / prevVolume) * 100
        : 0;

      // Store calculated metrics
      newData[token.symbol] = {
        price: currentPrice,
        priceChange: {
          "5m": priceChange5m,
          "15m": 0, // We don't have this from WebSocket yet
          "30m": 0, // We don't have this from WebSocket yet
        },
        volume: {
          "5m": currentVolume,
          previous5m: prevVolume,
          change: volumeChange,
        },
        volatility: Math.abs(priceChange5m), // Simple volatility metric
      };

      // Price Change Detection (5m)
      if (Math.abs(priceChange5m) >= 2) {
        significantUpdates.push({
          id: `${token.symbol}-price-${Date.now()}`,
          symbol: token.symbol,
          name: token.name,
          logo:
            token.images?.imageUrl ||
            `/assets/tokens/${token.symbol.toLowerCase()}.png`,
          price: currentPrice,
          priceChange: priceChange5m,
          updateType: "price",
          description: `${Math.abs(priceChange5m).toFixed(1)}% ${
            priceChange5m > 0 ? "surge" : "drop"
          } in 5min`,
        });
      }

      // Volume Spike Detection (>200% increase in volume)
      if (volumeChange > 200) {
        significantUpdates.push({
          id: `${token.symbol}-volume-${Date.now()}`,
          symbol: token.symbol,
          name: token.name,
          logo:
            token.images?.imageUrl ||
            `/assets/tokens/${token.symbol.toLowerCase()}.png`,
          price: currentPrice,
          priceChange: volumeChange,
          updateType: "volume",
          description: `${volumeChange.toFixed(0)}% volume spike`,
        });
      }

      // Volatility Alert
      if (Math.abs(priceChange5m) > 50) {
        significantUpdates.push({
          id: `${token.symbol}-volatility-${Date.now()}`,
          symbol: token.symbol,
          name: token.name,
          logo:
            token.images?.imageUrl ||
            `/assets/tokens/${token.symbol.toLowerCase()}.png`,
          price: currentPrice,
          priceChange: Math.abs(priceChange5m),
          updateType: "volatility",
          description: "High volatility detected",
        });
      }

      // Price Milestone Detection
      const milestones = [1, 10, 100, 1000, 10000];
      const lastMetric = lastMetrics[token.symbol];
      if (lastMetric) {
        const crossedMilestone = milestones.find(
          (m) =>
            (lastMetric.price < m && currentPrice >= m) ||
            (lastMetric.price >= m && currentPrice < m),
        );

        if (crossedMilestone) {
          significantUpdates.push({
            id: `${token.symbol}-milestone-${Date.now()}`,
            symbol: token.symbol,
            name: token.name,
            logo:
              token.images?.imageUrl ||
              `/assets/tokens/${token.symbol.toLowerCase()}.png`,
            price: currentPrice,
            priceChange: 0,
            updateType: "milestone",
            description: `${
              currentPrice >= crossedMilestone
                ? "crossed above"
                : "dropped below"
            } $${crossedMilestone}`,
          });
        }
      }
    });

    // Update references for next comparison
    tokens.forEach((token) => {
      prevTokensRef.current[token.symbol] = {
        price: token.price?.toString() || "0",
        volume24h: token.volume24h?.toString() || "0",
      };
    });

    setLastMetrics(newData);

    // Add significant updates to the queue
    if (significantUpdates.length > 0) {
      setUpdates((prev) => [...prev, ...significantUpdates].slice(-5));
    }
  };

  // Effect to process token data when received
  useEffect(() => {
    if (isConnected && tokens.length > 0 && lastUpdate) {
      // Clear any existing check interval
      if (checkIntervalRef.current) {
        clearTimeout(checkIntervalRef.current);
      }

      // Process updates on token data changes
      checkForSignificantUpdates();

      // Schedule periodic checks (can be more frequent now that we're not fetching)
      checkIntervalRef.current = setInterval(checkForSignificantUpdates, 15000);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [tokens, isConnected, lastUpdate]);

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
              update.updateType,
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
