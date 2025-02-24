import React, { useEffect, useState } from "react";
import { FaNetworkWired, FaTimes } from "react-icons/fa";
import WebSocketCard from "../../components/admin/WebSocketCard";
import { WebSocketDebugPanel } from "../../components/debug/WebSocketDebugPanel";

interface WebSocketService {
  name: string;
  status: "operational" | "degraded" | "error";
  metrics: {
    totalConnections: number;
    activeSubscriptions: number;
    messageCount: number;
    errorCount: number;
    cacheHitRate: number;
    averageLatency: number;
    lastUpdate: string;
  };
  performance: {
    messageRate: number;
    errorRate: number;
    latencyTrend: number[];
  };
  config?: {
    maxMessageSize: number;
    rateLimit: number;
    requireAuth: boolean;
  };
}

export const WebSocketMonitoringHub: React.FC = () => {
  const [services, setServices] = useState<WebSocketService[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Define our WebSocket services
  const webSocketServices = [
    { id: "analytics", name: "Analytics WebSocket" },
    { id: "base", name: "Base WebSocket" },
    { id: "circuit-breaker", name: "Circuit Breaker WebSocket" },
    { id: "contest", name: "Contest WebSocket" },
    { id: "market", name: "Market WebSocket" },
    { id: "monitor", name: "Monitor WebSocket" },
    { id: "wallet", name: "Wallet WebSocket" },
    { id: "portfolio", name: "Portfolio WebSocket" },
  ];

  useEffect(() => {
    const fetchServicesStatus = async () => {
      try {
        // Only show loading on first load
        if (!services.length) {
          setIsLoading(true);
        }

        const response = await fetch("/api/superadmin/websocket/status");

        // Handle specific error cases
        if (!response.ok) {
          if (response.status === 502) {
            throw new Error(
              "WebSocket monitoring server is currently unavailable"
            );
          }
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json().catch(() => {
          throw new Error("Invalid response format from server");
        });

        if (data.success) {
          // Use functional update to prevent race conditions
          setServices((prev) => {
            // Only update if data has changed
            const hasChanged =
              JSON.stringify(prev) !== JSON.stringify(data.services);
            if (hasChanged) {
              return data.services;
            }
            return prev;
          });
          setLastUpdate(new Date());
          setError(null);
        } else {
          throw new Error(data.message || "Failed to fetch services status");
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("Failed to fetch")) {
            setError(
              "Unable to connect to monitoring server. Please check your connection."
            );
          } else {
            setError(err.message);
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchServicesStatus();
    const interval = setInterval(fetchServicesStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleServiceClick = (serviceId: string) => {
    setSelectedService((prev) => (prev === serviceId ? null : serviceId));
  };

  const selectedServiceData = selectedService
    ? services.find((s) =>
        s.name.toLowerCase().includes(selectedService.toLowerCase())
      )
    : null;

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            WebSocket Monitoring Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Unified monitoring interface for all WebSocket services
            {!error && (
              <span className="ml-2 text-sm">
                (Last update: {lastUpdate.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <FaNetworkWired className="w-12 h-12 text-brand-400" />
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md text-red-300 text-sm transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {isLoading && !services.length && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      )}

      {/* Selected Service Detail View */}
      {selectedServiceData && (
        <div className="mb-8 bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">
                {selectedServiceData.name} Details
              </h2>
              <p
                className={`text-sm mt-1 ${
                  selectedServiceData.status === "operational"
                    ? "text-green-400"
                    : selectedServiceData.status === "degraded"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                Status:{" "}
                {selectedServiceData.status.charAt(0).toUpperCase() +
                  selectedServiceData.status.slice(1)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleServiceClick(selectedServiceData.name);
              }}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <div className="bg-dark-300/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-brand-400 mb-3">
                Performance
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Message Rate</span>
                  <span className="text-gray-200">
                    {selectedServiceData.performance.messageRate}/s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Rate</span>
                  <span
                    className={`${
                      selectedServiceData.performance.errorRate > 5
                        ? "text-red-400"
                        : selectedServiceData.performance.errorRate > 1
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {selectedServiceData.performance.errorRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Latency</span>
                  <span
                    className={`${
                      selectedServiceData.metrics.averageLatency > 1000
                        ? "text-red-400"
                        : selectedServiceData.metrics.averageLatency > 500
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {selectedServiceData.metrics.averageLatency}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Messages</span>
                  <span className="text-gray-200">
                    {selectedServiceData.metrics.messageCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Errors</span>
                  <span className="text-gray-200">
                    {selectedServiceData.metrics.errorCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Stats */}
            <div className="bg-dark-300/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-brand-400 mb-3">
                Connections
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Connections</span>
                  <span className="text-gray-200">
                    {selectedServiceData.metrics.totalConnections.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Subscriptions</span>
                  <span className="text-gray-200">
                    {selectedServiceData.metrics.activeSubscriptions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache Hit Rate</span>
                  <span
                    className={`${
                      selectedServiceData.metrics.cacheHitRate > 90
                        ? "text-green-400"
                        : selectedServiceData.metrics.cacheHitRate > 70
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedServiceData.metrics.cacheHitRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Update</span>
                  <span className="text-gray-200">
                    {new Date(
                      selectedServiceData.metrics.lastUpdate
                    ).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Connection Rate</span>
                  <span className="text-gray-200">
                    {(
                      (selectedServiceData.metrics.totalConnections /
                        (selectedServiceData.metrics.activeSubscriptions ||
                          1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Service Health */}
            <div className="bg-dark-300/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-brand-400 mb-3">
                Service Health
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Message Success Rate</span>
                  <span
                    className={`${
                      100 - selectedServiceData.performance.errorRate > 99
                        ? "text-green-400"
                        : 100 - selectedServiceData.performance.errorRate > 95
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {(100 - selectedServiceData.performance.errorRate).toFixed(
                      2
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Performance Score</span>
                  <span
                    className={`${
                      selectedServiceData.metrics.averageLatency < 100 &&
                      selectedServiceData.performance.errorRate < 1
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {Math.max(
                      0,
                      100 -
                        selectedServiceData.metrics.averageLatency / 10 -
                        selectedServiceData.performance.errorRate * 10
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Factor</span>
                  <span
                    className={`${
                      selectedServiceData.metrics.activeSubscriptions /
                        selectedServiceData.metrics.totalConnections >
                      0.8
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {(
                      (selectedServiceData.metrics.activeSubscriptions /
                        (selectedServiceData.metrics.totalConnections || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                {selectedServiceData.performance.latencyTrend.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latency Trend</span>
                    <span className="text-gray-200">
                      {selectedServiceData.performance.latencyTrend
                        .slice(-5)
                        .join(" → ")}
                      ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            {selectedServiceData.config && (
              <div className="bg-dark-300/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-brand-400 mb-3">
                  Configuration
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Message Size</span>
                    <span className="text-gray-200">
                      {(
                        selectedServiceData.config.maxMessageSize / 1024
                      ).toFixed(2)}{" "}
                      KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate Limit</span>
                    <span className="text-gray-200">
                      {selectedServiceData.config.rateLimit}/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auth Required</span>
                    <span
                      className={`${
                        selectedServiceData.config.requireAuth
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {selectedServiceData.config.requireAuth ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {webSocketServices.map((service) => {
          const serviceData = services.find((s) =>
            s.name.toLowerCase().includes(service.id)
          ) || {
            name: service.name,
            status: "error" as const,
            metrics: {
              totalConnections: 0,
              activeSubscriptions: 0,
              messageCount: 0,
              errorCount: 0,
              cacheHitRate: 0,
              averageLatency: 0,
              lastUpdate: new Date().toISOString(),
            },
            performance: {
              messageRate: 0,
              errorRate: 0,
              latencyTrend: [],
            },
          };

          return (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className={`cursor-pointer transition-all duration-200 transform hover:scale-102 hover:opacity-80 active:opacity-70 ${
                selectedService === service.id
                  ? "ring-2 ring-brand-500 rounded-lg"
                  : ""
              }`}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleServiceClick(service.id);
                }
              }}
            >
              <WebSocketCard service={serviceData} />
            </div>
          );
        })}
      </div>

      {/* System-wide Metrics */}
      <div className="mt-8 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-brand-400/20">
        <h2 className="text-xl font-bold text-gray-100 mb-4">
          System-wide Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">
              Total Active Connections
            </div>
            <div className="text-2xl font-bold text-gray-100">
              {services.reduce(
                (sum, service) => sum + service.metrics.totalConnections,
                0
              )}
            </div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Messages/sec</div>
            <div className="text-2xl font-bold text-gray-100">
              {services.reduce(
                (sum, service) => sum + service.performance.messageRate,
                0
              )}
            </div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Average Latency</div>
            <div className="text-2xl font-bold text-gray-100">
              {services.length
                ? (
                    services.reduce(
                      (sum, service) => sum + service.metrics.averageLatency,
                      0
                    ) / services.length
                  ).toFixed(2)
                : 0}
              ms
            </div>
          </div>
          <div className="bg-dark-300/30 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Errors (24h)</div>
            <div className="text-2xl font-bold text-gray-100">
              {services.reduce(
                (sum, service) => sum + service.metrics.errorCount,
                0
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <WebSocketDebugPanel />
    </div>
  );
};

export default WebSocketMonitoringHub;
