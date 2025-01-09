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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setError(null);
        const response = await fetch(
          `${API_URL}/dd-serv/tokens/${tokenAddress}/price-history`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          // If we get a 502, wait and retry
          if (response.status === 502 && retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1);
            throw new Error("Temporary server error, retrying...");
          }
          throw new Error(`Server error: ${response.status}`);
        }

        const text = await response.text();
        let data;
        try {
          const parsed = JSON.parse(text);
          data = parsed.data || parsed; // Handle both {data: [...]} and direct array response
        } catch (e) {
          console.error("Failed to parse price history:", text.slice(0, 100));
          throw new Error("Invalid server response");
        }

        if (!Array.isArray(data)) {
          console.error("Unexpected data format:", data);
          throw new Error("Invalid data format");
        }

        // Take last 24 hours of data points, sampling every hour
        const sampledData = [...data] // Create a copy before sorting
          .sort((a: PricePoint, b: PricePoint) => a.timestamp - b.timestamp)
          .filter((_: PricePoint, i: number) => i % 60 === 0) // Assuming one point per minute
          .slice(-24);

        setPriceData(sampledData);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.warn(`Sparkline error for ${tokenAddress}:`, err);
        setError(
          err instanceof Error ? err.message : "Failed to load price data"
        );
      }
    };

    if (retryCount > 0) {
      const timeout = setTimeout(fetchPriceHistory, 1000 * retryCount);
      return () => clearTimeout(timeout);
    } else {
      fetchPriceHistory();
    }
  }, [tokenAddress, retryCount]);

  if (error) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        {/* Show a minimal placeholder instead of error message */}― ― ―
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
