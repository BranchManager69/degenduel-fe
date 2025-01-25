export interface UserData {
  wallet_address: string;
  nickname: string | null;
  rank_score: number;
  created_at: string;
  bonusBalance: string;
}

export interface UserStats {
  total_earnings: number;
  total_contests: number;
  total_wins: number;
  win_rate: number;
  average_return: number;
}

export interface Achievement {
  achievement: string;
  achieved_at: string;
  display_name: string;
}
