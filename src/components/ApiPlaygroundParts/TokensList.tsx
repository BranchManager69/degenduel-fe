import { useState } from "react";

import { ResponseDisplay } from "./ResponseDisplay";

interface TokenFilters {
  limit: string;
  offset: string;
  minMarketCap: string;
  minLiquidity: string;
  minVolume: string;
  search: string;
}

export function TokensList() {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [filters, setFilters] = useState<TokenFilters>({
    limit: "",
    offset: "",
    minMarketCap: "",
    minLiquidity: "",
    minVolume: "",
    search: "",
  });

  const handleGetTokens = async () => {
    try {
      setError(null);
      // Build query string from non-empty filters
      const query = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, v]) => v !== "")
          .map(([k, v]) => [
            k === "minMarketCap"
              ? "min_market_cap"
              : k === "minLiquidity"
                ? "min_liquidity"
                : k === "minVolume"
                  ? "min_volume"
                  : k,
            v,
          ]),
      ).toString();

      const response = await fetch(
        `https://degenduel.me/api/tokens${query ? `?${query}` : ""}`,
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Get Tokens Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Get Tokens List</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-gray-400 mb-1 block">Search</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="Token name or symbol"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">
            Min Market Cap (USD)
          </label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="e.g. 1000000"
            value={filters.minMarketCap}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minMarketCap: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">
            Min Liquidity (USD)
          </label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="e.g. 50000"
            value={filters.minLiquidity}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minLiquidity: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">
            Min 24h Volume (USD)
          </label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="e.g. 10000"
            value={filters.minVolume}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minVolume: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Limit</label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="Number of tokens"
            value={filters.limit}
            onChange={(e) =>
              setFilters((f) => ({ ...f, limit: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Offset</label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="Skip N tokens"
            value={filters.offset}
            onChange={(e) =>
              setFilters((f) => ({ ...f, offset: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleGetTokens}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Get Tokens
        </button>

        <button
          onClick={() =>
            setFilters({
              limit: "",
              offset: "",
              minMarketCap: "",
              minLiquidity: "",
              minVolume: "",
              search: "",
            })
          }
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
