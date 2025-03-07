import { API_URL } from "../config/config";
import {
  DbReportResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  ServiceReportResponse,
  SystemReportFilters,
  SystemReportListResponse,
} from "../types/systemReports";

class SystemReportsService {
  private apiClient = {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Debug": "true",
        Origin: window.location.origin,
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        console.error(`[System Reports API Error]:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        throw new Error("System Reports API request failed");
      }

      return response;
    },
  };

  async getReports(
    filters: SystemReportFilters = {}
  ): Promise<SystemReportListResponse> {
    const queryParams = new URLSearchParams();

    if (filters.type && filters.type !== "all") {
      queryParams.append("type", filters.type);
    }

    if (filters.date) {
      queryParams.append("date", filters.date);
    }

    if (filters.limit) {
      queryParams.append("limit", filters.limit.toString());
    }

    if (filters.withAiOnly !== undefined) {
      queryParams.append("withAiOnly", filters.withAiOnly.toString());
    }

    const response = await this.apiClient.fetch(
      `/admin/system-reports?${queryParams.toString()}`
    );

    return response.json();
  }

  async getServiceReport(reportId: string): Promise<ServiceReportResponse> {
    const response = await this.apiClient.fetch(
      `/admin/system-reports/${reportId}/service`
    );

    return response.json();
  }

  async getDbReport(reportId: string): Promise<DbReportResponse> {
    const response = await this.apiClient.fetch(
      `/admin/system-reports/${reportId}/db`
    );

    return response.json();
  }
  
  async getPrismaReport(reportId: string): Promise<DbReportResponse> {
    const response = await this.apiClient.fetch(
      `/admin/system-reports/${reportId}/prisma`
    );

    return response.json();
  }

  async generateReport(
    options: GenerateReportRequest = { withAi: false, reportType: "service" }
  ): Promise<GenerateReportResponse> {
    const response = await this.apiClient.fetch(
      `/admin/system-reports/generate`,
      {
        method: "POST",
        body: JSON.stringify(options),
      }
    );

    return response.json();
  }
}

export const systemReportsService = new SystemReportsService();
