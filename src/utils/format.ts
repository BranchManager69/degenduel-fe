// src/utils/format.ts

/**
 * Format a number with commas and optional decimals
 * 
 * @param value - The number to format (string or number)
 * @param decimals - The number of decimals to display (default is 2)
 * @returns The formatted number
 * 
 * @author @BranchManager69
 * @version 1.9.0
 * @created 2025-04-29
 * @updated 2025-04-30
 */

// Format a number with commas and optional decimals
export const formatNumber = (value: string | number, format?: 'short' | number, forceDecimals = false) => {
  const num = Number(value);
  if (isNaN(num)) return "0";
  
  // Handle 'short' format for very compact display
  if (format === 'short') {
    if (num >= 1e12) return (num / 1e12).toFixed(0) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toFixed(0);
  }
  
  // Handle legacy decimals parameter
  const decimals = typeof format === 'number' ? format : 2;

  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";

  if (forceDecimals) return num.toFixed(decimals);

  return num.toFixed(0);
};

/**
 * Format crypto token prices with intelligent decimal handling
 * Handles micro-cap tokens worth fractions of a cent
 * 
 * @param price - The price to format (string or number)
 * @param options - Formatting options
 * @returns Formatted price string
 */
export const formatTokenPrice = (price: string | number, options?: {
  showDollarSign?: boolean;
  forceDecimals?: number;
  compact?: boolean;
}) => {
  const num = Number(price);
  if (isNaN(num)) return "$0.00";
  
  const { showDollarSign = true, forceDecimals, compact = false } = options || {};
  const dollarSign = showDollarSign ? "$" : "";
  
  // For compact display of large prices
  if (compact && num >= 1) {
    if (num >= 1e6) return `${dollarSign}${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${dollarSign}${(num / 1e3).toFixed(2)}K`;
    return `${dollarSign}${num.toFixed(2)}`;
  }
  
  // Force specific decimal places if requested
  if (forceDecimals !== undefined) {
    return `${dollarSign}${num.toFixed(forceDecimals)}`;
  }
  
  // Intelligent decimal handling based on price magnitude
  if (num >= 1000) {
    return `${dollarSign}${num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  } else if (num >= 1) {
    return `${dollarSign}${num.toFixed(2)}`;
  } else if (num >= 0.01) {
    return `${dollarSign}${num.toFixed(4)}`;
  } else if (num >= 0.0001) {
    return `${dollarSign}${num.toFixed(6)}`;
  } else if (num >= 0.000001) {
    return `${dollarSign}${num.toFixed(8)}`;
  } else if (num > 0) {
    // For extremely small prices, use scientific notation or show significant digits
    const zeros = -Math.floor(Math.log10(num));
    if (zeros > 10) {
      // Scientific notation for ultra-micro prices
      return `${dollarSign}${num.toExponential(3)}`;
    } else {
      // Show up to 12 decimal places for micro prices
      const formatted = num.toFixed(Math.min(zeros + 3, 12));
      return `${dollarSign}${formatted}`;
    }
  } else {
    return `${dollarSign}0.00`;
  }
};

/**
 * Format percentage changes with color coding
 * @param change - The percentage change
 * @param includeSign - Whether to include + for positive changes
 * @returns Formatted percentage string
 */
export const formatPercentage = (change: string | number | undefined, includeSign = true) => {
  const num = Number(change || 0);
  if (isNaN(num)) return "0.00%";
  
  const sign = num >= 0 && includeSign ? "+" : "";
  
  // Always use 2 decimal places
  let decimals = 2;
  
  return `${sign}${num.toFixed(decimals)}%`;
};
