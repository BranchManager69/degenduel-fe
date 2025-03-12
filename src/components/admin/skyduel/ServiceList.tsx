import React, { useState } from "react";

import { ServiceNode } from "../../../hooks/useSkyDuelWebSocket";
import { useStore } from "../../../store/useStore";

export const ServiceList: React.FC = () => {
  const { skyDuel, setSkyDuelSelectedNode } = useStore();
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "health" | "type">(
    "name",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getStatusLabel = (status: ServiceNode["status"]) => {
    switch (status) {
      case "online":
        return "Online";
      case "degraded":
        return "Degraded";
      case "offline":
        return "Offline";
      case "restarting":
        return "Restarting";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: ServiceNode["status"]) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "offline":
        return "bg-red-500";
      case "restarting":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: ServiceNode["type"]) => {
    switch (type) {
      case "api":
        return "🔌";
      case "worker":
        return "⚙️";
      case "websocket":
        return "🔄";
      case "database":
        return "🗄️";
      case "cache":
        return "⚡";
      default:
        return "📦";
    }
  };

  // Format uptime to human-readable format
  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Filter and sort nodes
  const filteredNodes = skyDuel.nodes.filter((node) => {
    if (!filter) return true;
    return (
      node.name.toLowerCase().includes(filter.toLowerCase()) ||
      node.id.toLowerCase().includes(filter.toLowerCase()) ||
      node.type.toLowerCase().includes(filter.toLowerCase()) ||
      getStatusLabel(node.status).toLowerCase().includes(filter.toLowerCase())
    );
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "status":
        comparison = getStatusLabel(a.status).localeCompare(
          getStatusLabel(b.status),
        );
        break;
      case "health":
        comparison = a.health - b.health;
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Handler for header click
  const handleHeaderClick = (column: "name" | "status" | "health" | "type") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search services..."
          className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Table of services */}
      <div className="overflow-auto flex-grow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-dark-600">
              <th
                className="px-4 py-3 cursor-pointer hover:text-brand-300"
                onClick={() => handleHeaderClick("name")}
              >
                Name
                {sortBy === "name" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-brand-300"
                onClick={() => handleHeaderClick("type")}
              >
                Type
                {sortBy === "type" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-brand-300"
                onClick={() => handleHeaderClick("status")}
              >
                Status
                {sortBy === "status" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-brand-300"
                onClick={() => handleHeaderClick("health")}
              >
                Health
                {sortBy === "health" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="px-4 py-3">Uptime</th>
              <th className="px-4 py-3">Metrics</th>
              <th className="px-4 py-3">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map((node) => (
              <tr
                key={node.id}
                className={`border-b border-dark-600 hover:bg-dark-700/50 cursor-pointer transition-colors ${
                  node.id === skyDuel.selectedNode ? "bg-dark-700" : ""
                }`}
                onClick={() => setSkyDuelSelectedNode(node.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-brand-100">{node.name}</div>
                  <div className="text-xs text-gray-400">{node.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="mr-2">{getTypeIcon(node.type)}</span>
                    <span className="text-gray-300 capitalize">
                      {node.type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(node.status)}`}
                    ></div>
                    <span className="text-gray-300">
                      {getStatusLabel(node.status)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="w-full bg-dark-700 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${node.health}%`,
                        backgroundColor:
                          node.health > 80
                            ? "#22c55e" // Emerald-500
                            : node.health > 50
                              ? "#f59e0b" // Amber-500
                              : "#ef4444", // Red-500
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-400">
                    {node.health}%
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatUptime(node.uptime)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs grid grid-cols-2 gap-x-2 gap-y-1">
                    <span className="text-gray-400">CPU:</span>
                    <span className="text-gray-300">{node.metrics.cpu}%</span>
                    <span className="text-gray-400">Mem:</span>
                    <span className="text-gray-300">
                      {node.metrics.memory}%
                    </span>
                    <span className="text-gray-400">Err:</span>
                    <span className="text-gray-300">
                      {node.metrics.errorRate}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {node.alerts.length > 0 ? (
                    <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs">
                      {node.alerts.length} alert
                      {node.alerts.length > 1 ? "s" : ""}
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                      No alerts
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedNodes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No services matching your filter
          </div>
        )}
      </div>
    </div>
  );
};
