// src/components/admin/ip-ban/IpBanFilter.tsx

import React, { useState } from "react";

import { IpBanParams } from "../../../types";

interface IpBanFilterProps {
  onFilterChange: (params: Partial<IpBanParams>) => void;
}

export const IpBanFilter: React.FC<IpBanFilterProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrder(e.target.value as "asc" | "desc");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ filter, sort, order });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 bg-dark-300/30 p-4 rounded-lg border border-dark-300/50"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Search IP Address
          </label>
          <input
            type="text"
            id="filter"
            placeholder="Search IP address..."
            value={filter}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>

        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Sort By
          </label>
          <select
            id="sort"
            value={sort}
            onChange={handleSortChange}
            className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="created_at">Created Date</option>
            <option value="expires_at">Expiration Date</option>
            <option value="troll_level">Troll Level</option>
            <option value="ip_address">IP Address</option>
            <option value="num_attempts">Number of Attempts</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="order"
            className="block text-sm font-medium text-gray-400 mb-1"
          >
            Order
          </label>
          <select
            id="order"
            value={order}
            onChange={handleOrderChange}
            className="w-full px-3 py-2 bg-dark-300/80 border border-dark-300 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};
