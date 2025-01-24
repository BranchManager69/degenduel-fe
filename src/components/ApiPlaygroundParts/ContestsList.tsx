import { useState } from "react";
import { useContests } from "./ContestContext";
import { ResponseDisplay } from "./ResponseDisplay";

export function ContestsList() {
  const { refreshContests } = useContests();
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: "",
    limit: "",
    offset: "",
  });

  const handleGetContests = async () => {
    try {
      setError(null);
      // Build query string from non-empty filters
      const query = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== "")
      ).toString();

      const response = await fetch(
        `https://degenduel.me/api/contests${query ? `?${query}` : ""}`
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
      refreshContests(); // Update the context's contest list
    } catch (err) {
      setError(err);
      console.error("Get Contests Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Get Contests List
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-gray-400 mb-1 block">Status</label>
          <select
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Limit</label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            placeholder="Number of contests"
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
            placeholder="Skip N contests"
            value={filters.offset}
            onChange={(e) =>
              setFilters((f) => ({ ...f, offset: e.target.value }))
            }
          />
        </div>
      </div>

      <button
        onClick={handleGetContests}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        Get Contests
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
