// src/components/dynamic/index.ts

/**
 * Dynamic UI System Exports
 * 
 * @description Central export file for the dynamic UI generation system
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

export { default as DynamicUIManager, setGlobalUIHandler, triggerUIAction } from './DynamicUIManager';
export { default as DynamicComponentRenderer, COMPONENT_METADATA } from './ComponentRegistry';
export * from './types';

// Individual component exports
export { default as PortfolioChart } from './components/PortfolioChart';
export { default as TokenWatchlist } from './components/TokenWatchlist';
export { default as PriceComparison } from './components/PriceComparison';
export { default as MarketHeatmap } from './components/MarketHeatmap';
export { default as TradingSignals } from './components/TradingSignals';
export { default as PortfolioSummary } from './components/PortfolioSummary';
export { default as TokenDetails } from './components/TokenDetails';
export { default as AlertPanel } from './components/AlertPanel';
export { default as PerformanceMetrics } from './components/PerformanceMetrics';
export { default as LiquidityPools } from './components/LiquidityPools';
export { default as TransactionHistory } from './components/TransactionHistory';