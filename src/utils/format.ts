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
