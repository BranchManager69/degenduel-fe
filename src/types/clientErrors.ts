// Client Error Types
export interface ClientError {
  id: number;
  error_id: string;
  message: string;
  name: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  tags?: string[];
  user_id?: string;
  user_wallet?: string;
  browser?: string;
  os?: string;
  device?: string;
  occurrence_count: number;
  first_occurrence: string;
  last_occurrence: string;
  status: 'open' | 'resolved';
  is_critical: boolean;
  context?: Record<string, any>;
}

export interface ClientErrorListResponse {
  errors: ClientError[];
  total: number;
  page: number;
  limit: number;
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