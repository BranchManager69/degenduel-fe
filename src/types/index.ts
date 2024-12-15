// src/types/index.ts

interface ContestSettings {
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
  min_trades: number;
  max_participants: number;
  rules: string[];
  token_types?: string[];
}

export interface Contest {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  status: 'pending' | 'active' | 'in_progress' | 'in-progress' | 'completed';
  settings: ContestSettings;
  created_at: string;
  participant_count: string;
  is_participating: boolean;
  participants: Array<{
    address: string;
    username?: string;
    score?: number;
  }>;
}

// src/types/index.ts
export interface Token {
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  change_24h: number;
  volume_24h: number;
}

export interface User {
  wallet_address: string;
  nickname: string;
  created_at: string;
  last_login: string | null;
  total_contests: number;
  total_wins: number;
  total_earnings: number;
  rank_score: number;
  settings: Record<string, any>;
  is_admin?: boolean;
}

export interface Portfolio {
  tokens: {
    symbol: string;
    amount: number;
  }[];
  total_value: number; // Changed to snake_case
  performance_24h: number; // Changed to snake_case
}

export type WalletError = {
  code: 'WALLET_NOT_FOUND' | 'CONNECTION_FAILED' | 'USER_REJECTED' | 'API_ERROR' | 'UNAUTHORIZED';
  message: string;
}

