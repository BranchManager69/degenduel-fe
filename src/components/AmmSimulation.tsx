import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Simulation parameters. You can add more if needed. */
interface SimulationParams {
  days: number; // total simulation length in days
  hoursPerDay: number; // e.g. 24
  peakDay: number; // day at which 'peakMarketCap' occurs
  peakMarketCap: number; // e.g. 15,000,000
  saleFrequencyHours: number; // e.g. 12 => one sale every 12h
  tokensPerSale: number; // e.g. 10,000,000 => user's scheduled sale size
  recoveryFraction: number; // e.g. 0.5 => half the sale is "bought back" next hour
  volatilityPercent: number; // e.g. 0.03 => 3% random noise in drift
  driftStrength: number; // e.g. 0.10 => fraction of difference from target closed each hour
  initialSol: number; // 79
  initialTokens: number; // 200e6
  totalSupply: number; // 1e9
  solPriceUsd: number; // e.g. 250
}

interface DataPoint {
  hour: number;
  tokenPriceUsd: number;
  marketCapUsd: number;
  solInPool: number;
  tokensInPool: number;
  targetMarketCap: number;
}

const defaultParams: SimulationParams = {
  days: 30,
  hoursPerDay: 24,
  peakDay: 15,
  peakMarketCap: 15_000_000,
  saleFrequencyHours: 12,
  tokensPerSale: 10_000_000,
  recoveryFraction: 0.5,
  volatilityPercent: 0.03,
  driftStrength: 0.1,
  initialSol: 79,
  initialTokens: 200_000_000,
  totalSupply: 1_000_000_000,
  solPriceUsd: 250,
};

const AmmSimulation: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const simulateAmm = () => {
      const totalHours = params.days * params.hoursPerDay;
      const newData: DataPoint[] = [];

      let solInPool = params.initialSol;
      let tokensInPool = params.initialTokens;

      for (let hour = 0; hour < totalHours; hour++) {
        // Calculate target market cap based on time
        const day = hour / params.hoursPerDay;
        let targetMarketCap = 0;

        if (day <= params.peakDay) {
          // Linear increase to peak
          targetMarketCap = (day / params.peakDay) * params.peakMarketCap;
        } else {
          // Linear decrease after peak
          const remainingDays = params.days - params.peakDay;
          const daysAfterPeak = day - params.peakDay;
          targetMarketCap =
            params.peakMarketCap * (1 - (daysAfterPeak / remainingDays) * 0.5); // Decrease to 50% of peak
        }

        // Calculate current price and market cap
        const tokenPriceUsd = (solInPool / tokensInPool) * params.solPriceUsd;
        const marketCapUsd = tokenPriceUsd * params.totalSupply;

        // Add random noise
        const noise = 1 + (Math.random() * 2 - 1) * params.volatilityPercent;

        // Drift towards target
        const drift = (targetMarketCap - marketCapUsd) * params.driftStrength;
        const driftAdjustment = 1 + drift / marketCapUsd;

        // Apply noise and drift to pool
        solInPool *= noise * driftAdjustment;

        // Handle scheduled sales
        if (hour % params.saleFrequencyHours === 0 && hour > 0) {
          // Sell tokens
          const saleAmount = params.tokensPerSale;
          const newTokensInPool = tokensInPool + saleAmount;
          const newSolInPool = (tokensInPool * solInPool) / newTokensInPool;

          solInPool = newSolInPool;
          tokensInPool = newTokensInPool;

          // Recovery in next hour
          const recoveryTokens = saleAmount * params.recoveryFraction;
          const recoveredTokensInPool = tokensInPool - recoveryTokens;
          const recoveredSolInPool =
            (tokensInPool * solInPool) / recoveredTokensInPool;

          solInPool = recoveredSolInPool;
          tokensInPool = recoveredTokensInPool;
        }

        newData.push({
          hour,
          tokenPriceUsd,
          marketCapUsd,
          solInPool,
          tokensInPool,
          targetMarketCap,
        });
      }

      setData(newData);
    };

    simulateAmm();
  }, [params]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const handleParamChange = (key: keyof SimulationParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: parseFloat(value),
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-dark-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-primary">AMM Simulation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-dark-800 p-4 rounded-lg">
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-300 mb-1">
              {key}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) =>
                handleParamChange(key as keyof SimulationParams, e.target.value)
              }
              className="p-2 border border-dark-600 rounded bg-dark-700 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="h-[600px] w-full bg-dark-800 p-4 rounded-lg">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hour"
              label={{
                value: "Hours",
                position: "insideBottom",
                offset: -5,
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="left"
              label={{
                value: "Price (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: "Market Cap (USD)",
                angle: 90,
                position: "insideRight",
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.375rem",
                color: "#fff",
              }}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tokenPriceUsd"
              stroke="#8B5CF6"
              name="Token Price (USD)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="marketCapUsd"
              stroke="#10B981"
              name="Market Cap (USD)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="targetMarketCap"
              stroke="#F59E0B"
              name="Target Market Cap (USD)"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AmmSimulation;
