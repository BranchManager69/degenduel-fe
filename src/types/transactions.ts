// src/types/transactions.ts

export interface TransactionInfo {
  signature: string;
  solscan_url: string;
  amount?: string;
}

export interface PortfolioTransactions {
  entry: TransactionInfo | null;
  prize: TransactionInfo | null;
  refund: TransactionInfo | null;
}