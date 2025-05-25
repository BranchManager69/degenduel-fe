// src/components/dynamic/ComponentRegistry.tsx

/**
 * Dynamic Component Registry
 * 
 * @description Central registry for all AI-generatable components
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

import React, { Suspense, lazy } from 'react';
import { ComponentType, DynamicComponentProps } from './types';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

// Lazy load all dynamic components for performance
const PortfolioChart = lazy(() => import('./components/PortfolioChart'));
const TokenWatchlist = lazy(() => import('./components/TokenWatchlist'));
const PriceComparison = lazy(() => import('./components/PriceComparison'));
const MarketHeatmap = lazy(() => import('./components/MarketHeatmap'));
const TradingSignals = lazy(() => import('./components/TradingSignals'));
const PortfolioSummary = lazy(() => import('./components/PortfolioSummary'));
const TokenDetails = lazy(() => import('./components/TokenDetails'));
const AlertPanel = lazy(() => import('./components/AlertPanel'));
const PerformanceMetrics = lazy(() => import('./components/PerformanceMetrics'));
const LiquidityPools = lazy(() => import('./components/LiquidityPools'));
const TransactionHistory = lazy(() => import('./components/TransactionHistory'));

// Component registry mapping
const COMPONENT_REGISTRY: Record<ComponentType, React.LazyExoticComponent<React.ComponentType<DynamicComponentProps>>> = {
  portfolio_chart: PortfolioChart,
  token_watchlist: TokenWatchlist,
  price_comparison: PriceComparison,
  market_heatmap: MarketHeatmap,
  trading_signals: TradingSignals,
  portfolio_summary: PortfolioSummary,
  token_details: TokenDetails,
  alert_panel: AlertPanel,
  performance_metrics: PerformanceMetrics,
  liquidity_pools: LiquidityPools,
  transaction_history: TransactionHistory,
};

// Component metadata for AI to understand what each component does
export const COMPONENT_METADATA: Record<ComponentType, {
  name: string;
  description: string;
  use_cases: string[];
  required_data: string[];
  example_prompts: string[];
}> = {
  portfolio_chart: {
    name: "Portfolio Chart",
    description: "Visual representation of portfolio allocation and performance",
    use_cases: ["portfolio overview", "asset allocation", "performance tracking"],
    required_data: ["tokens", "weights", "values"],
    example_prompts: ["show my portfolio", "chart my holdings", "portfolio breakdown"]
  },
  token_watchlist: {
    name: "Token Watchlist",
    description: "Live updating list of token prices and metrics",
    use_cases: ["price monitoring", "market tracking", "alert setup"],
    required_data: ["token addresses", "current prices"],
    example_prompts: ["watch these tokens", "track SOL and ETH", "price monitor"]
  },
  price_comparison: {
    name: "Price Comparison",
    description: "Compare price movements between multiple tokens",
    use_cases: ["token analysis", "performance comparison", "trend analysis"],
    required_data: ["token addresses", "price history"],
    example_prompts: ["compare SOL vs ETH", "show token performance", "price battle"]
  },
  market_heatmap: {
    name: "Market Heatmap",
    description: "Visual market overview showing performance across tokens",
    use_cases: ["market overview", "sector analysis", "trend identification"],
    required_data: ["token list", "market caps", "price changes"],
    example_prompts: ["market overview", "show me the market", "heatmap view"]
  },
  trading_signals: {
    name: "Trading Signals",
    description: "AI-generated trading recommendations and signals",
    use_cases: ["trading advice", "entry/exit points", "market analysis"],
    required_data: ["market data", "technical indicators"],
    example_prompts: ["trading signals", "should I buy", "market recommendations"]
  },
  portfolio_summary: {
    name: "Portfolio Summary",
    description: "Comprehensive portfolio analytics and metrics",
    use_cases: ["performance review", "portfolio health", "investment summary"],
    required_data: ["portfolio data", "historical performance"],
    example_prompts: ["portfolio summary", "how am I doing", "investment review"]
  },
  token_details: {
    name: "Token Details",
    description: "Detailed information about a specific token",
    use_cases: ["token research", "fundamental analysis", "token overview"],
    required_data: ["token address", "token metadata", "price data"],
    example_prompts: ["tell me about SOL", "token info", "research this token"]
  },
  alert_panel: {
    name: "Alert Panel",
    description: "Price alerts and notification management",
    use_cases: ["price alerts", "notification setup", "alert management"],
    required_data: ["alert rules", "current prices"],
    example_prompts: ["set alerts", "notify me when", "price alerts"]
  },
  performance_metrics: {
    name: "Performance Metrics",
    description: "Advanced trading and portfolio performance analytics",
    use_cases: ["performance analysis", "trading metrics", "ROI tracking"],
    required_data: ["trading history", "portfolio performance"],
    example_prompts: ["show performance", "trading stats", "how profitable"]
  },
  liquidity_pools: {
    name: "Liquidity Pools",
    description: "DeFi liquidity pool information and opportunities",
    use_cases: ["yield farming", "liquidity provision", "DeFi opportunities"],
    required_data: ["pool data", "APY rates", "token pairs"],
    example_prompts: ["liquidity pools", "yield farming", "DeFi opportunities"]
  },
  transaction_history: {
    name: "Transaction History",
    description: "Detailed transaction history and analysis",
    use_cases: ["transaction review", "trading history", "tax reporting"],
    required_data: ["transaction data", "trade history"],
    example_prompts: ["transaction history", "my trades", "show transactions"]
  }
};

interface DynamicComponentRendererProps extends DynamicComponentProps {
  type: ComponentType;
  title?: string;
  closeable?: boolean;
}

export const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  type,
  id,
  data,
  title,
  closeable = true,
  onClose,
  onUpdate,
  className = ''
}) => {
  const Component = COMPONENT_REGISTRY[type];

  if (!Component) {
    console.error(`[DynamicComponentRegistry] Unknown component type: ${type}`);
    return (
      <Card className={`p-4 border-red-500/50 ${className}`}>
        <div className="text-red-400 text-center">
          <div className="text-lg font-mono">ERROR</div>
          <div className="text-sm">Unknown component: {type}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Component Header */}
      {(title || closeable) && (
        <div className="flex justify-between items-center p-3 border-b border-mauve/20 bg-darkGrey-dark/50">
          {title && (
            <h3 className="text-sm font-mono text-mauve-light font-semibold">
              {title}
            </h3>
          )}
          {closeable && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              title="Close component"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Component Content */}
      <div className="relative">
        <Suspense 
          fallback={
            <div className="p-6">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          }
        >
          <Component
            id={id}
            data={data}
            onClose={onClose}
            onUpdate={onUpdate}
            className="w-full"
          />
        </Suspense>
      </div>
    </Card>
  );
};

export default DynamicComponentRenderer;