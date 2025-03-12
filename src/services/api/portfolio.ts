import { createApiClient } from "./utils";
import { useStore } from "../../store/useStore";
import { PortfolioResponse } from "../../types/index";

export const portfolio = {
  get: async (contestId: number): Promise<PortfolioResponse> => {
    const user = useStore.getState().user;

    if (!user?.wallet_address) {
      throw new Error("Wallet address is required");
    }

    const api = createApiClient();
    const response = await api.fetch(
      `/contests/${contestId}/portfolio/${user.wallet_address}`,
    );

    if (response.status === 401) {
      console.error("Authentication failed when fetching portfolio");
      throw new Error("Please connect your wallet to view your portfolio");
    }

    if (response.status === 404) {
      return { tokens: [] };
    }

    return response.json();
  },
};
