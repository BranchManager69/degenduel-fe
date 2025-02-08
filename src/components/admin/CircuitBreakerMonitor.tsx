import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface CircuitBreakerState {
  state: 'open' | 'closed';
  failures: number;
  last_failure: string | null;
  last_success: string | null;
  config: {
    failure_threshold: number;
    reset_timeout_ms: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded';
  stats: {
    operations: {
      total: number;
      successful: number;
      failed: number;
    };
    endpoints: {
      [key: string]: {
        total: number;
        successful: number;
        failed: number;
        average_response_time_ms: number;
        last_error: string | null;
        last_success: string | null;
      };
    };
    performance: {
      average_response_time_ms: number;
    };
  };
}

export const CircuitBreakerMonitor: React.FC = () => {
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerState | null>(null);
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [circuitResponse, healthResponse] = await Promise.all([
        fetch('/api/dd-serv/circuit-breaker'),
        fetch('/api/dd-serv/health')
      ]);

      if (!circuitResponse.ok || !healthResponse.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const circuitData = await circuitResponse.json();
      const healthData = await healthResponse.json();

      setCircuitBreaker(circuitData);
      setHealth(healthData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
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

  if (!circuitBreaker || !health) {
    return null;
  }

  const successRate = health.stats.operations.total > 0
    ? ((health.stats.operations.successful / health.stats.operations.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Circuit Breaker Status */}
      <div className="bg-dark-300/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-100">Circuit Breaker Status</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              circuitBreaker.state === 'closed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {circuitBreaker.state.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Current Failures</p>
            <p className="text-xl font-semibold text-gray-100">
              {circuitBreaker.failures} / {circuitBreaker.config.failure_threshold}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Reset Timeout</p>
            <p className="text-xl font-semibold text-gray-100">
              {(circuitBreaker.config.reset_timeout_ms / 1000).toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-gray-400">Last Success</p>
            <p className="text-gray-100">
              {circuitBreaker.last_success
                ? formatDistanceToNow(new Date(circuitBreaker.last_success), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Last Failure</p>
            <p className="text-gray-100">
              {circuitBreaker.last_failure
                ? formatDistanceToNow(new Date(circuitBreaker.last_failure), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Service Health */}
      <div className="bg-dark-300/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-100">Service Health</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              health.status === 'healthy'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {health.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400">Success Rate</p>
            <p className="text-xl font-semibold text-gray-100">{successRate}%</p>
          </div>
          <div>
            <p className="text-gray-400">Total Operations</p>
            <p className="text-xl font-semibold text-gray-100">{health.stats.operations.total}</p>
          </div>
          <div>
            <p className="text-gray-400">Avg Response Time</p>
            <p className="text-xl font-semibold text-gray-100">
              {health.stats.performance.average_response_time_ms.toFixed(1)}ms
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint Stats */}
      <div className="bg-dark-300/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-100 mb-4">Endpoint Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-300">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Endpoint</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Success Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Avg Response</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {Object.entries(health.stats.endpoints).map(([endpoint, stats]) => {
                const endpointSuccessRate = stats.total > 0
                  ? ((stats.successful / stats.total) * 100).toFixed(1)
                  : '0';

                return (
                  <tr key={endpoint}>
                    <td className="px-4 py-3 text-sm text-gray-300">{endpoint}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          Number(endpointSuccessRate) > 90
                            ? 'bg-green-500/20 text-green-400'
                            : Number(endpointSuccessRate) > 75
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {endpointSuccessRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {stats.average_response_time_ms.toFixed(1)}ms
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {stats.last_error
                        ? <span className="text-red-400">{stats.last_error}</span>
                        : <span className="text-green-400">None</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 