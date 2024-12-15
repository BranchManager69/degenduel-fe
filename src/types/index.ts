// src/types/index.ts
export interface Contest {
  id: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  status: 'pending' | 'in_progress' | 'completed';
  settings: {
    difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
    min_trades: number;
    max_participants: number;
  };
  participant_count: number;
  is_participating: boolean;
  created_at: string;
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