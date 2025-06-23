import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface TemplateSection3Props {
  title?: string;
  subtitle?: string;
  metrics?: Array<{
    id: number;
    label: string;
    value: string;
    change: number;
    unit?: string;
    trend: 'up' | 'down' | 'stable';
  }>;
}

const TemplateSection3: React.FC<TemplateSection3Props> = ({
  title = "PERFORMANCE ANALYTICS",
  subtitle = "Real-time system performance metrics and trading statistics across all platform infrastructure and market execution protocols.",
  metrics = [
    {
      id: 1,
      label: "Total Volume Processed",
      value: "2.847",
      change: 12.4,
      unit: "B",
      trend: 'up'
    },
    {
      id: 2,
      label: "Average Execution Time",
      value: "4.2",
      change: -8.7,
      unit: "ms",
      trend: 'down'
    },
    {
      id: 3,
      label: "Active Trading Pairs",
      value: "1,247",
      change: 3.1,
      unit: "",
      trend: 'up'
    },
    {
      id: 4,
      label: "System Uptime",
      value: "99.97",
      change: 0.03,
      unit: "%",
      trend: 'stable'
    },
    {
      id: 5,
      label: "API Requests/Second",
      value: "45.2",
      change: 15.8,
      unit: "K",
      trend: 'up'
    },
    {
      id: 6,
      label: "Liquidity Coverage",
      value: "847",
      change: 7.2,
      unit: "M",
      trend: 'up'
    }
  ]
}) => {
  const [animatedValues, setAnimatedValues] = useState<{ [key: number]: number }>({});
  const secondaryVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  useEffect(() => {
    // Animate the metric values on mount
    const timeout = setTimeout(() => {
      const newValues: { [key: number]: number } = {};
      metrics.forEach(metric => {
        newValues[metric.id] = parseFloat(metric.value.replace(/,/g, ''));
      });
      setAnimatedValues(newValues);
    }, 500);

    return () => clearTimeout(timeout);
  }, [metrics]);

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'stable') return 'text-cyan-400';
    if (change > 0) return 'text-emerald-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'stable') return '→';
    if (change > 0) return '↗';
    return '↘';
  };

  return (
    <motion.div
      className="relative w-full mt-12 md:mt-20"
      variants={secondaryVariants}
    >
      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-brand-400 to-emerald-500 tracking-wider uppercase relative inline-block mb-4">
              {title}
              <div className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-emerald-400 via-brand-400 to-emerald-500 rounded-full" />
            </h2>
          </div>
          <p className="text-base md:text-lg text-gray-300 mt-4 md:mt-6 max-w-4xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              className="group relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              {/* Sophisticated metric card */}
              <div className="relative h-full">
                
                {/* Background with hexagonal clip path */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm border border-white/10 group-hover:border-emerald-400/30 transition-all duration-500"
                  style={{
                    clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
                  }}
                />
                
                {/* Inner glow effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-cyan-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
                  }}
                />

                {/* Content */}
                <div className="relative p-8 h-full flex flex-col">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider leading-tight">
                      {metric.label}
                    </h3>
                    <div className={`text-xs font-mono ${getTrendColor(metric.trend, metric.change)} flex items-center gap-1`}>
                      <span>{getTrendIcon(metric.trend, metric.change)}</span>
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </div>

                  {/* Main Value */}
                  <div className="flex-1 flex items-center">
                    <div className="flex items-baseline gap-1">
                      <motion.span 
                        className="text-3xl md:text-4xl font-bold text-white font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                      >
                        {animatedValues[metric.id] !== undefined ? 
                          (metric.value.includes(',') ? 
                            animatedValues[metric.id].toLocaleString() : 
                            animatedValues[metric.id].toFixed(metric.unit === 'ms' ? 1 : 2)
                          ) : 
                          '0'
                        }
                      </motion.span>
                      {metric.unit && (
                        <span className="text-lg text-gray-400 font-mono">
                          {metric.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4">
                    <div className="w-full h-1 bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min(Math.abs(metric.change) * 5, 100)}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          ))}

        </div>

        {/* System Status Bar */}
        <motion.div
          className="mt-16 p-8 backdrop-blur-sm bg-gradient-to-r from-white/[0.03] to-white/[0.01] border-y border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-sm">ALL SYSTEMS OPERATIONAL</span>
            </div>

            <div className="flex items-center gap-8 text-xs font-mono text-gray-400">
              <div>LAST UPDATE: {new Date().toLocaleTimeString()}</div>
              <div>REFRESH RATE: 500ms</div>
              <div>REGION: GLOBAL</div>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default TemplateSection3; 