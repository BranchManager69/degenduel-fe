import { API_URL } from "../../config/config";
import { Token } from "../../types";

export const tokens = {
  getAll: async (): Promise<Token[]> => {
    const response = await fetch(`${API_URL}/dd-serv/tokens`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch tokens");
    }

    const responseData = await response.json();
    return responseData.data || responseData;
  },
};
