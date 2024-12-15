
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