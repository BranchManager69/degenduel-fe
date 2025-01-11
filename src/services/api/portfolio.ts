import { API_URL } from "../../config/config";
import { useStore } from "../../store/useStore";
import { PortfolioResponse } from "../../types";

export const portfolio = {
  get: async (contestId: number): Promise<PortfolioResponse> => {
    const user = useStore.getState().user;

    if (!user?.wallet_address) {
      throw new Error("Wallet address is required");
    }

    const response = await fetch(
      `${API_URL}/contests/${contestId}/portfolio/${user.wallet_address}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.status === 401) {
      console.error("Authentication failed when fetching portfolio");
      throw new Error("Please connect your wallet to view your portfolio");
    }

    if (response.status === 404) {
      return { tokens: [] };
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch portfolio");
    }

    return response.json();
  },
};
