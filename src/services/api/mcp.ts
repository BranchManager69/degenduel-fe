import { createApiClient, logError } from "./utils";
import { getFeatureFlag } from "../../config/featureFlags";

export interface MCPTokenResponse {
  success: boolean;
  mcp_token?: string;
  expires_in?: string;
  instructions?: string;
  setup_guide?: {
    claude_desktop: {
      config_location: string;
      config_example: any;
    };
  };
  message?: string;
  error?: string;
}

export const mcp = {
  // Get existing token or create new one
  getToken: async (): Promise<MCPTokenResponse> => {
    if (!getFeatureFlag('enableMCP')) {
      return {
        success: false,
        error: "MCP functionality is currently disabled. Coming soon!",
        message: "MCP is in final development and will be available soon."
      };
    }
    
    try {
      const api = createApiClient();
      const response = await api.fetch("/user/mcp-token");
      return response.json();
    } catch (error: any) {
      logError("mcp.getToken", error);
      throw error;
    }
  },

  // Generate new token (revokes old one)
  regenerateToken: async (): Promise<MCPTokenResponse> => {
    if (!getFeatureFlag('enableMCP')) {
      return {
        success: false,
        error: "MCP functionality is currently disabled. Coming soon!",
        message: "MCP is in final development and will be available soon."
      };
    }
    
    try {
      const api = createApiClient();
      const response = await api.fetch("/user/mcp-token/regenerate", {
        method: "POST",
      });
      return response.json();
    } catch (error: any) {
      logError("mcp.regenerateToken", error);
      throw error;
    }
  },

  // Revoke existing token
  revokeToken: async (): Promise<MCPTokenResponse> => {
    if (!getFeatureFlag('enableMCP')) {
      return {
        success: false,
        error: "MCP functionality is currently disabled. Coming soon!",
        message: "MCP is in final development and will be available soon."
      };
    }
    
    try {
      const api = createApiClient();
      const response = await api.fetch("/user/mcp-token", {
        method: "DELETE",
      });
      return response.json();
    } catch (error: any) {
      logError("mcp.revokeToken", error);
      throw error;
    }
  },
};