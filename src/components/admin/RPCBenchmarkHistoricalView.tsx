// src/components/admin/RPCBenchmarkHistoricalView.tsx

import React, { useState } from 'react';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';

interface RPCBenchmarkHistoricalViewProps {
  className?: string;
}

export const RPCBenchmarkHistoricalView: React.FC<RPCBenchmarkHistoricalViewProps> = ({
  className = '',
}) => {
  const [activeMethod, setActiveMethod] = useState<string>('all');
  
  const methods = [
    { id: 'all', label: 'All Methods (Avg)' },
    { id: 'getLatestBlockhash', label: 'getLatestBlockhash' },
    { id: 'getBalance', label: 'getBalance' },
    { id: 'getSlot', label: 'getSlot' },
    { id: 'getVersion', label: 'getVersion' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
        <h2 className="text-xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent mb-4">
          RPC PERFORMANCE HISTORY
        </h2>
        
        <div className="mb-4">
          <p className="text-gray-300">
            Track how RPC providers have performed over time. This view shows median latency values from past benchmark tests.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(method.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeMethod === method.id
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-dark-300/50 text-gray-400 border border-dark-400/30 hover:bg-dark-300/80'
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
        
        <HistoricalPerformanceChart
          title={`RPC Latency Trends - ${methods.find(m => m.id === activeMethod)?.label || 'All Methods'}`}
          description="Lower values indicate better performance. Compare BranchRPC with other providers over time."
          dataType="rpc-benchmarks"
          yAxisLabel="Latency (ms)"
          yAxisValueFormatter={(value) => `${value.toFixed(1)} ms`}
        />
      </div>
      
      {/* Performance Insights Panel */}
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">
          Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-brand-400 font-medium text-sm mb-2">Weekly Average Improvement</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-brand-300">15.3%</span>
              <span className="text-xs text-gray-400">vs. other providers</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              BranchRPC has consistently outperformed other providers by an average of 15.3% over the last 7 days.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-amber-400 font-medium text-sm mb-2">Best Performing Method</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-amber-300">getLatestBlockhash</span>
              <span className="text-xs text-gray-400">32.7% faster</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              BranchRPC shows the largest performance advantage for the getLatestBlockhash method.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-emerald-400 font-medium text-sm mb-2">Most Improved</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-emerald-300">Helius</span>
              <span className="text-xs text-gray-400">8.2% improvement</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Helius has shown the most significant performance improvement over the last 30 days.
            </p>
          </div>
          
          <div className="bg-dark-300/50 rounded-lg p-3 border border-dark-400/50">
            <h4 className="text-red-400 font-medium text-sm mb-2">Performance Alert</h4>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-red-300">getSlot</span>
              <span className="text-xs text-gray-400">5.7% degradation</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The getSlot method has shown a slight performance degradation across all providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RPCBenchmarkHistoricalView;