// types/index.ts
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
    maxParticipants: number;
  };
  created_at: string;
  participant_count: number;
  is_participating: boolean;
}

// Keep the rest of the admin types unchanged
export interface PlatformStats {
  totalUsers: number;
  activeContests: number;
  totalVolume: number;
  dailyActiveUsers: number;
  userGrowth: number;
  volumeGrowth: number;
}

export interface Activity {
  id: string;
  type: 'contest_join' | 'contest_complete' | 'user_register';
  timestamp: string;
  details: string;
}