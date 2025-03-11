import { 
  Activity, 
  Contest, 
  IpBan, 
  IpBanCheckResponse, 
  IpBanCreateParams, 
  IpBanListResponse, 
  IpBanParams, 
  IpBanUpdateParams, 
  PlatformStats 
} from "../../types/index";
import { createApiClient } from "./utils";

export const admin = {
  getSystemSettings: async (): Promise<any> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/system-settings");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      throw error;
    }
  },
  
  updateSystemSettings: async (key: string, value: any): Promise<any> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/system-settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
      });
      return response.json();
    } catch (error) {
      console.error(`Failed to update system setting "${key}":`, error);
      throw error;
    }
  },
  
  getPlatformStats: async (): Promise<PlatformStats> => {
    try {
      const api = createApiClient();
      const response = await api.fetch("/admin/stats/platform");
      return response.json();
    } catch (error) {
      console.error("Failed to fetch platform stats:", error);
      throw error;
    }
  },

  getContests: async (): Promise<{ contests: Contest[] }> => {
    const api = createApiClient();
    const response = await api.fetch("/contests");
    return response.json();
  },

  getRecentActivities: async (): Promise<{ activities: Activity[] }> => {
    const api = createApiClient();
    const response = await api.fetch("/admin/activities");
    return response.json();
  },

  updateContest: async (
    contestId: string,
    data: Partial<Contest>
  ): Promise<Contest> => {
    try {
      const api = createApiClient();
      const response = await api.fetch(`/contests/${contestId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error("Contest update error:", {
        error,
        contestId,
        data,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  deleteContest: async (contestId: string): Promise<void> => {
    const api = createApiClient();
    await api.fetch(`/contests/${contestId}`, {
      method: "DELETE",
    });
  },

  adjustUserBalance: async (
    walletAddress: string,
    amount: number
  ): Promise<void> => {
    try {
      const api = createApiClient();
      await api.fetch(`/users/${walletAddress}/balance`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
    } catch (error) {
      console.error("Failed to adjust user balance:", error);
      throw error;
    }
  },

  getActivities: async (limit: number = 10, offset: number = 0) => {
    const api = createApiClient();
    const response = await api.fetch(
      `/admin/activities?limit=${limit}&offset=${offset}`
    );
    return response.json();
  },

  // IP Ban Management
  ipBan: {
    // List all banned IPs with pagination
    list: async (params: IpBanParams = {}): Promise<IpBanListResponse> => {
      try {
        const api = createApiClient();
        const queryParams = new URLSearchParams();

        // Add all parameters to query string
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', params.order);
        if (params.filter) queryParams.append('filter', params.filter);

        const url = `/admin/ip-bans${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch IP bans: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Failed to list IP bans:', error);
        throw error;
      }
    },
    
    // Get specific ban details
    get: async (id: string): Promise<IpBan> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch IP ban: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to get IP ban details for ID ${id}:`, error);
        throw error;
      }
    },
    
    // Add new IP ban
    add: async (data: IpBanCreateParams): Promise<IpBan> => {
      try {
        const api = createApiClient();
        const response = await api.fetch('/admin/ip-bans', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to add IP ban: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Failed to add IP ban:', error);
        throw error;
      }
    },
    
    // Update existing ban
    update: async (id: string, data: IpBanUpdateParams): Promise<IpBan> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update IP ban: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to update IP ban with ID ${id}:`, error);
        throw error;
      }
    },
    
    // Remove ban
    remove: async (id: string): Promise<{ success: boolean; message: string }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to remove IP ban: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to remove IP ban with ID ${id}:`, error);
        throw error;
      }
    },
    
    // Check if IP is banned (admin version with full details)
    check: async (ip: string): Promise<IpBanCheckResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/check?ip=${encodeURIComponent(ip)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to check IP ban status: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to check ban status for IP ${ip}:`, error);
        throw error;
      }
    }
  }
};
