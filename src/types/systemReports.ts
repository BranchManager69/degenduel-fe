export interface SystemReport {
  id: string;
  type: "service" | "db" | "prisma";
  timestamp: string;
  date: string;
  time: string;
  path: string;
  files: string[];
  hasAiAnalysis: boolean;
  sortTimestamp: number;
}

export interface SystemReportListResponse {
  success: boolean;
  reports: SystemReport[];
}

export interface ServiceReportContent {
  report: {
    generated_at: string;
    total_services: number;
    services: Record<string, any>;
    service_health: {
      healthy: number;
      degraded: number;
      error: number;
      unknown: number;
    };
  };
  markdown: string;
}

export interface DbReportContent {
  report: string;
  aiAnalysis?: string;
}

export interface ServiceReportResponse {
  success: boolean;
  report: {
    metadata: SystemReport;
    content: ServiceReportContent;
  };
}

export interface DbReportResponse {
  success: boolean;
  report: {
    metadata: SystemReport;
    content: DbReportContent;
  };
}

export interface GenerateReportRequest {
  withAi: boolean;
  reportType?: "service" | "db" | "prisma";
}

export interface GenerateReportResponse {
  success: boolean;
  message: string;
  report: SystemReport;
  output: string;
}

export interface SystemReportFilters {
  type?: "service" | "db" | "prisma" | "all";
  date?: string;
  limit?: number;
  withAiOnly?: boolean;
}
