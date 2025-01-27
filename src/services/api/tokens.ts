import { Token } from "../../types/index";
import { createApiClient } from "./utils";

export const tokens = {
  getAll: async (): Promise<Token[]> => {
    const api = createApiClient();
    const response = await api.fetch("/dd-serv/tokens");
    const responseData = await response.json();
    return responseData.data || responseData;
  },
};
