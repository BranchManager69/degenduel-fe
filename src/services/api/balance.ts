import { API_URL } from "../../config/config";

export const balance = {
  get: async (walletAddress: string): Promise<{ balance: string }> => {
    console.log("Fetching balance for wallet:", walletAddress);
    try {
      const url = `${API_URL}/users/${walletAddress}/balance`;
      console.log("Balance fetch URL:", url);

      const response = await fetch(url);
      console.log("Balance response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Balance fetch failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error("Failed to fetch user balance");
      }

      const data = await response.json();
      console.log("Balance fetch successful:", data);
      return data;
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
