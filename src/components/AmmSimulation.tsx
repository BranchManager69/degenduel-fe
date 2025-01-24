import React, { useEffect, useState } from "react";
import {
  Bar,
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
  priceImpact?: number; // Percentage impact of sale
  liquidityUsd?: number; // Total liquidity in USD
  saleAmountUsd?: number; // Size of sale in USD if there was one
}

const defaultParams: SimulationParams = {
  days: 30,
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

// Parameter groupings for better organization
const parameterGroups = {
  time: ["days", "peakDay"],
  market: ["peakMarketCap", "solPriceUsd"],
  pool: ["initialSol", "initialTokens", "totalSupply"],
  trading: ["saleFrequencyHours", "tokensPerSale"],
  simulation: ["recoveryFraction", "volatilityPercent", "driftStrength"],
};

// Formatting utilities
const formatters = {
  currency: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),

  price: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }),

  percent: new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),

  marketCap: (value: number) => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    return `$${(value / 1_000_000).toFixed(2)}M`;
  },

  day: (hour: number) => `Day ${Math.floor(hour / 24) + 1}`,
};

// Parameter display configuration
const parameterConfig: Record<
  keyof SimulationParams,
  {
    label: string;
    formatter: (value: number) => string;
    step: string;
    group: string;
    min?: number;
    max?: number;
  }
> = {
  days: {
    label: "Simulation Days",
    formatter: (v) => v.toString(),
    step: "1",
    group: "time",
    min: 1,
    max: 365,
  },
  peakDay: {
    label: "Peak Day",
    formatter: (v) => v.toString(),
    step: "1",
    group: "time",
    min: 1,
  },
  peakMarketCap: {
    label: "Peak Market Cap",
    formatter: formatters.marketCap,
    step: "1000000",
    group: "market",
    min: 0,
  },
  saleFrequencyHours: {
    label: "Sale Frequency (Hours)",
    formatter: (v) => v.toString(),
    step: "1",
    group: "trading",
    min: 1,
    max: 24,
  },
  tokensPerSale: {
    label: "Tokens Per Sale",
    formatter: (v) => v.toLocaleString(),
    step: "1000000",
    group: "trading",
    min: 0,
  },
  recoveryFraction: {
    label: "Recovery Fraction",
    formatter: formatters.percent.format,
    step: "0.01",
    group: "simulation",
    min: 0,
    max: 1,
  },
  volatilityPercent: {
    label: "Volatility",
    formatter: formatters.percent.format,
    step: "0.001",
    group: "simulation",
    min: 0,
    max: 1,
  },
  driftStrength: {
    label: "Drift Strength",
    formatter: formatters.percent.format,
    step: "0.01",
    group: "simulation",
    min: 0,
    max: 1,
  },
  initialSol: {
    label: "Initial SOL",
    formatter: (v) => v.toString(),
    step: "1",
    group: "pool",
    min: 0,
  },
  initialTokens: {
    label: "Initial Tokens",
    formatter: (v) => v.toLocaleString(),
    step: "1000000",
    group: "pool",
    min: 0,
  },
  totalSupply: {
    label: "Total Supply",
    formatter: (v) => v.toLocaleString(),
    step: "1000000",
    group: "pool",
    min: 0,
  },
  solPriceUsd: {
    label: "SOL Price (USD)",
    formatter: formatters.currency.format,
    step: "0.01",
    group: "market",
    min: 0,
  },
};

