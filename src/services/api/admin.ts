import { createApiClient } from "./utils";
import {
  Activity,
  Contest,
  IpBan,
  IpBanCheckResponse,
  IpBanCreateParams,
  IpBanListResponse,
  IpBanParams,
  IpBanUpdateParams,
  PlatformStats,
  VanityWallet,
  VanityWalletBatchCreateParams,
  VanityWalletBatchCreateResponse,
  VanityWalletCancelResponse,
  VanityWalletCreateParams,
  VanityWalletCreateResponse,
  VanityWalletListParams,
  VanityWalletListResponse,
} from "../../types/index";
import {
  ClientError,
  ClientErrorFilters,
  ClientErrorListResponse,
  ClientErrorStats,
} from "../../types/clientErrors";

// Art style interface for contest image generation
interface ArtStyle {
  id: string;
  description: string;
}

export const admin = {
  // Vanity Wallet Management
  vanityWallets: {
    // List all vanity wallets with filters
    list: async (params: VanityWalletListParams = {}): Promise<VanityWalletListResponse> => {
      try {
        const api = createApiClient();
        const queryParams = new URLSearchParams();
        
        // Add filter parameters to query string
        if (params.status) queryParams.append("status", params.status);
        if (params.isUsed !== undefined) queryParams.append("isUsed", params.isUsed.toString());
        if (params.pattern) queryParams.append("pattern", params.pattern);
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.offset) queryParams.append("offset", params.offset.toString());
        
        const url = `/admin/vanity-wallets${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await api.fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vanity wallets: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Failed to list vanity wallets:", error);
        throw error;
      }
    },
    
    // Get a specific vanity wallet by ID
    get: async (id: number): Promise<VanityWallet> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/vanity-wallets/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch vanity wallet: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to get vanity wallet details for ID ${id}:`, error);
        throw error;
      }
    },
    
    // Create a new vanity wallet request
    create: async (data: VanityWalletCreateParams): Promise<VanityWalletCreateResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/vanity-wallets", {
          method: "POST",
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create vanity wallet: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Failed to create vanity wallet:", error);
        throw error;
      }
    },
    
    // Cancel a vanity wallet job
    cancel: async (id: number): Promise<VanityWalletCancelResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/vanity-wallets/${id}/cancel`, {
          method: "POST",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to cancel vanity wallet job: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to cancel vanity wallet job with ID ${id}:`, error);
        throw error;
      }
    },
    
    // Create multiple vanity wallet requests (batch)
    batchCreate: async (data: VanityWalletBatchCreateParams): Promise<VanityWalletBatchCreateResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/vanity-wallets/batch", {
          method: "POST",
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create batch of vanity wallets: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Failed to create batch of vanity wallets:", error);
        throw error;
      }
    },
  },
  
  // Client Error Management
  clientErrors: {
    // List client errors with filtering
    list: async (filters: ClientErrorFilters = {}): Promise<ClientErrorListResponse> => {
      try {
        const api = createApiClient();
        const queryParams = new URLSearchParams();
        
        // Add all parameters to query string
        if (filters.page) queryParams.append("page", filters.page.toString());
        if (filters.limit) queryParams.append("limit", filters.limit.toString());
        if (filters.sort) queryParams.append("sort", filters.sort);
        if (filters.order) queryParams.append("order", filters.order);
        if (filters.status && filters.status !== 'all') queryParams.append("status", filters.status);
        if (filters.critical !== undefined) queryParams.append("critical", filters.critical.toString());
        if (filters.search) queryParams.append("search", filters.search);
        
        const url = `/admin/client-errors${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await api.fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch client errors: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Handle both API response formats
        return {
          errors: result.errors || [],
          total: result.count || result.total || 0,
          count: result.count || result.total || 0,
          page: result.page || filters.page || 1,
          limit: result.limit || filters.limit || 50,
          filters: result.filters || filters
        };
      } catch (error) {
        console.error("Failed to list client errors:", error);
        throw error;
      }
    },
    
    // Get error statistics
    getStats: async (): Promise<ClientErrorStats> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/client-errors/stats");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch error statistics: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Failed to get error statistics:", error);
        throw error;
      }
    },
    
    // Get details for a specific error
    get: async (id: number): Promise<ClientError> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/client-errors/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch error details: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to get error details for ID ${id}:`, error);
        throw error;
      }
    },
    
    // Mark an error as resolved
    resolve: async (id: number, note?: string): Promise<{success: boolean}> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/client-errors/${id}/resolve`, {
          method: "POST",
          body: note ? JSON.stringify({ note }) : undefined
        });
        
        if (!response.ok) {
          throw new Error(`Failed to resolve error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to resolve error with ID ${id}:`, error);
        throw error;
      }
    },
    
    // Mark error as critical or non-critical
    setCritical: async (id: number, isCritical: boolean): Promise<{success: boolean}> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/client-errors/${id}/critical`, {
          method: "POST",
          body: JSON.stringify({ critical: isCritical })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update critical status: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to update critical status for error ID ${id}:`, error);
        throw error;
      }
    },
    
    // Batch resolve multiple errors
    batchResolve: async (ids: number[], note?: string): Promise<{success: boolean, resolved_count: number}> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/client-errors/batch/resolve", {
          method: "POST",
          body: JSON.stringify({ ids, note })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to resolve errors in batch: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Failed to batch resolve errors:", error);
        throw error;
      }
    },
  },
  // Contest Image Management
  contestImages: {
    // Regenerate contest image
    regenerate: async (contestId: number, artStyle?: string, customPrompt?: string): Promise<{success: boolean, data: {contest_id: number, image_url: string}}> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/contest-management/regenerate-image/${contestId}`, {
          method: "POST",
          body: JSON.stringify({ artStyle, customPrompt }),
        });

        if (!response.ok) {
          throw new Error(`Failed to regenerate contest image: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to regenerate image for contest ID ${contestId}:`, error);
        throw error;
      }
    },

    // Get available art styles
    getArtStyles: async (): Promise<{styles: ArtStyle[]}> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-management/art-styles");

        if (!response.ok) {
          throw new Error(`Failed to fetch art styles: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to fetch art styles:", error);
        throw error;
      }
    },
  },
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
    data: Partial<Contest>,
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
    amount: number,
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
      `/admin/activities?limit=${limit}&offset=${offset}`,
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
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.order) queryParams.append("order", params.order);
        if (params.filter) queryParams.append("filter", params.filter);

        const url = `/admin/ip-bans${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await api.fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch IP bans: ${response.status} ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to list IP bans:", error);
        throw error;
      }
    },

    // Get specific ban details
    get: async (id: string): Promise<IpBan> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch IP ban: ${response.status} ${response.statusText}`,
          );
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
        const response = await api.fetch("/admin/ip-bans", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to add IP ban: ${response.status} ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to add IP ban:", error);
        throw error;
      }
    },

    // Update existing ban
    update: async (id: string, data: IpBanUpdateParams): Promise<IpBan> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update IP ban: ${response.status} ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to update IP ban with ID ${id}:`, error);
        throw error;
      }
    },

    // Remove ban
    remove: async (
      id: string,
    ): Promise<{ success: boolean; message: string }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/ip-bans/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to remove IP ban: ${response.status} ${response.statusText}`,
          );
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
        const response = await api.fetch(
          `/admin/ip-bans/check?ip=${encodeURIComponent(ip)}`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to check IP ban status: ${response.status} ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to check ban status for IP ${ip}:`, error);
        throw error;
      }
    },
  },
};
