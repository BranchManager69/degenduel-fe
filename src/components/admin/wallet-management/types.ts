export interface Wallet {
  id: string;
  name: string;
  address: string;
  tokenBalance: string;
  solBalance: string;
  tokenValue: string;
  selected: boolean;
  transactionStatus?: 'pending' | 'confirmed' | 'failed';
}

export interface Transaction {
  type: 'BUY' | 'SELL';
  amount: string;
  walletName: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  id: string;
}

export type TransactionMode = 'equal' | 'proportional' | 'random';

export interface TransactionDistribution {
  walletId: string;
  amount: string;
}

export interface WalletWithHistory extends Wallet {
  transactions?: Transaction[];
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  marketCap: {
    sol: number;
    usd: number;
  };
  tokenPrice: {
    sol: number;
    usd: number;
  };
  solPrice: number;
  portfolioValue: {
    sol: number;
    usd: number;
  };
  totalTokens: number;
  totalSol: number;
}