import { API_URL } from "../../config/config";
import { Transaction } from "../../types";

export const transactions = {
  getHistory: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/transactions`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },
};
