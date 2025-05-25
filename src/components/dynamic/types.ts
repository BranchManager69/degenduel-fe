// src/components/dynamic/types.ts

/**
 * Dynamic UI Generation System Types
 * 
 * @description Core types for AI-driven dynamic component generation
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

export interface UIAction {
  type: 'create_component' | 'update_component' | 'remove_component' | 'replace_component';
  component: string;
  data?: any;
  placement?: 'above_terminal' | 'below_terminal' | 'sidebar_left' | 'sidebar_right' | 'fullscreen' | 'inline';
  id: string;
  animation?: 'fade_in' | 'slide_up' | 'slide_down' | 'scale_in' | 'none';
  duration?: number; // Auto-remove after X seconds
  title?: string;
  closeable?: boolean;
}

export interface AIResponseWithUI {
  text: string;
  ui_actions?: UIAction[];
  conversation_id?: string;
  tool_calls?: any[];
}

export interface DynamicComponentProps {
  id: string;
  data?: any;
  onClose?: () => void;
  onUpdate?: (newData: any) => void;
  className?: string;
}

// Registry of available dynamic components
export type ComponentType = 
  | 'portfolio_chart'
  | 'token_watchlist' 
  | 'price_comparison'
  | 'market_heatmap'
  | 'trading_signals'
  | 'portfolio_summary'
  | 'token_details'
  | 'alert_panel'
  | 'performance_metrics'
  | 'liquidity_pools'
  | 'transaction_history';

// Component data interfaces
export interface PortfolioChartData {
  tokens: Array<{
    symbol: string;
    weight: number;
    value: number;
    change_24h: number;
    color?: string;
  }>;
  timeframe?: '1H' | '24H' | '7D' | '30D';
  chart_type?: 'pie' | 'donut' | 'bar' | 'line';
}

export interface TokenWatchlistData {
  tokens: Array<{
    symbol: string;
    address: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    market_cap?: number;
    alerts?: boolean;
  }>;
  sortBy?: 'price' | 'change' | 'volume' | 'market_cap';
  compact?: boolean;
}

export interface PriceComparisonData {
  tokens: Array<{
    symbol: string;
    address: string;
    price_history: Array<{
      timestamp: number;
      price: number;
    }>;
  }>;
  timeframe: '1H' | '24H' | '7D' | '30D';
  base_currency?: 'USD' | 'SOL' | 'ETH';
}

export interface MarketHeatmapData {
  tokens: Array<{
    symbol: string;
    market_cap: number;
    change_24h: number;
    volume_24h: number;
  }>;
  metric?: 'market_cap' | 'volume' | 'change';
  size?: 'small' | 'medium' | 'large';
}