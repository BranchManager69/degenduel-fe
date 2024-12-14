export interface Contest {
  id: string;
  name: string;
  difficulty: 'dolphin' | 'shark' | 'whale';
  entryFee: number;
  prizePool: number;
  startTime: string;
  endTime: string;
  participants: number;
  maxParticipants: number;
  status: 'open' | 'in_progress' | 'completed';
}
