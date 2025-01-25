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
  async getActivities(
    filters: AdminActivityFilters
  ): Promise<AdminActivitiesResponse> {
    const queryParams = new URLSearchParams();
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());
    if (filters.action) queryParams.append("action", filters.action);

    const response = await fetch(
      `${API_URL}/admin/activities?${queryParams.toString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch admin activities");
    }

    return response.json();
  }

  async adjustUserBalance(
    wallet_address: string,
    amount: number
  ): Promise<BalanceAdjustmentResponse> {
    const response = await fetch(
      `${API_URL}/balance/${wallet_address}/balance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to adjust balance");
    }

    return response.json();
  }
}

export const adminService = new AdminService();
