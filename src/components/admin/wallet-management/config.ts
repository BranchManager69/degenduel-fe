export const TOKEN_TICKER = 'DUEL';

// Total supply of DUEL tokens
export const TOTAL_SUPPLY = 1_000_000_000;

// Target market cap of $2,000,000
// With SOL at $100.25, that's 19,950.12 SOL
// Price per token = 19,950.12 SOL / 1,000,000,000 tokens
export const TOKEN_PRICE = 0.00001995;
// Exchange rate: 1 SOL = $100.25 USD
export const SOL_TO_USD = 100.25;

const formatNumber = (num: number, decimals = 2, forceDecimals = false): string => {
  // For whole numbers, don't show decimals unless forced
  const actualDecimals = (!forceDecimals && Number.isInteger(num)) ? 0 : decimals;
  
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toLocaleString('en-US', {
      minimumFractionDigits: actualDecimals,
      maximumFractionDigits: actualDecimals
    })}B`;
  }
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: actualDecimals,
      maximumFractionDigits: actualDecimals
    })}M`;
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: actualDecimals,
    maximumFractionDigits: actualDecimals
  });
};

export const calculateMarketCap = (): { sol: string; usd: string } => {
  const marketCapInSol = TOTAL_SUPPLY * TOKEN_PRICE;
  const marketCapInUsd = marketCapInSol * SOL_TO_USD;

  return {
    sol: formatNumber(marketCapInSol),
    usd: formatNumber(marketCapInUsd)
  };
};

export const calculateTokenValue = (tokenBalance: string): string => {
  return (parseFloat(tokenBalance) * TOKEN_PRICE).toFixed(4);
};

export const calculateUsdValue = (solAmount: string): string => {
  return (parseFloat(solAmount) * SOL_TO_USD).toFixed(2);
};

export const calculateSolCost = (tokenAmount: string): string => {
  return (parseFloat(tokenAmount) * TOKEN_PRICE).toFixed(4);
};

export const formatUsd = (amount: string) => {
  const num = parseFloat(amount);
  return `$${formatNumber(num, 2, true)}`;
};

export const formatToken = (amount: string) => `${amount} ${TOKEN_TICKER}`;

export const formatSol = (amount: string) => {
  const num = parseFloat(amount);
  return `${formatNumber(num, 2, true)} SOL`;
};