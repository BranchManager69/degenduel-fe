// src/components/dynamic/types.ts

/**
 * Enhanced Dynamic UI Types for Production System
 * 
 * @description Complete type system for AI-driven dynamic components
 * @author BranchManager69 + Claude Code
 * @version 2.0.0 - Production Ready
 * @created 2025-05-26
 */

// Enhanced component types with new advanced components
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
  | 'transaction_history'
  | 'contest_leaderboard'
  | 'live_activity_feed'
  | 'user_comparison'
  | 'token_analysis'
  | 'token_tracking_monitor';

// Enhanced placement system supporting all backend placements
export type ComponentPlacement = 
  | 'below_terminal'    // Under terminal chat (original)
  | 'main_view'         // Takes over main content area
  | 'sidebar_left'      // Left sidebar panel
  | 'sidebar_right'     // Right sidebar panel  
  | 'modal'             // Overlay modal
  | 'fullscreen'        // Fullscreen takeover
  | 'inline'            // Inline with content
  | 'floating'          // Floating widget
  | 'above_terminal'    // Backward compatibility
  | 'sidebar';          // Backward compatibility

// Enhanced animation types
export type ComponentAnimation = 
  | 'fade_in'
  | 'slide_up'
  | 'slide_down'
  | 'slide_left'
  | 'slide_right'
  | 'scale_in'
  | 'bounce_in'
  | 'flip_in'
  | 'none';

// Component lifecycle states
export type ComponentLifecycle = 
  | 'initializing'
  | 'loading'
  | 'active'
  | 'updating'
  | 'error'
  | 'removing';

// Component interaction capabilities
export interface ComponentInteractions {
  clickable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  closeable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  refreshable?: boolean;
  shareable?: boolean;
}

// Enhanced UI Action with full backend compatibility
export interface UIAction {
  type: 'create_component' | 'update_component' | 'remove_component' | 'replace_component';
  component: ComponentType | string; // Allow string for backward compatibility
  id: string;
  placement?: ComponentPlacement;
  data?: any;
  title?: string;
  animation?: ComponentAnimation;
  duration?: number; // Auto-remove after N seconds
  priority?: 'low' | 'medium' | 'high' | 'critical';
  interactions?: ComponentInteractions;
  closeable?: boolean; // Backward compatibility
  
  // Layout options
  layout?: {
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    position?: 'relative' | 'absolute' | 'fixed';
    zIndex?: number;
  };
  
  // Responsive behavior
  responsive?: {
    mobile?: Partial<UIAction>;
    tablet?: Partial<UIAction>;
    desktop?: Partial<UIAction>;
  };
  
  // Relationships with other components
  relationships?: {
    dependsOn?: string[];      // Component IDs this depends on
    updates?: string[];        // Component IDs this can update
    replaces?: string;         // Component ID this replaces
    groupId?: string;          // Group components together
  };
}

// Legacy interface for backward compatibility
export interface AIResponseWithUI {
  text: string;
  ui_actions?: UIAction[];
  conversation_id?: string;
  tool_calls?: any[];
}

// Component state management
export interface ComponentState {
  id: string;
  type: ComponentType | string;
  placement: ComponentPlacement;
  lifecycle: ComponentLifecycle;
  data: any;
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    interactionCount: number;
    errorCount: number;
  };
  config: UIAction;
}

// Layout management
export interface LayoutState {
  mainView: {
    occupied: boolean;
    componentId?: string;
    previousContent?: React.ReactNode;
  };
  sidebars: {
    left: {
      open: boolean;
      width: string;
      components: string[];
    };
    right: {
      open: boolean;
      width: string;
      components: string[];
    };
  };
  modals: {
    stack: string[];
    maxDepth: number;
  };
  floating: {
    components: string[];
    maxCount: number;
  };
}

// Enhanced component props with full feature support
export interface DynamicComponentProps {
  id: string;
  data?: any;
  className?: string;
  onClose?: () => void;
  onUpdate?: (newData: any) => void;
  onInteraction?: (type: string, payload?: any) => void;
  onError?: (error: Error) => void;
  state?: ComponentLifecycle;
}

