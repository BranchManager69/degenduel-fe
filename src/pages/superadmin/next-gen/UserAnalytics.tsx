import React, { useState } from "react";

import { LiveUserActivityMap } from "../../../components/admin/LiveUserActivityMap";
import { useEnhancedAnalytics } from "../../../hooks/data/legacy/useEnhancedAnalytics";
import { useStore } from "../../../store/useStore";

const UserAnalytics: React.FC = () => {
  const { user } = useStore();
  const [activePage, setActivePage] = useState<
    "activity" | "metrics" | "retention" | "conversion"
  >("activity");

  // Use the enhanced analytics hook
  const { analyticsState, connected, error } = useEnhancedAnalytics();

  if (!user?.is_superadmin) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">
          Access denied. SuperAdmin privileges required.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
              NEXT-GEN
            </span>
            <span className="text-gray-100"> User Analytics</span>
          </h1>
          <p className="text-gray-400">
            Enhanced suite for real-time user monitoring, behavior analysis, and
            platform metrics
          </p>
          <div className="inline-block mt-2 px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-md">
            <span className="text-xs font-mono text-indigo-300">
              v2.0.0-alpha
            </span>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div
          className={`mb-8 ${error ? "bg-red-500/10 border-red-500/20" : connected ? "bg-blue-500/10 border-blue-500/20" : "bg-yellow-500/10 border-yellow-500/20"} border rounded-lg p-4 flex items-center justify-between`}
        >
          <div>
            <h2
              className="text-lg font-semibold mb-1"
              style={{
                color: error ? "#f87171" : connected ? "#60a5fa" : "#fbbf24",
              }}
            >
              {error
                ? "Connection Error"
                : connected
                  ? "WebSocket Connected"
                  : "Connecting..."}
            </h2>
            <p
              className="text-sm"
              style={{
                color: error
                  ? "rgb(248 113 113 / 80%)"
                  : connected
                    ? "rgb(96 165 250 / 80%)"
                    : "rgb(251 191 36 / 80%)",
              }}
            >
              {error ||
                (connected
                  ? "Real-time analytics data is streaming."
                  : "Establishing connection to analytics service...")}
            </p>
          </div>
          <div
            className={`rounded-full p-3 ${error ? "bg-red-500/20" : connected ? "bg-blue-500/20" : "bg-yellow-500/20"}`}
          >
            {connected ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : error ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="animate-spin h-6 w-6 text-yellow-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
          </div>
        </div>

        {/* Data Summary Banner */}
        <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <div className="text-xs text-indigo-300 mb-1">Active Users</div>
              <div className="text-2xl font-bold text-indigo-100">
                {analyticsState.activeUsers}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <div className="text-xs text-indigo-300 mb-1">
                24h Trading Volume
              </div>
              <div className="text-2xl font-bold text-indigo-100">
                ${analyticsState.metrics.totalVolume24h.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <div className="text-xs text-indigo-300 mb-1">
                Active Contests
              </div>
              <div className="text-2xl font-bold text-indigo-100">
                {analyticsState.metrics.totalContests}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <div className="text-xs text-indigo-300 mb-1">Response Time</div>
              <div className="text-2xl font-bold text-indigo-100">
                {analyticsState.metrics.averageResponseTime.toFixed(2)}ms
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-dark-300 pb-2">
          <button
            onClick={() => setActivePage("activity")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "activity"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Live Activity
          </button>
          <button
            onClick={() => setActivePage("metrics")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "metrics"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            User Metrics
          </button>
          <button
            onClick={() => setActivePage("retention")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "retention"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Retention Analysis
          </button>
          <button
            onClick={() => setActivePage("conversion")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "conversion"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Conversion Funnels
          </button>
        </div>

        {/* Content */}
        <div className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-dark-300 p-6">
          {activePage === "activity" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Live User Activity
              </h2>
              <LiveUserActivityMap />
            </div>
          )}

          {activePage === "metrics" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                User Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Performance Metrics */}
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                    System Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">API Response Time</span>
                        <span className="text-gray-300">
                          {analyticsState.metrics.averageResponseTime.toFixed(
                            2,
                          )}
                          ms
                        </span>
                      </div>
                      <div className="h-2 bg-dark-400/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-indigo-500"
                          style={{
                            width: `${Math.min(100, (analyticsState.metrics.averageResponseTime / 200) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Error Rate</span>
                        <span
                          className={`${analyticsState.metrics.errorRate > 2 ? "text-red-300" : "text-green-300"}`}
                        >
                          {analyticsState.metrics.errorRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 bg-dark-400/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${analyticsState.metrics.errorRate > 2 ? "bg-red-500" : "bg-green-500"}`}
                          style={{
                            width: `${Math.min(100, analyticsState.metrics.errorRate * 10)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">
                          Peak Concurrent Users
                        </span>
                        <span className="text-gray-300">
                          {analyticsState.metrics.peakConcurrentUsers}
                        </span>
                      </div>
                      <div className="h-2 bg-dark-400/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{
                            width: `${Math.min(100, (analyticsState.metrics.peakConcurrentUsers / 100) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Total 24h Trades</span>
                        <span className="text-gray-300">
                          {analyticsState.metrics.totalTrades24h.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-dark-400/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                          style={{
                            width: `${Math.min(100, (analyticsState.metrics.totalTrades24h / 1000) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone Distribution */}
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-indigo-300 mb-3">
                    User Zone Distribution
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(analyticsState.usersByZone).map(
                      ([zone, count]) => (
                        <div key={zone}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">{zone}</span>
                            <span className="text-gray-300">{count} users</span>
                          </div>
                          <div className="h-2 bg-dark-400/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{
                                width: `${Math.min(100, (count / Math.max(...Object.values(analyticsState.usersByZone))) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}

                    {Object.keys(analyticsState.usersByZone).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No zone data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "retention" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Retention Analysis
              </h2>
              <div className="p-8 bg-dark-300/50 rounded-lg flex items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-500 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                  <p className="text-center">
                    Enhanced retention analytics coming soon
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    User cohort analysis and retention tracking
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePage === "conversion" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Conversion Funnels
              </h2>
              <div className="p-8 bg-dark-300/50 rounded-lg flex items-center justify-center">
                <div className="text-gray-400 flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-500 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                    />
                  </svg>
                  <p className="text-center">
                    Enhanced conversion analysis coming soon
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    User journey mapping and conversion optimization
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Development Roadmap */}
        <div className="mt-8 bg-dark-200/70 backdrop-blur-sm rounded-lg border border-dark-300 p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">
            Development Roadmap
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs">
                1
              </div>
              <div>
                <h3 className="text-green-300 font-medium">
                  Live Activity Map (Current)
                </h3>
                <p className="text-gray-400 text-sm">
                  Real-time user activity visualization
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-xs">
                2
              </div>
              <div>
                <h3 className="text-yellow-300 font-medium">
                  User Metrics Dashboard (In Development)
                </h3>
                <p className="text-gray-400 text-sm">
                  Comprehensive analytics on user behavior and platform
                  engagement
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs">
                3
              </div>
              <div>
                <h3 className="text-blue-300 font-medium">
                  Retention & Cohort Analysis (Planned)
                </h3>
                <p className="text-gray-400 text-sm">
                  Track user retention and analyze user cohorts over time
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xs">
                4
              </div>
              <div>
                <h3 className="text-purple-300 font-medium">
                  Conversion Funnel Analysis (Planned)
                </h3>
                <p className="text-gray-400 text-sm">
                  Track and optimize user journey and conversion paths
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserAnalytics;
