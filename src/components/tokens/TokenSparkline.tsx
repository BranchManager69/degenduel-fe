import React, { useEffect, useState } from "react";
import { Area, AreaChart, YAxis } from "recharts";

interface PricePoint {
  price: number;
  timestamp: number;
}

interface TokenSparklineProps {
  tokenAddress: string;
  change24h: number | null | undefined;
}

export const TokenSparkline: React.FC<TokenSparklineProps> = ({
  tokenAddress,
  change24h,
}) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        const response = await fetch(
          `https://degenduel.me/api/dd-serv/tokens/${tokenAddress}/price-history`
          ////`https://data.degenduel.me/api/tokens/${tokenAddress}/price-history`
        );
        const { data } = await response.json();
        // Take last 24 hours of data points, sampling every hour
        const sampledData = data
          .sort((a: PricePoint, b: PricePoint) => a.timestamp - b.timestamp)
          .filter((_: PricePoint, i: number) => i % 60 === 0) // Assuming one point per minute
          .slice(-24);
        setPriceData(sampledData);
      } catch (error) {
        console.error("Failed to fetch price history:", error);
      }
    };

    fetchPriceHistory();
  }, [tokenAddress]);

  if (!priceData.length) return null;

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
