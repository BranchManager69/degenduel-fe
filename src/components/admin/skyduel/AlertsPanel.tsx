import React, { useState } from "react";

import { useStore } from "../../../store/useStore";

export const AlertsPanel: React.FC = () => {
  const { skyDuel, setSkyDuelSelectedNode } = useStore();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "critical" | "error" | "warning" | "info"
  >("all");

  // Collect all alerts from all nodes
  const allAlerts = skyDuel.nodes.flatMap((node) =>
    node.alerts.map((alert) => ({
      ...alert,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
    })),
  );

  // Filter alerts
  const filteredAlerts = allAlerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  // Sort alerts by timestamp (newest first)
  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Limit number of alerts shown unless showAll is true
  const displayAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, 5);

  // Get count of alerts by severity
  const criticalCount = allAlerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const errorCount = allAlerts.filter((a) => a.severity === "error").length;
  const warningCount = allAlerts.filter((a) => a.severity === "warning").length;
  const infoCount = allAlerts.filter((a) => a.severity === "info").length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-amber-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "info":
        return "bg-blue-500/10 border-blue-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wider text-gray-400">
          System Alerts
        </h3>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-dark-600 mb-3">
        <button
          className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
            filter === "all"
              ? "border-brand-500 text-brand-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setFilter("all")}
        >
          All ({allAlerts.length})
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
            filter === "critical"
              ? "border-red-500 text-red-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setFilter("critical")}
        >
          Critical ({criticalCount})
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
            filter === "error"
              ? "border-red-400 text-red-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setFilter("error")}
        >
          Error ({errorCount})
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
            filter === "warning"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setFilter("warning")}
        >
          Warning ({warningCount})
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
            filter === "info"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setFilter("info")}
        >
          Info ({infoCount})
        </button>
      </div>

      {/* Alerts list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {displayAlerts.length > 0 ? (
          displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2 rounded-lg text-sm border ${getSeverityBg(
                alert.severity,
              )}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div
                  className={`capitalize font-medium ${getSeverityColor(
                    alert.severity,
                  )}`}
                >
                  {alert.severity}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-gray-300 mb-2">{alert.message}</div>
              <div className="flex justify-between items-center">
                <button
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  onClick={() => setSkyDuelSelectedNode(alert.nodeId)}
                >
                  View {alert.nodeName}
                </button>
                <div className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-400 capitalize">
                  {alert.nodeType}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            No alerts{filter !== "all" ? ` with ${filter} severity` : ""}
          </div>
        )}

        {/* Show more/less button */}
        {sortedAlerts.length > 5 && (
          <button
            className="w-full text-center py-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : `Show ${sortedAlerts.length - 5} More`}
          </button>
        )}
      </div>
    </div>
  );
};
