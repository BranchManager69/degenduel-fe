import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ddApi, getCircuitBreakerAnalytics } from "../../services/dd-api";

interface ServiceMetrics {
  requestRate: number;
  errorRate: number;
  lastMinuteRequests: number[];
  capacityUtilization: number;
}

interface PerformanceMetrics {
  total_requests: number;
  avg_response_time: number;
  max_response_time: number;
  routes: Record<
    string,
    {
      requests: number;
      avg_response_time: number;
      max_response_time: number;
    }
  >;
}

interface MemoryStats {
  heap_used_mb: number;
  heap_total_mb: number;
  rss_mb: number;
  external_mb: number;
  array_buffers_mb: number;
  uptime_hours: number;
}

interface SystemAlert {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  details: any;
  id: string;
  timestamp: Date;
}

const CircuitBreakerPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState(getCircuitBreakerAnalytics());
  const [serviceMetrics, setServiceMetrics] = useState<
    Record<string, ServiceMetrics>
  >({});
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceCapacities, setServiceCapacities] = useState<
    Record<string, number>
  >({});
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number>(0);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  // Add system alert handler
  const addSystemAlert = (alert: Omit<SystemAlert, "id" | "timestamp">) => {
    setSystemAlerts((prev) =>
      [
        {
          ...alert,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 10)
    ); // Keep only last 10 alerts
  };

  // Load service capacities
  useEffect(() => {
    const loadCapacities = async () => {
      const capacities = await ddApi.admin.getServiceCapacities();
      setServiceCapacities(capacities);
    };
    loadCapacities();
  }, []);

  // Update analytics every 5 seconds
  useEffect(() => {
    const updateAnalytics = async () => {
      const newAnalytics = getCircuitBreakerAnalytics();
      setAnalytics(newAnalytics);

      try {
        // Fetch performance metrics and memory stats
        const [perfMetrics, memStats] = await Promise.all([
          ddApi.admin.getPerformanceMetrics(),
          ddApi.admin.getMemoryStats(),
        ]);
        setPerformanceMetrics(perfMetrics);
        setMemoryStats(memStats);

        // Calculate metrics for each service
        const newMetrics: Record<string, ServiceMetrics> = {};
        newAnalytics.services.forEach((service) => {
          const capacity = serviceCapacities[service.name] || 100;
          const recentHistory = service.recoveryHistory.filter(
            (h) => h.timestamp > Date.now() - 60000
          );
          const errorCount = recentHistory.filter((h) => !h.success).length;

          newMetrics[service.name] = {
            requestRate: recentHistory.length,
            errorRate: errorCount / (recentHistory.length || 1),
            lastMinuteRequests: recentHistory.map((h) => h.timestamp),
            capacityUtilization: recentHistory.length / capacity,
          };
        });
        setServiceMetrics(newMetrics);
      } catch (error) {
        console.error("Failed to update metrics:", error);
      }
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 5000);
    return () => clearInterval(interval);
  }, [serviceCapacities]);

  // Update the circuit breaker event handler to use the event
  useEffect(() => {
    const handleCircuitBreaker = (event: CustomEvent<any>) => {
      setAnalytics(getCircuitBreakerAnalytics());
      // Add system alert for circuit breaker event
      if (event.detail) {
        addSystemAlert({
          type: "error",
          title: "Circuit Breaker Activated",
          message: `Service protection mechanism activated for ${event.detail.service}`,
          details: event.detail,
        });
      }
    };

    window.addEventListener(
      "circuit-breaker",
      handleCircuitBreaker as EventListener
    );
    return () => {
      window.removeEventListener(
        "circuit-breaker",
        handleCircuitBreaker as EventListener
      );
    };
  }, []);

  const getHealthColor = (status: string, utilization: number) => {
    if (status === "failed") return "rgb(239, 68, 68)";
    if (status === "degraded") return "rgb(234, 179, 8)";
    if (utilization > 0.8) return "rgb(234, 179, 8)";
    return "rgb(34, 197, 94)";
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const handleCapacityUpdate = async (service: string, capacity: number) => {
    try {
      await ddApi.admin.updateServiceCapacity(service, capacity);
      setServiceCapacities((prev) => ({
        ...prev,
        [service]: capacity,
      }));
      setIsEditingCapacity(false);
    } catch (error) {
      console.error("Failed to update capacity:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <div className="bg-dark-300/50 rounded-lg p-6 border border-brand-500/20">
        <h3 className="text-xl font-bold text-gray-200 mb-4">
          System Health Overview
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-200/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total Incidents</div>
            <div className="text-2xl font-bold text-gray-200">
              {analytics.totalFailures}
            </div>
          </div>
          <div className="bg-dark-200/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">
              Mean Time Between Failures
            </div>
            <div className="text-2xl font-bold text-gray-200">
              {analytics.meanTimeBetweenFailures
                ? formatDuration(analytics.meanTimeBetweenFailures)
                : "N/A"}
            </div>
          </div>
          <div className="bg-dark-200/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Last Incident</div>
            <div className="text-2xl font-bold text-gray-200">
              {analytics.lastIncident
                ? new Date(analytics.lastIncident).toLocaleTimeString()
                : "No incidents"}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="bg-dark-300/50 rounded-lg p-6 border border-brand-500/20">
          <h3 className="text-xl font-bold text-gray-200 mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Requests</div>
              <div className="text-2xl font-bold text-gray-200">
                {performanceMetrics.total_requests}
              </div>
            </div>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Avg Response Time</div>
              <div className="text-2xl font-bold text-gray-200">
                {performanceMetrics.avg_response_time.toFixed(2)}ms
              </div>
            </div>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Max Response Time</div>
              <div className="text-2xl font-bold text-gray-200">
                {performanceMetrics.max_response_time.toFixed(2)}ms
              </div>
            </div>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Active Routes</div>
              <div className="text-2xl font-bold text-gray-200">
                {Object.keys(performanceMetrics.routes).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Stats */}
      {memoryStats && (
        <div className="bg-dark-300/50 rounded-lg p-6 border border-brand-500/20">
          <h3 className="text-xl font-bold text-gray-200 mb-4">Memory Usage</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Heap Usage</div>
              <div className="text-2xl font-bold text-gray-200">
                {memoryStats.heap_used_mb}/{memoryStats.heap_total_mb} MB
              </div>
              <div className="mt-2 h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{
                    width: `${
                      (memoryStats.heap_used_mb / memoryStats.heap_total_mb) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">RSS Memory</div>
              <div className="text-2xl font-bold text-gray-200">
                {memoryStats.rss_mb} MB
              </div>
            </div>
            <div className="bg-dark-200/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-2xl font-bold text-gray-200">
                {Math.floor(memoryStats.uptime_hours)}h{" "}
                {Math.floor((memoryStats.uptime_hours % 1) * 60)}m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Alerts */}
      <AnimatePresence>
        {systemAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-300/50 rounded-lg p-6 border border-brand-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-200">System Alerts</h3>
              <button
                onClick={() => setSystemAlerts([])}
                className="text-gray-400 hover:text-gray-300"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    p-4 rounded-lg border
                    ${
                      alert.type === "error"
                        ? "bg-red-500/10 border-red-500/20"
                        : ""
                    }
                    ${
                      alert.type === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/20"
                        : ""
                    }
                    ${
                      alert.type === "info"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        mt-1 text-xl
                        ${alert.type === "error" ? "text-red-400" : ""}
                        ${alert.type === "warning" ? "text-yellow-400" : ""}
                        ${alert.type === "info" ? "text-blue-400" : ""}
                      `}
                    >
                      {alert.type === "error"
                        ? "⚠"
                        : alert.type === "warning"
                        ? "⚡"
                        : "ℹ"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`
                            font-medium
                            ${alert.type === "error" ? "text-red-400" : ""}
                            ${alert.type === "warning" ? "text-yellow-400" : ""}
                            ${alert.type === "info" ? "text-blue-400" : ""}
                          `}
                        >
                          {alert.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-1">{alert.message}</p>
                      {alert.details && (
                        <div className="mt-2 text-sm font-mono bg-dark-400/50 rounded p-2">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSystemAlerts((prev) =>
                          prev.filter((a) => a.id !== alert.id)
                        )
                      }
                      className="text-gray-500 hover:text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Grid */}
      <div className="grid grid-cols-2 gap-6">
        {analytics.services.map((service) => {
          const metrics = serviceMetrics[service.name] || {
            requestRate: 0,
            errorRate: 0,
            lastMinuteRequests: [],
            capacityUtilization: 0,
          };

          const healthColor = getHealthColor(
            service.status,
            metrics.capacityUtilization
          );

          return (
            <motion.div
              key={service.name}
              className="bg-dark-300/50 rounded-lg p-6 border border-brand-500/20 cursor-pointer hover:bg-dark-300/70 transition-colors"
              onClick={() => setSelectedService(service.name)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-200">
                    {service.name}
                  </h4>
                  <div className="text-sm text-gray-400">
                    {service.status === "healthy"
                      ? "Operational"
                      : service.status === "degraded"
                      ? "Performance Issues"
                      : "Circuit Open"}
                  </div>
                </div>
                <div
                  className={`h-3 w-3 rounded-full`}
                  style={{ backgroundColor: healthColor }}
                />
              </div>

              {/* Service Metrics */}
              <div className="space-y-4">
                {/* Utilization Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Load</span>
                    <span className="text-gray-400">
                      {Math.round(metrics.capacityUtilization * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: healthColor,
                        width: `${Math.min(
                          100,
                          metrics.capacityUtilization * 100
                        )}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          100,
                          metrics.capacityUtilization * 100
                        )}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Request Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Requests/min</div>
                    <div className="text-lg font-semibold text-gray-200">
                      {metrics.requestRate}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Error Rate</div>
                    <div className="text-lg font-semibold text-gray-200">
                      {(metrics.errorRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Last Activity */}
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Last Activity
                  </div>
                  <div className="text-sm text-gray-200">
                    {service.lastSuccess
                      ? new Date(service.lastSuccess).toLocaleTimeString()
                      : "No recent activity"}
                  </div>
                </div>
              </div>

              {/* Add capacity display/edit */}
              <div className="mt-4 pt-4 border-t border-dark-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Service Capacity
                  </span>
                  <span className="text-sm text-gray-200">
                    {serviceCapacities[service.name] || 100} req/min
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-300 rounded-lg p-6 max-w-2xl w-full mx-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-200">
                  {selectedService} Details
                </h3>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              {/* Capacity Management */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Service Capacity</span>
                  {isEditingCapacity ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newCapacity}
                        onChange={(e) =>
                          setNewCapacity(
                            Math.max(1, parseInt(e.target.value) || 0)
                          )
                        }
                        className="bg-dark-200 border border-brand-500/20 rounded px-2 py-1 w-24 text-gray-200"
                      />
                      <button
                        onClick={() =>
                          handleCapacityUpdate(selectedService, newCapacity)
                        }
                        className="text-sm text-brand-400 hover:text-brand-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingCapacity(false)}
                        className="text-sm text-gray-400 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">
                        {serviceCapacities[selectedService] || 100} req/min
                      </span>
                      <button
                        onClick={() => {
                          setNewCapacity(
                            serviceCapacities[selectedService] || 100
                          );
                          setIsEditingCapacity(true);
                        }}
                        className="text-sm text-brand-400 hover:text-brand-300"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Performance */}
              {performanceMetrics?.routes[selectedService] && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-gray-200 mb-2">
                    Route Performance
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Requests</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {performanceMetrics.routes[selectedService].requests}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Response</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {performanceMetrics.routes[
                          selectedService
                        ].avg_response_time.toFixed(2)}
                        ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Max Response</div>
                      <div className="text-lg font-semibold text-gray-200">
                        {performanceMetrics.routes[
                          selectedService
                        ].max_response_time.toFixed(2)}
                        ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircuitBreakerPanel;
