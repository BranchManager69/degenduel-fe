import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ServiceState {
  service: string;
  total_size_bytes: number;
  updated_at: string;
  key_sizes: Record<string, number>;
  key_count: number;
}

interface ServiceStateHistory {
  [timestamp: string]: {
    [service: string]: number;
  };
}

interface ServiceStateMetricsProps {
  isVisible: boolean;
}

export const ServiceStateMetrics: React.FC<ServiceStateMetricsProps> = ({
  isVisible,
}) => {
  const [currentStates, setCurrentStates] = useState<ServiceState[]>([]);
  const [stateHistory, setStateHistory] = useState<ServiceStateHistory>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/service-metrics/service-states");
      if (!response.ok) throw new Error("Failed to fetch service states");

      const data = await response.json();
      setCurrentStates(data.current);
      setStateHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchServiceStates();
      const interval = setInterval(fetchServiceStates, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getChartData = () => {
    const timestamps = Object.keys(stateHistory).sort();
    const services = Array.from(
      new Set(
        Object.values(stateHistory).flatMap((state) => Object.keys(state))
      )
    );

    const datasets = services.map((service) => ({
      label: service,
      data: timestamps.map((ts) => stateHistory[ts][service] || 0),
      borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      tension: 0.4,
    }));

    return {
      labels: timestamps.map((ts) => new Date(ts).toLocaleTimeString()),
      datasets,
    };
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Service State Sizes Over Time",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatBytes(Number(value));
          },
        },
      },
    },
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentStates.map((state) => (
          <div
            key={state.service}
            className="bg-dark-300/50 p-4 rounded-lg border border-brand-500/20"
          >
            <h3 className="text-brand-400 font-semibold mb-2">
              {state.service}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Size:</span>
                <span className="text-brand-300">
                  {formatBytes(state.total_size_bytes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Keys:</span>
                <span className="text-brand-300">{state.key_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated:</span>
                <span className="text-brand-300">
                  {new Date(state.updated_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-gray-400 mb-1">Key Sizes:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {Object.entries(state.key_sizes)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, size]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500 truncate" title={key}>
                          {key}
                        </span>
                        <span className="text-brand-300 ml-2">
                          {formatBytes(size)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-dark-300/50 p-4 rounded-lg border border-brand-500/20">
        <div className="h-64">
          {Object.keys(stateHistory).length > 0 ? (
            <Line data={getChartData()} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No historical data available
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-500">
          Loading service states...
        </div>
      )}
      {error && (
        <div className="text-center text-red-400">
          Error: {error}
          <button
            onClick={fetchServiceStates}
            className="ml-2 text-brand-400 hover:text-brand-300"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
