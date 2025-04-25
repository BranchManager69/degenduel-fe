import { createApiClient } from "./utils";
import { Token } from "../../types/index";

export interface TokenPrice {
  id: number;
  token_id: number;
  price: string;
  market_cap: string;
  volume_24h: string;
  change_24h: string;
  created_at: string;
}

export interface TokenDetails {
  id: number;
  symbol: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  token_prices?: TokenPrice[];
  token_bucket_memberships?: any[];
}

export interface TokenFilter {
  active?: boolean;
  bucket?: number;
  search?: string;
}

export const tokens = {
  getAll: async (filters?: TokenFilter): Promise<Token[]> => {
    const api = createApiClient();

    // Build query string from filters
    let queryParams = "";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.active !== undefined) {
        params.append("active", filters.active.toString());
      }
      if (filters.bucket !== undefined) {
        params.append("bucket", filters.bucket.toString());
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (params.toString()) {
        queryParams = `?${params.toString()}`;
      }
    }

    const response = await api.fetch(`/tokens${queryParams}`);
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  getById: async (id: number): Promise<TokenDetails> => {
    const api = createApiClient();
    const response = await api.fetch(`/tokens/${id}`);
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  create: async (tokenData: {
    symbol: string;
    name: string;
    bucket_id?: number;
    is_active?: boolean;
  }): Promise<string> => {
    const api = createApiClient();
    const response = await api.fetch("/tokens", {
      method: "POST",
      body: JSON.stringify(tokenData),
    });
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  update: async (
    id: number,
    tokenData: {
      symbol?: string;
      name?: string;
      is_active?: boolean;
      market_cap?: string;
      volume_24h?: string;
      change_24h?: string;
    },
  ): Promise<string> => {
    const api = createApiClient();
    const response = await api.fetch(`/tokens/${id}`, {
      method: "PUT",
      body: JSON.stringify(tokenData),
    });
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  getPrices: async (): Promise<any[]> => {
    const api = createApiClient();
    const response = await api.fetch("/tokens/prices");
    const responseData = await response.json();
    return responseData.data || responseData;
  },

  getPriceHistory: async (tokenId: number): Promise<any> => {
    const api = createApiClient();
    const response = await api.fetch(`/tokens/prices/${tokenId}`);
    const responseData = await response.json();
    return responseData.data || responseData;
  },
};
