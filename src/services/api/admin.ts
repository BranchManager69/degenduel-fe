import {
  ClientError,
  ClientErrorFilters,
  ClientErrorListResponse,
  ClientErrorStats,
} from "../../types/clientErrors";
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
import { createApiClient } from "./utils";

// Art style interface for contest image generation
interface ArtStyle {
  id: string;
  description: string;
}

// Contest Scheduler Interfaces
interface ContestSchedulerStatus {
  isRunning: boolean;
  stats: {
    contests: {
      created: number;
      createdDuringMaintenance: number;
      createdFromDatabaseSchedules: number;
    };
  };
  config: {
    contests: {
      schedules: any[];
    };
  };
  health: {
    status: string;
    circuitBreaker: {
      isOpen: boolean;
      failureCount: number;
    };
  };
  maintenance: {
    systemInMaintenanceMode: boolean;
  };
}

interface ContestSchedulerControlResponse {
  success: boolean;
  message: string;
  status: {
    isRunning: boolean;
    health: {
      status: string;
      circuitBreaker: {
        isOpen: boolean;
        failureCount: number;
      };
    };
  };
}

interface ContestSchedulerConfig {
  contests: {
    schedules: any[];
  };
}

interface ContestSchedule {
  id: number;
  name: string;
  template_id: number;
  hour: number;
  minute: number;
  days: number[];
  duration_hours: number;
  enabled: boolean;
  entry_fee_override?: string;
  advance_notice_hours?: number;
  allow_multiple_hours?: boolean;
  template?: {
    id: number;
    name: string;
    description: string;
  };
  contests?: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  }[];
}

interface ContestTemplate {
  id: number;
  name: string;
  description: string;
  entry_fee: string;
  min_participants: number;
  max_participants: number;
}

interface CreateContestResponse {
  success: boolean;
  message: string;
  data: {
    contest: {
      id: number;
      name: string;
      contest_code: string;
      start_time: string;
      end_time: string;
      entry_fee: string;
      status: string;
    };
    wallet?: {
      address: string;
    };
    schedule?: {
      id: number;
      name: string;
    };
  };
}

