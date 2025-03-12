import { API_URL } from "../config/config";
import { AdminActivity, AdminActivityFilters } from "../types/admin";

interface AdminActivitiesResponse {
  activities: AdminActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface BalanceAdjustmentResponse {
  previous_balance: string;
  new_balance: string;
}

class AdminService {
  private apiClient = {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Debug": "true",
        Origin: window.location.origin,
      });

      console.log("[Admin API Debug] Request Details:", {
        url: `${API_URL}${endpoint}`,
        method: options.method || "GET",
        headers: Object.fromEntries([...headers]),
        cookies: document.cookie,
        parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.split("=").map((c) => c.trim());
          return { ...acc, [key]: value };
        }, {}),
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        mode: "cors",
      });

      console.log("[Admin API Debug] Response Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        url: response.url,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        console.error(`[Admin API Error]:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers]),
          url: response.url,
          cookies: document.cookie,
          parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.split("=").map((c) => c.trim());
            return { ...acc, [key]: value };
          }, {}),
        });
        throw new Error("Admin API request failed");
      }

      return response;
    },
  };

  async getActivities(
    filters: AdminActivityFilters,
  ): Promise<AdminActivitiesResponse> {
    const queryParams = new URLSearchParams();
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());
    if (filters.action) queryParams.append("action", filters.action);

    const response = await this.apiClient.fetch(
      `/admin/activities?${queryParams.toString()}`,
    );

    return response.json();
  }

  async adjustUserBalance(
    wallet_address: string,
    amount: number,
  ): Promise<BalanceAdjustmentResponse> {
    const response = await this.apiClient.fetch(
      `/admin/balance/${wallet_address}/adjust`,
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      },
    );

    return response.json();
  }
}

export const adminService = new AdminService();
