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
  const [activeTab, setActiveTab] =
    useState<keyof typeof parameterGroups>("time");

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h1 className="text-3xl font-bold text-gray-100 mb-2 group-hover:animate-glitch">
          AMM Simulator
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
          Simulate automated market maker behavior with various parameters
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg hover:border-brand-400/20 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
            <div className="p-6 relative">
              <h2 className="text-xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
                Simulation Parameters
              </h2>

              {/* Parameter Tabs */}
              <div className="flex space-x-2 mb-6 overflow-x-auto">
                {Object.entries(parameterGroups).map(([group]) => (
                  <button
                    key={group}
                    onClick={() =>
                      setActiveTab(group as keyof typeof parameterGroups)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative group overflow-hidden
                      ${
                        activeTab === group
                          ? "bg-brand-400/20 text-brand-400 border border-brand-400/40"
                          : "text-gray-400 hover:text-gray-200 hover:bg-dark-300/50"
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                    <span className="relative group-hover:animate-glitch capitalize">
                      {group}
                    </span>
                  </button>
                ))}
              </div>

              {/* Parameter Inputs */}
              <div className="space-y-4">
                {Object.entries(parameterConfig)
                  .filter(([_, config]) => config.group === activeTab)
                  .map(([key, config]) => (
                    <div key={key} className="group">
                      <label className="block text-sm font-medium text-gray-300 mb-1 group-hover:animate-glitch">
                        {config.label}
                      </label>
                      <input
                        type="number"
                        value={params[key as keyof SimulationParams]}
                        onChange={(e) =>
                          handleParamChange(
                            key as keyof SimulationParams,
                            e.target.value
                          )
                        }
                        step={config.step}
                        min={config.min}
                        max={config.max}
                        className="w-full bg-dark-300/50 border border-dark-400 rounded-lg px-4 py-2 text-gray-100 
                          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent 
                          transition-colors group-hover:border-brand-400/20"
                      />
                      <p className="mt-1 text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
                        Current:{" "}
                        {config.formatter(
                          params[key as keyof SimulationParams]
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Market Cap Chart */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
            <div className="relative">
              <h3 className="text-lg font-bold text-gray-100 mb-4 group-hover:animate-glitch">
                Market Cap & Price
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatters.day}
                      stroke="#A0AEC0"
                    />
                    <YAxis
                      yAxisId="marketCap"
                      tickFormatter={formatters.marketCap}
                      stroke="#A0AEC0"
                    />
                    <YAxis
                      yAxisId="price"
                      orientation="right"
                      tickFormatter={formatters.currency.format}
                      stroke="#A0AEC0"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(26, 32, 44, 0.9)",
                        border: "1px solid #2D3748",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "Market Cap"
                          ? formatters.marketCap(value)
                          : formatters.currency.format(value),
                        name,
                      ]}
                      labelFormatter={formatters.day}
                    />
                    <Legend />
                    <Line
                      yAxisId="marketCap"
                      type="monotone"
                      dataKey="marketCapUsd"
                      name="Market Cap"
                      stroke="#7F00FF"
                      dot={false}
                    />
                    <Line
                      yAxisId="marketCap"
                      type="monotone"
                      dataKey="targetMarketCap"
                      name="Target"
                      stroke="#7F00FF40"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      yAxisId="price"
                      type="monotone"
                      dataKey="tokenPriceUsd"
                      name="Price"
                      stroke="#00E5FF"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Liquidity Chart */}
          <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-6 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
            <div className="relative">
              <h3 className="text-lg font-bold text-gray-100 mb-4 group-hover:animate-glitch">
                Liquidity & Sales
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatters.day}
                      stroke="#A0AEC0"
                    />
                    <YAxis
                      yAxisId="liquidity"
                      tickFormatter={formatters.marketCap}
                      stroke="#A0AEC0"
                    />
                    <YAxis
                      yAxisId="impact"
                      orientation="right"
                      tickFormatter={formatters.percent.format}
                      stroke="#A0AEC0"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(26, 32, 44, 0.9)",
                        border: "1px solid #2D3748",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "Liquidity"
                          ? formatters.marketCap(value)
                          : name === "Sale Amount"
                          ? formatters.currency.format(value)
                          : formatters.percent.format(value),
                        name,
                      ]}
                      labelFormatter={formatters.day}
                    />
                    <Legend />
                    <Line
                      yAxisId="liquidity"
                      type="monotone"
                      dataKey="liquidityUsd"
                      name="Liquidity"
                      stroke="#7F00FF"
                      dot={false}
                    />
                    <Line
                      yAxisId="impact"
                      type="monotone"
                      dataKey="priceImpact"
                      name="Price Impact"
                      stroke="#FF0080"
                      dot={false}
                    />
                    <Bar
                      yAxisId="liquidity"
                      dataKey="saleAmountUsd"
                      name="Sale Amount"
                      fill="#00E5FF40"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmmSimulation;