export const admin = {
  // Token Liquidation Simulation API
  tokenLiquidation: {
    // Get token information for simulation
    getTokenInfo: async (tokenAddress: string): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/token-liquidation/token-info/${tokenAddress}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch token info: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get token info:", error);
        throw error;
      }
    },

    // Run a single simulation
    simulate: async (params: {
      totalSupply: number;
      currentPrice: number;
      baseReserve: number;
      quoteReserve: number;
      acquisitionLevel: string;
      personalRatio: number;
      days: number;
      scenarioType: string;
    }): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/token-liquidation/simulate", {
          method: "POST",
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`Failed to run simulation: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to run simulation:", error);
        throw error;
      }
    },

    // Run a grid simulation with multiple parameters
    simulateGrid: async (params: {
      totalSupply: number;
      currentPrice: number;
      baseReserve: number;
      quoteReserve: number;
      acquisitionLevels: string[];
      scenarios: string[];
    }): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/token-liquidation/simulation-grid", {
          method: "POST",
          body: JSON.stringify(params)
        });

        if (!response.ok) {
          throw new Error(`Failed to run grid simulation: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to run grid simulation:", error);
        throw error;
      }
    },

    // Save simulation results
    saveSimulation: async (data: {
      tokenInfo: any;
      params: any;
      results: any;
      name: string;
      description?: string;
      tags?: string[];
    }): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/token-liquidation/save", {
          method: "POST",
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`Failed to save simulation: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to save simulation:", error);
        throw error;
      }
    },

    // Get saved simulations list
    getSavedSimulations: async (filters?: {
      tokenAddress?: string;
      tags?: string[];
      page?: number;
      limit?: number;
    }): Promise<any> => {
      try {
        const api = createApiClient();

        // Build query params
        const queryParams = new URLSearchParams();
        if (filters) {
          if (filters.tokenAddress) queryParams.append('tokenAddress', filters.tokenAddress);
          if (filters.tags && filters.tags.length) queryParams.append('tags', filters.tags.join(','));
          if (filters.page) queryParams.append('page', filters.page.toString());
          if (filters.limit) queryParams.append('limit', filters.limit.toString());
        }

        const url = `/admin/token-liquidation/saved${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch saved simulations: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to fetch saved simulations:", error);
        throw error;
      }
    },

    // Get a specific saved simulation by ID
    getSavedSimulation: async (id: string): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/token-liquidation/saved/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch saved simulation: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to fetch saved simulation with ID ${id}:`, error);
        throw error;
      }
    },

    // Delete a saved simulation
    deleteSavedSimulation: async (id: string): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/token-liquidation/saved/${id}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error(`Failed to delete saved simulation: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to delete saved simulation with ID ${id}:`, error);
        throw error;
      }
    },

    // Generate PDF report for a simulation
    generateReport: async (data: {
      simulationId?: string;
      simulationData?: any;
      reportType: 'detailed' | 'summary' | 'comparative';
      title?: string;
      includeCharts?: boolean;
    }): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/token-liquidation/report", {
          method: "POST",
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to generate report:", error);
        throw error;
      }
    }
  },

  // Contest Scheduler API
  contestScheduler: {
    // Get the current status of the contest scheduler service
    getStatus: async (): Promise<{ success: boolean; data: ContestSchedulerStatus }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/status");

        if (!response.ok) {
          throw new Error(`Failed to fetch contest scheduler status: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get contest scheduler status:", error);
        throw error;
      }
    },

    // Control the contest scheduler service state (start, stop, restart, status)
    control: async (action: 'start' | 'stop' | 'restart' | 'status'): Promise<ContestSchedulerControlResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/contest-scheduler/control/${action}`, {
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Failed to control contest scheduler: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to ${action} contest scheduler:`, error);
        throw error;
      }
    },

    // Get the raw configuration from the config file
    getConfigFile: async (): Promise<{ success: boolean; data: { configFile: ContestSchedulerConfig } }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/config-file");

        if (!response.ok) {
          throw new Error(`Failed to fetch contest scheduler config file: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get contest scheduler config file:", error);
        throw error;
      }
    },

    // Update the contest scheduler configuration
    updateConfig: async (configuration: ContestSchedulerConfig): Promise<{ success: boolean; message: string; data: { config: ContestSchedulerConfig } }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/config", {
          method: "PUT",
          body: JSON.stringify({ configuration })
        });

        if (!response.ok) {
          throw new Error(`Failed to update contest scheduler config: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to update contest scheduler config:", error);
        throw error;
      }
    },

    // Create a contest immediately based on a named schedule from config
    createContestFromConfig: async (scheduleName: string): Promise<CreateContestResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/create-contest", {
          method: "POST",
          body: JSON.stringify({ scheduleName })
        });

        if (!response.ok) {
          throw new Error(`Failed to create contest from config: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to create contest from config:", error);
        throw error;
      }
    },

    // Get all schedules from the database
    getAllDbSchedules: async (): Promise<{ success: boolean; data: ContestSchedule[] }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/db-schedules");

        if (!response.ok) {
          throw new Error(`Failed to fetch database schedules: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get database schedules:", error);
        throw error;
      }
    },

    // Get a single schedule by ID
    getDbScheduleById: async (id: number): Promise<{ success: boolean; data: ContestSchedule }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/contest-scheduler/db-schedules/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch database schedule: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to get database schedule with ID ${id}:`, error);
        throw error;
      }
    },

    // Create a new schedule in the database
    createDbSchedule: async (schedule: Omit<ContestSchedule, 'id'>): Promise<{ success: boolean; message: string; data: ContestSchedule }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/db-schedules", {
          method: "POST",
          body: JSON.stringify(schedule)
        });

        if (!response.ok) {
          throw new Error(`Failed to create database schedule: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to create database schedule:", error);
        throw error;
      }
    },

    // Update an existing schedule in the database
    updateDbSchedule: async (id: number, schedule: Partial<ContestSchedule>): Promise<{ success: boolean; message: string; data: ContestSchedule }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/contest-scheduler/db-schedules/${id}`, {
          method: "PUT",
          body: JSON.stringify(schedule)
        });

        if (!response.ok) {
          throw new Error(`Failed to update database schedule: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to update database schedule with ID ${id}:`, error);
        throw error;
      }
    },

    // Delete a schedule from the database
    deleteDbSchedule: async (id: number): Promise<{ success: boolean; message: string }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch(`/admin/contest-scheduler/db-schedules/${id}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error(`Failed to delete database schedule: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to delete database schedule with ID ${id}:`, error);
        throw error;
      }
    },

    // Get all available contest templates
    getTemplates: async (): Promise<{ success: boolean; data: ContestTemplate[] }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/templates");

        if (!response.ok) {
          throw new Error(`Failed to fetch contest templates: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get contest templates:", error);
        throw error;
      }
    },

    // Create a contest immediately based on a database schedule
    createContestFromDb: async (scheduleId: number): Promise<CreateContestResponse> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/create-db-contest", {
          method: "POST",
          body: JSON.stringify({ scheduleId })
        });

        if (!response.ok) {
          throw new Error(`Failed to create contest from database: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to create contest from database:", error);
        throw error;
      }
    },

    // Migrate configuration-based schedules to the database
    migrateConfig: async (): Promise<{ success: boolean; message: string; data: { schedules: ContestSchedule[] } }> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/contest-scheduler/migrate-config", {
          method: "POST"
        });

        if (!response.ok) {
          throw new Error(`Failed to migrate config schedules: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to migrate config schedules:", error);
        throw error;
      }
    }
  },

  // Vanity Wallet Management
  vanityWallets: {
    // Get comprehensive dashboard analytics (based on API guide)
    getDashboard: async (): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/vanity-dashboard");

        if (!response.ok) {
          throw new Error(`Failed to fetch vanity dashboard: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get vanity dashboard:", error);
        throw error;
      }
    },

    // Get generator status with enhanced metrics
    getGeneratorStatus: async (): Promise<any> => {
      try {
        const api = createApiClient();
        const response = await api.fetch("/admin/vanity-wallets/status/generator");

        if (!response.ok) {
          throw new Error(`Failed to fetch generator status: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Failed to get generator status:", error);
        throw error;
      }
    },

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

    // Get pool statistics
    pool: {
      // Get overall pool statistics
      getStats: async (): Promise<any> => {
        try {
          const api = createApiClient();
          const response = await api.fetch("/admin/vanity-wallets/pool/stats");

          if (!response.ok) {
            throw new Error(`Failed to fetch pool stats: ${response.status} ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          console.error("Failed to get vanity wallet pool stats:", error);
          throw error;
        }
      },

      // Get pool alerts (low stock, etc.)
      getAlerts: async (): Promise<any> => {
        try {
          const api = createApiClient();
          const response = await api.fetch("/admin/vanity-wallets/pool/alerts");

          if (!response.ok) {
            throw new Error(`Failed to fetch pool alerts: ${response.status} ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          console.error("Failed to get vanity wallet pool alerts:", error);
          throw error;
        }
      },

      // Get pool patterns distribution
      getPatterns: async (): Promise<any> => {
        try {
          const api = createApiClient();
          const response = await api.fetch("/admin/vanity-wallets/pool/patterns");

          if (!response.ok) {
            throw new Error(`Failed to fetch pool patterns: ${response.status} ${response.statusText}`);
          }

          return await response.json();
        } catch (error) {
          console.error("Failed to get vanity wallet pool patterns:", error);
          throw error;
        }
      }
    }
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
    resolve: async (id: number, note?: string): Promise<{ success: boolean }> => {
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
    setCritical: async (id: number, isCritical: boolean): Promise<{ success: boolean }> => {
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
    batchResolve: async (ids: number[], note?: string): Promise<{ success: boolean, resolved_count: number }> => {
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
    regenerate: async (contestId: number, artStyle?: string, customPrompt?: string): Promise<{ success: boolean, data: { contest_id: number, image_url: string } }> => {
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
    getArtStyles: async (): Promise<{ styles: ArtStyle[] }> => {
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