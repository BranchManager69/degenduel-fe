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
  address: string;
  username: string;
  avatar_url?: string; // Changed to snake_case
  total_winnings: number; // Changed to snake_case
  contests_won: number; // Changed to snake_case
  contests_played: number; // Changed to snake_case
  is_admin?: boolean; // Changed to snake_case
}

export interface Portfolio {
  tokens: {
    symbol: string;
    amount: number;
  }[];
  total_value: number; // Changed to snake_case
  performance_24h: number; // Changed to snake_case
}