const AmmSimulation: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const simulateAmm = () => {
      const totalHours = params.days * 24; // Always use 24 hours
      const newData: DataPoint[] = [];

      let solInPool = params.initialSol;
      let tokensInPool = params.initialTokens;

      for (let hour = 0; hour < totalHours; hour++) {
        // Calculate target market cap based on time
        const day = hour / 24; // Always use 24 hours
        let targetMarketCap = 0;

        if (day <= params.peakDay) {
          // Linear increase to peak
          targetMarketCap = (day / params.peakDay) * params.peakMarketCap;
        } else {
          // Linear decrease after peak
          const remainingDays = params.days - params.peakDay;
          const daysAfterPeak = day - params.peakDay;
          targetMarketCap =
            params.peakMarketCap * (1 - (daysAfterPeak / remainingDays) * 0.5);
        }

        // Calculate current price and market cap
        const tokenPriceUsd = (solInPool / tokensInPool) * params.solPriceUsd;
        const marketCapUsd = tokenPriceUsd * params.totalSupply;
        const liquidityUsd = solInPool * params.solPriceUsd * 2; // Total liquidity (both sides)

        // Add random noise
        const noise = 1 + (Math.random() * 2 - 1) * params.volatilityPercent;

        // Drift towards target
        const drift = (targetMarketCap - marketCapUsd) * params.driftStrength;
        const driftAdjustment = 1 + drift / marketCapUsd;

        // Apply noise and drift to pool
        solInPool *= noise * driftAdjustment;

        let priceImpact = undefined;
        let saleAmountUsd = undefined;

        // Handle scheduled sales
        if (hour % params.saleFrequencyHours === 0 && hour > 0) {
          // Calculate price impact before the sale
          const saleAmount = params.tokensPerSale;
          const newTokensInPool = tokensInPool + saleAmount;
          const newSolInPool = (tokensInPool * solInPool) / newTokensInPool;
          const newPrice =
            (newSolInPool / newTokensInPool) * params.solPriceUsd;
          priceImpact = ((tokenPriceUsd - newPrice) / tokenPriceUsd) * 100;
          saleAmountUsd = saleAmount * tokenPriceUsd;

          // Execute sale
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
          priceImpact,
          liquidityUsd,
          saleAmountUsd,
        });
      }

      setData(newData);
    };

    simulateAmm();
  }, [params]);

  const handleParamChange = (key: keyof SimulationParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: parseFloat(value),
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-dark-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold text-primary">AMM Simulation</h1>

      {Object.entries(parameterGroups).map(([groupName, groupParams]) => (
        <div key={groupName} className="bg-dark-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-primary capitalize">
            {groupName} Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupParams.map((paramKey) => {
              const config =
                parameterConfig[paramKey as keyof SimulationParams];
              const value = params[paramKey as keyof SimulationParams];
              return (
                <div key={paramKey} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-300 mb-1">
                    {config.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {config.formatter(value)}
                    </span>
                    <input
                      type="number"
                      value={value}
                      step={config.step}
                      min={config.min}
                      max={config.max}
                      onChange={(e) =>
                        handleParamChange(
                          paramKey as keyof SimulationParams,
                          e.target.value
                        )
                      }
                      className="flex-1 p-2 border border-dark-600 rounded bg-dark-950 text-gray-100 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="h-[600px] w-full bg-dark-800 p-4 rounded-lg">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="hour"
              tickFormatter={(hour) => `Day ${Math.floor(hour / 24) + 1}`}
              label={{
                value: "Time",
                position: "insideBottom",
                offset: -5,
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatters.price.format(value)}
              label={{
                value: "Token Price (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatters.marketCap(value)}
              label={{
                value: "Market Cap",
                angle: 90,
                position: "insideRight",
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <YAxis
              yAxisId="impact"
              orientation="right"
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              domain={[0, 25]}
              label={{
                value: "Price Impact",
                angle: 90,
                position: "insideRight",
                offset: 50,
                fill: "#9CA3AF",
              }}
              stroke="#9CA3AF"
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                if (!props?.payload?.length) return ["-", name];
                const dataPoint = props.payload[0].payload;

                if (name === "Price Impact (%)") {
                  return dataPoint.priceImpact
                    ? [`${dataPoint.priceImpact.toFixed(1)}%`, "Price Impact"]
                    : ["-", "Price Impact"];
                }
                if (name === "Token Price (USD)") {
                  return [formatters.price.format(value), name];
                }
                if (name === "Liquidity") {
                  return [
                    formatters.currency.format(dataPoint.liquidityUsd || 0),
                    name,
                  ];
                }
                return [formatters.marketCap(value), name];
              }}
              labelFormatter={(hour) => `Day ${Math.floor(hour / 24) + 1}`}
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
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="marketCapUsd"
              stroke="#10B981"
              name="Market Cap"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="targetMarketCap"
              stroke="#F59E0B"
              name="Target Market Cap"
              strokeDasharray="5 5"
              dot={false}
            />
            <Bar
              yAxisId="impact"
              dataKey="priceImpact"
              fill="#EF4444"
              name="Price Impact (%)"
              opacity={0.75}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="liquidityUsd"
              stroke="#60A5FA"
              name="Liquidity"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AmmSimulation;
