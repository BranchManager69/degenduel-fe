import { createApiClient } from "./utils";
import { Transaction } from "../../types/index";

export const transactions = {
  getHistory: async (): Promise<Transaction[]> => {
    const api = createApiClient();
    const response = await api.fetch("/transactions");
    return response.json();
  },
};
