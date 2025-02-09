import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";
import { getCircuitBreakerAnalytics } from "../../services/dd-api";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "failed";
  failures: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  recoveryHistory: Array<{ timestamp: number; success: boolean }>;
}

export const CircuitBreakerMonitor: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const analytics = getCircuitBreakerAnalytics();
      setServices(analytics.services as ServiceStatus[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {services.map((service) => (
        <div key={service.name} className="bg-dark-300/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-100">
              {service.name}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                service.status === "healthy"
                  ? "bg-green-500/20 text-green-400"
                  : service.status === "degraded"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {service.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Current Failures</p>
              <p className="text-xl font-semibold text-gray-100">
                {service.failures}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Last Success</p>
              <p className="text-gray-100">
                {service.lastSuccess
                  ? formatDistanceToNow(new Date(service.lastSuccess), {
                      addSuffix: true,
                    })
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Last Failure</p>
              <p className="text-gray-100">
                {service.lastFailure
                  ? formatDistanceToNow(new Date(service.lastFailure), {
                      addSuffix: true,
                    })
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Recovery History</p>
              <p className="text-gray-100">
                {service.recoveryHistory.length} events
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
