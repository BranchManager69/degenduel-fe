import React from 'react';

export interface WebSocketCardProps {
  service: {
    name: string;
    status: 'operational' | 'degraded' | 'error';
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
  };
}

const WebSocketCard: React.FC<WebSocketCardProps> = ({ service }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getPerformanceIndicator = () => {
    const errorRate = service.performance.errorRate;
    if (errorRate < 0.1) return '✓';
    if (errorRate < 1) return '⚠';
    return '✕';
  };

  const getLatencyColor = () => {
    const latency = service.metrics.averageLatency;
    if (latency < 100) return 'text-emerald-400';
    if (latency < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCacheHitRateColor = () => {
    const hitRate = service.metrics.cacheHitRate;
    if (hitRate > 90) return 'text-emerald-400';
    if (hitRate > 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">
            {service.name}
          </h3>
          <span
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${getStatusColor(service.status)}
            `}
          >
            {service.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          {/* Connection Stats */}
          <div>
            <span className="text-sm text-gray-400">Connections</span>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-sm text-gray-300">
                  Active: {service.metrics.totalConnections}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-300">
                  Subscriptions: {service.metrics.activeSubscriptions}
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <span className="text-sm text-gray-400">Performance</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                <span className="text-lg mr-2">{getPerformanceIndicator()}</span>
                <span className="text-sm text-gray-300">
                  {service.performance.messageRate}/s
                </span>
              </div>
              <div>
                <span className={`text-sm ${getLatencyColor()}`}>
                  {service.metrics.averageLatency.toFixed(2)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Cache Performance */}
          {service.metrics.cacheHitRate !== undefined && (
            <div>
              <span className="text-sm text-gray-400">Cache Hit Rate</span>
              <div className="mt-1">
                <div className="text-sm text-gray-300 mb-1">
                  <span className={getCacheHitRateColor()}>
                    {service.metrics.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getCacheHitRateColor()}`}
                    style={{ width: `${service.metrics.cacheHitRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Rate */}
          <div>
            <span className="text-sm text-gray-400">Error Rate</span>
            <div className="mt-1">
              <div className="text-sm text-gray-300 mb-1">
                {service.performance.errorRate.toFixed(2)}%
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    service.performance.errorRate > 1
                      ? 'bg-red-500'
                      : service.performance.errorRate > 0.1
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(service.performance.errorRate * 10, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="text-xs text-gray-500 mt-4">
            Last Update: {new Date(service.metrics.lastUpdate).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketCard; 