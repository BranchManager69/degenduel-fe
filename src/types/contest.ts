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
    max_participants: number;
    min_trades: number;
  };
  participant_count: number;
  is_participating: boolean;
}