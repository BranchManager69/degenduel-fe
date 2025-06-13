import React, { useEffect, useState } from "react";
import { Area, AreaChart, YAxis } from "recharts";

import { API_URL } from "../../config/config";

interface PricePoint {
  price: number;
  timestamp: number;
}

interface TokenSparklineProps {
  tokenAddress: string;
  change24h: number | null | undefined;
  className?: string;
}

export const TokenSparkline: React.FC<TokenSparklineProps> = ({
  tokenAddress,
  change24h,
  className,
}) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, we'll keep using the existing API endpoint
    // This will be replaced with WebSocket-based price history in a future update
    const fetchPriceHistory = async () => {
      try {
        setError(null);
        const response = await fetch(
          `${API_URL}/dd-serv/tokens/${tokenAddress}/price-history`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.status === 502) {
          setError("unavailable");
          return;
        }

        const text = await response.text();
        let data;
        try {
          const parsed = JSON.parse(text);
          data = parsed.data || parsed;
        } catch (e) {
          console.error("Failed to parse price history:", text.slice(0, 100));
          throw new Error("Invalid server response");
        }

        if (!Array.isArray(data)) {
          console.error("Unexpected data format:", data);
          throw new Error("Invalid data format");
        }

        const sampledData = [...data]
          .sort((a: PricePoint, b: PricePoint) => a.timestamp - b.timestamp)
          .filter((_: PricePoint, i: number) => i % 60 === 0)
          .slice(-24);

        setPriceData(sampledData);
      } catch (err) {
        setError("unavailable");
      }
    };

    fetchPriceHistory();
    
    // TODO: In the future, implement WebSocket subscription for real-time price history
    // This would use the market_data topic with a specific request for historical data
  }, [tokenAddress]);

  if (error === "unavailable") {
    return (
      <div
        className={`h-12 w-full flex items-center justify-center ${className}`}
      >
        <div className="w-full h-[2px] bg-dark-300" />
      </div>
    );
  }

  if (!priceData.length) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-dark-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-12 w-full">
      <AreaChart
        width={120}
        height={48}
        data={priceData}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id={`gradient-${tokenAddress}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={(change24h ?? 0) >= 0 ? "#4ade80" : "#f87171"}
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor={(change24h ?? 0) >= 0 ? "#4ade80" : "#f87171"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <YAxis type="number" domain={["dataMin", "dataMax"]} hide />
        <Area
          type="monotone"
          dataKey="price"
          stroke={(change24h ?? 0) >= 0 ? "#4ade80" : "#f87171"}
          strokeWidth={1.5}
          fill={`url(#gradient-${tokenAddress})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
};
