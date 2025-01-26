import { Transaction } from "../../types";
import { createApiClient } from "./utils";

export const transactions = {
  getHistory: async (): Promise<Transaction[]> => {
    const api = createApiClient();
    const response = await api.fetch("/transactions");
    return response.json();
  },
};
