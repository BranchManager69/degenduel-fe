// src/types/wallet-analysis.ts

export interface WalletAnalysisToken {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  rawAmount: string;
  decimals: number;
  account?: string;
  tokenAccount?: string;
  price: number | null;
  value: number;
  realizableValue: number;
  priceSource: "helius" | "dexscreener" | "coingecko";
  supplyPercentage: number | null;
  totalSupply: number | null;
  marketCap: number | null;
  liquidityCoverage: number | null;
  realQuoteLiquidity: number | null;
  priceImpact: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isSOL?: boolean;
}

export interface WalletPortfolio {
  totalValue: number;
  totalRealizableValue: number;
  deploymentRatio: number;
  deployedValue: number;
  solValue: number;
  weightedAvgMarketCap: number;
  weightedAvgLiquidity: number;
}

export interface WalletSummary {
  totalAccounts: number;
  tokensShown: number;
  scamFiltered: number;
  lowValueFiltered: number;
  solBalance: {
    sol: number;
    lamports: string;
  };
}

export interface WalletMetadata {
  timestamp: string;
  walletAddress: string;
  solPrice: number;
  processing_time_ms: number;
  api_version: string;
}

export interface WalletAnalysisResponse {
  tokens: WalletAnalysisToken[];
  portfolio: WalletPortfolio;
  summary: WalletSummary;
  metadata: WalletMetadata;
}

export interface WalletAnalysisError {
  error: string;
  message: string;
}