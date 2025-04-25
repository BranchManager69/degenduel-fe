export interface Contest {
  id: number;
  contest_code: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  entry_fee: string;
  prize_pool: string;
  status: string;
  settings: Record<string, any>;
  created_at: string;
  current_prize_pool: string;
  allowed_buckets: number[];
  participant_count: number;
  last_entry_time: string | null;
  min_participants: number;
  max_participants: number;
  entry_deadline: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  updated_at: string | null;
  _count: {
    contest_participants: number;
  };
  is_participating: boolean;
}

export interface ResponseDisplayProps {
  response: any;
  error?: any;
}

export interface JsonInputProps {
  value: any;
  onChange: (val: any) => void;
  placeholder: string;
}

export interface WalletInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

export interface ContestSelectProps {
  value: number | "";
  onChange: (id: number | "") => void;
  className?: string;
}
