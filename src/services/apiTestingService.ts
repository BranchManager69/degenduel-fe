import { API_URL } from "../config/config";

interface SwapQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

interface UltraOrderRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  walletId: string;
}

interface SwapExecuteRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  walletId: string;
  slippageBps?: number;
}

interface BatchQuotesRequest {
  quotes: SwapQuoteRequest[];
}

interface ParseTransactionsRequest {
  signatures: string[];
}

class ApiTestingService {
  private apiClient = {
    fetch: async (endpoint: string, options: RequestInit = {}) => {
      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Debug": "true",
        Origin: window.location.origin,
      });

      console.log("[API Testing Debug] Request Details:", {
        url: `${API_URL}${endpoint}`,
        method: options.method || "GET",
        headers: Object.fromEntries([...headers]),
        body: options.body,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        mode: "cors",
      });

      console.log("[API Testing Debug] Response Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        url: response.url,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error(`[API Testing Error]:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers]),
          url: response.url,
          errorText,
        });
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response;
    },
  };

  // Admin Swap Trading Endpoints
  async getSwapTradingStatus(): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/status');
    return response.json();
  }

  async getSwapQuote(request: SwapQuoteRequest): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async createUltraOrder(request: UltraOrderRequest): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/ultra/order', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async executeUltraSwap(request: UltraOrderRequest): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/ultra/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async executeStandardSwap(request: SwapExecuteRequest): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/swap/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async getBatchQuotes(request: BatchQuotesRequest): Promise<any> {
    const response = await this.apiClient.fetch('/admin/swap-trading/batch/quotes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async getTokenPrices(tokens: string): Promise<any> {
    const response = await this.apiClient.fetch(`/admin/swap-trading/prices/${tokens}`);
    return response.json();
  }

  async getWalletBalances(walletId: string): Promise<any> {
    const response = await this.apiClient.fetch(`/admin/swap-trading/balances/${walletId}`);
    return response.json();
  }

  // Transaction Parsing Endpoints
  async parseTransaction(signature: string): Promise<any> {
    const response = await this.apiClient.fetch(`/solana/parse-transaction/${signature}`);
    return response.json();
  }

  async parseSwapTransaction(signature: string): Promise<any> {
    const response = await this.apiClient.fetch(`/solana/parse-swap/${signature}`);
    return response.json();
  }

  async parseMultipleTransactions(request: ParseTransactionsRequest): Promise<any> {
    const response = await this.apiClient.fetch('/solana/parse-transactions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }
}

export const apiTestingService = new ApiTestingService();
export type { BatchQuotesRequest, ParseTransactionsRequest, SwapExecuteRequest, SwapQuoteRequest, UltraOrderRequest };
