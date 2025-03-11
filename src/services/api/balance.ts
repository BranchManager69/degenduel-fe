import { NODE_ENV } from "../../config/config";
import { createApiClient } from "./utils";

export const balance = {
  get: async (walletAddress: string): Promise<{ balance: string }> => {
    if (NODE_ENV === "development") {
      console.log("Fetching balance for wallet:", walletAddress);
    }
    
    try {
      const api = createApiClient();
      const response = await api.fetch(`/users/${walletAddress}`);
      const data = await response.json();
      
      if (NODE_ENV === "development") {
        console.log("User data:", data);
      }
      
      return { balance: data.balance || "0" };
    } catch (error) {
      console.error("Failed to fetch user balance:", {
        error,
        walletAddress,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },
};
