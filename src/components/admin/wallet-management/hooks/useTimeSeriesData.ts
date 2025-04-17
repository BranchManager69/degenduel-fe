import { useState, useEffect, useRef } from 'react';
import { WalletWithHistory, TimeSeriesDataPoint } from '../types';
import { SOL_TO_USD, TOKEN_PRICE, TOTAL_SUPPLY } from '../config';

export function useTimeSeriesData(wallets: WalletWithHistory[]): TimeSeriesDataPoint[] {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial calculation
    calculateDataPoint();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(calculateDataPoint, 60000); // Every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Make sure we update the data point when wallet data changes
  useEffect(() => {
    calculateDataPoint();
  }, [wallets]);

  const calculateDataPoint = () => {
    const totalTokens = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenBalance), 0);
    const totalSol = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.solBalance), 0);
    const totalTokenValue = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.tokenValue), 0);
    
    const tokenPriceSol = TOKEN_PRICE;
    const tokenPriceUsd = tokenPriceSol * SOL_TO_USD;
    
    const marketCapSol = TOTAL_SUPPLY * tokenPriceSol;
    const marketCapUsd = marketCapSol * SOL_TO_USD;
    
    const portfolioValueSol = totalTokenValue + totalSol;
    const portfolioValueUsd = portfolioValueSol * SOL_TO_USD;
    
    const newDataPoint: TimeSeriesDataPoint = {
      timestamp: Date.now(),
      marketCap: {
        sol: marketCapSol,
        usd: marketCapUsd
      },
      tokenPrice: {
        sol: tokenPriceSol,
        usd: tokenPriceUsd
      },
      solPrice: SOL_TO_USD,
      portfolioValue: {
        sol: portfolioValueSol,
        usd: portfolioValueUsd
      },
      totalTokens,
      totalSol
    };
    
    setTimeSeriesData(prevData => [...prevData, newDataPoint].slice(-100)); // Keep last 100 data points
  };

  return timeSeriesData;
}