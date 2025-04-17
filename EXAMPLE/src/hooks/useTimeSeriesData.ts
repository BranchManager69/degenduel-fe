import { useState, useEffect } from 'react';
import type { TimeSeriesDataPoint, WalletWithHistory } from '../types';
import { TOKEN_PRICE, SOL_TO_USD, calculateMarketCap } from '../config';

const MINUTE = 60 * 1000;

export function useTimeSeriesData(wallets: WalletWithHistory[]) {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);

  // Calculate current values for time series data
  const calculateDataPoint = (): TimeSeriesDataPoint => {
    const marketCap = calculateMarketCap();
    const totalTokens = wallets.reduce((sum, w) => sum + parseFloat(w.tokenBalance), 0);
    const totalSol = wallets.reduce((sum, w) => sum + parseFloat(w.solBalance), 0);
    const tokenValueInSol = totalTokens * TOKEN_PRICE;
    const totalValueInSol = tokenValueInSol + totalSol;
    
    return {
      timestamp: Date.now(),
      marketCap: {
        sol: parseFloat(marketCap.sol),
        usd: parseFloat(marketCap.usd)
      },
      tokenPrice: {
        sol: TOKEN_PRICE,
        usd: TOKEN_PRICE * SOL_TO_USD
      },
      solPrice: SOL_TO_USD,
      portfolioValue: {
        sol: totalValueInSol,
        usd: totalValueInSol * SOL_TO_USD
      },
      totalTokens,
      totalSol
    };
  };

  // Initialize with current values
  useEffect(() => {
    const initialDataPoint = calculateDataPoint();
    setTimeSeriesData([initialDataPoint]);
  }, []);

  // Update values every minute and after transactions
  useEffect(() => {
    const updateData = () => {
      const newDataPoint = calculateDataPoint();
      setTimeSeriesData(prev => [...prev, newDataPoint]);
    };

    const interval = setInterval(updateData, MINUTE);
    return () => clearInterval(interval);
  }, [wallets]);

  return timeSeriesData;
}