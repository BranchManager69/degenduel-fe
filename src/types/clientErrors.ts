// Client Error Types
export interface ClientError {
  id: number;
  error_id: string;
  message: string;
  name: string;
  level?: string;
  stack?: string;
  stack_trace?: string; // API uses stack_trace
  source?: string;
  source_url?: string; // API uses source_url
  lineno?: number;
  line_number?: number; // API uses line_number
  colno?: number;
  column_number?: number; // API uses column_number
  tags?: string[];
  user_id?: string;
  userWallet?: string;
  user_wallet?: string;
  browser?: string;
  browser_version?: string;
  os?: string;
  device?: string;
  occurrences?: number;
  occurrence_count?: number; // Legacy field
  created_at?: string;
  first_occurrence?: string; // Legacy field
  last_occurred_at?: string;
  last_occurrence?: string; // Legacy field
  status: 'open' | 'resolved';
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_note?: string | null;
  is_critical: boolean;
  context?: Record<string, any>;
  environment?: string;
  session_id?: string;
  ip_address?: string;
  user?: {
    id: number;
    username: string;
    nickname: string;
    wallet_address: string;
    role: string;
  };
}

export interface ClientErrorListResponse {
  success?: boolean;
  errors: ClientError[];
  total: number;
  count?: number; // API uses count
  page: number;
  limit: number;
  filters?: ClientErrorFilters;
}

export interface ClientErrorStats {
  total_errors: number;
  open_errors: number;
  resolved_errors: number;
  critical_errors: number;
  recent_errors: number; // Within last 24 hours
  most_frequent: ClientError[];
}

export interface ClientErrorFilters {
  status?: 'open' | 'resolved' | 'all';
  critical?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}