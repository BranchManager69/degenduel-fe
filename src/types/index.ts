export interface Contest {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  startTime: Date;
  endTime: Date;
  participants: number;
  maxParticipants: number;
  status: 'open' | 'in_progress' | 'completed';
  difficulty: 'guppy' | 'tadpole' | 'squid' | 'dolphin' | 'shark' | 'whale';
}

export interface Token {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  change24h: number;
  volume24h: number;
}

export interface User {
  address: string;
  username: string;
  avatarUrl?: string;
  totalWinnings: number;
  contestsWon: number;
  contestsPlayed: number;
  isAdmin?: boolean;
}

export interface Portfolio {
  tokens: {
    symbol: string;
    amount: number;
  }[];
  totalValue: number;
  performance24h: number;
}