// Performance monitoring
export interface ComponentPerformance {
  renderTime: number;
  dataLoadTime: number;
  interactionLatency: number;
  memoryUsage: number;
  errorRate: number;
}

// Event system for component communication
export interface ComponentEvent {
  type: string;
  sourceId: string;
  targetId?: string;
  payload?: any;
  timestamp: Date;
}

// Utility types
export type ComponentEventHandler = (event: ComponentEvent) => void;
export type ComponentDataLoader = (componentId: string, config: UIAction) => Promise<any>;
export type ComponentValidator = (data: any) => boolean;

// ===== ENHANCED DATA INTERFACES =====

// Portfolio Chart (Enhanced)
export interface PortfolioChartData {
  tokens: Array<{
    symbol: string;
    weight: number;
    value: number;
    change_24h: number;
    color?: string;
    profit_loss?: number;
    entry_price?: number;
  }>;
  timeframe?: '1H' | '24H' | '7D' | '30D';
  chart_type?: 'pie' | 'donut' | 'bar' | 'line' | 'treemap';
  total_value?: number;
  total_change?: number;
  benchmark_comparison?: boolean;
}

// Token Watchlist (Enhanced)
export interface TokenWatchlistData {
  tokens: Array<{
    symbol: string;
    address: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    market_cap?: number;
    alerts?: boolean;
    sparkline?: number[];
    liquidity?: number;
    holders?: number;
  }>;
  sortBy?: 'price' | 'change' | 'volume' | 'market_cap' | 'liquidity';
  compact?: boolean;
  live_updates?: boolean;
  filters?: {
    min_market_cap?: number;
    max_market_cap?: number;
    min_change?: number;
    max_change?: number;
  };
}

// Price Comparison (Enhanced)
export interface PriceComparisonData {
  tokens: Array<{
    symbol: string;
    address: string;
    price_history: Array<{
      timestamp: number;
      price: number;
      volume?: number;
    }>;
    correlation?: number;
  }>;
  timeframe: '1H' | '24H' | '7D' | '30D';
  base_currency?: 'USD' | 'SOL' | 'ETH';
  chart_type?: 'line' | 'candle' | 'area';
  indicators?: string[];
}

// Market Heatmap (Enhanced)
export interface MarketHeatmapData {
  tokens: Array<{
    symbol: string;
    market_cap: number;
    change_24h: number;
    volume_24h: number;
    category?: string;
    risk_level?: 'low' | 'medium' | 'high';
  }>;
  metric?: 'market_cap' | 'volume' | 'change' | 'liquidity';
  size?: 'small' | 'medium' | 'large';
  grouping?: 'category' | 'market_cap' | 'none';
}

// Contest Leaderboard
export interface ContestLeaderboardData {
  contest: {
    id: string;
    name: string;
    status: 'upcoming' | 'active' | 'ended';
    participants: number;
    prize_pool: number;
    time_remaining?: number;
  };
  rankings: Array<{
    rank: number;
    user: string;
    avatar?: string;
    performance: number;
    portfolio_value: number;
    trades_count: number;
    change_24h: number;
  }>;
  user_rank?: number;
  user_performance?: number;
}

// Live Activity Feed
export interface LiveActivityFeedData {
  activities: Array<{
    id: string;
    type: 'trade' | 'contest_join' | 'achievement' | 'price_alert';
    user?: string;
    timestamp: Date;
    description: string;
    amount?: number;
    token?: string;
    impact_level?: 'low' | 'medium' | 'high';
  }>;
  real_time?: boolean;
  max_items?: number;
  filters?: string[];
}

// Trading Signals
export interface TradingSignalsData {
  signals: Array<{
    id: string;
    token: string;
    signal_type: 'buy' | 'sell' | 'hold';
    confidence: number;
    price_target?: number;
    stop_loss?: number;
    timeframe: string;
    indicators: string[];
    generated_at: Date;
  }>;
  market_sentiment?: 'bullish' | 'bearish' | 'neutral';
  risk_level?: 'low' | 'medium' | 'high';
}