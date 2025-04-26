export interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
