// src/components/landing/features-list/animations/AdvancedAnalyticsAnimation.tsx

/**
 * Animation component for the Advanced Analytics feature card
 * Visualizes interactive charts, metrics, and performance visualization
 */

import React from 'react';
import { motion } from 'framer-motion';

export const AdvancedAnalyticsAnimation: React.FC = () => {
  // Performance data
  const performanceData = [
    { value: 65, label: 'Win Rate', color: 'from-green-500 to-emerald-600' },
    { value: 42, label: 'ROI', color: 'from-brand-500 to-purple-600' },
    { value: 78, label: 'Accuracy', color: 'from-blue-500 to-cyan-600' },
    { value: 31, label: 'Risk Score', color: 'from-amber-500 to-yellow-600' },
  ];
  
  // Chart data - simulated historical performance
  const chartData = [
    12, 25, 20, 18, 32, 28, 35, 30, 40, 35, 55, 48, 60, 58, 70, 65, 75, 85, 80, 95, 90, 100
  ];
  
  // Calculate chart coordinates
  const getChartPath = () => {
    const width = 100;
    const height = 40;
    const pointDistance = width / (chartData.length - 1);
    
    // Normalize data to fit height
    const max = Math.max(...chartData);
    const normalized = chartData.map(val => (val / max) * height);
    
    return normalized.map((point, index) => {
      const x = index * pointDistance;
      const y = height - point; // Invert Y to make higher values go up
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  // Get the area under the curve for the chart
  const getChartArea = () => {
    const path = getChartPath();
    return `${path} L 100 40 L 0 40 Z`;
  };
  
  // Animation variants
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const gaugeVariants = {
    initial: { width: 0 },
    animate: (i: number) => ({
      width: `${performanceData[i].value}%`,
      transition: {
        duration: 1.5,
        delay: i * 0.2,
        ease: "easeOut"
      }
    })
  };
  
  const chartVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut"
      }
    }
  };
  
  const areaVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 0.2,
      transition: {
        duration: 1,
        delay: 1.5
      }
    }
  };
  
  // Pulse animation for data points
  const dataPointVariants = {
    pulse: (i: number) => ({
      scale: [1, 1.3, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: i * 0.2
      }
    })
  };
  
  // Dashboard metrics data
  const metrics = [
    { label: 'Trades', value: '143', trend: 'up' },
    { label: 'Contests', value: '12', trend: 'up' },
    { label: 'P&L', value: '+$3,845', trend: 'up' },
    { label: 'Ranking', value: '#28', trend: 'down' },
  ];
  
  // Token performance data
  const tokenPerformance = [
    { symbol: 'SOL', change: '+14.2%', color: 'text-green-500' },
    { symbol: 'BTC', change: '-2.8%', color: 'text-red-500' },
    { symbol: 'BONK', change: '+32.6%', color: 'text-green-500' },
    { symbol: 'DEGEN', change: '+8.4%', color: 'text-green-500' },
  ];

  return (
    <motion.div 
      className="w-full h-full overflow-hidden bg-dark-300/60 rounded-lg p-3"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Dashboard header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono font-bold text-white">Performance Dashboard</div>
        <div className="flex space-x-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-500"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
        </div>
      </div>
      
      {/* Main dashboard area */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left panel - Performance chart */}
        <div className="bg-dark-400/40 rounded p-2 row-span-2">
          <div className="text-[10px] font-mono text-gray-400 mb-1">Portfolio Performance</div>
          
          {/* Chart */}
          <div className="h-[100px] relative">
            <svg viewBox="0 0 100 40" className="w-full h-full">
              {/* Area under the curve */}
              <motion.path
                d={getChartArea()}
                fill="url(#performance-gradient)"
                variants={areaVariants}
                initial="initial"
                animate="animate"
              />
              
              {/* Line chart */}
              <motion.path
                d={getChartPath()}
                fill="none"
                stroke="url(#performance-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                variants={chartVariants}
                initial="initial"
                animate="animate"
              />
              
              {/* Data points with pulse animation */}
              {chartData.map((value, i) => {
                if (i % 3 !== 0) return null; // Only show every 3rd point
                
                const x = i * (100 / (chartData.length - 1));
                const y = 40 - (value / Math.max(...chartData)) * 40;
                
                return (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1"
                    fill="#fff"
                    variants={dataPointVariants}
                    custom={i}
                    animate="pulse"
                  />
                );
              })}
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="performance-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Chart labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-gray-500 font-mono">
              <div>Jan</div>
              <div>Apr</div>
              <div>Jul</div>
              <div>Oct</div>
              <div>Jan</div>
            </div>
          </div>
          
          {/* Performance summary */}
          <div className="mt-1 flex justify-between items-center">
            <div className="text-[10px] font-mono text-gray-400">YTD Return</div>
            <div className="text-green-500 text-xs font-mono font-bold">+104.6%</div>
          </div>
        </div>
        
        {/* Right top panel - Performance metrics */}
        <div className="bg-dark-400/40 rounded p-2">
          <div className="text-[10px] font-mono text-gray-400 mb-1">Key Metrics</div>
          
          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {metrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <div className="text-[8px] text-gray-400 font-mono">{metric.label}</div>
                <div className="flex items-center">
                  <span className="text-xs font-mono font-bold text-white mr-1">{metric.value}</span>
                  {metric.trend === 'up' ? (
                    <span className="text-[8px] text-green-500">↑</span>
                  ) : (
                    <span className="text-[8px] text-red-500">↓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right bottom panel - Top performers */}
        <div className="bg-dark-400/40 rounded p-2">
          <div className="text-[10px] font-mono text-gray-400 mb-1">Token Performance</div>
          
          {/* Token performance list */}
          <div className="space-y-1">
            {tokenPerformance.map((token, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="text-[10px] font-mono text-white">{token.symbol}</div>
                <div className={`text-[10px] font-mono font-bold ${token.color}`}>{token.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Performance gauges */}
      <div className="mt-2 bg-dark-400/40 rounded p-2">
        <div className="text-[10px] font-mono text-gray-400 mb-2">Performance Metrics</div>
        
        <div className="space-y-2">
          {performanceData.map((metric, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="text-[10px] font-mono text-gray-300">{metric.label}</div>
                <div className="text-[10px] font-mono font-bold text-white">{metric.value}%</div>
              </div>
              
              <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                  variants={gaugeVariants}
                  custom={index}
                  initial="initial"
                  animate="animate"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="mt-2 flex justify-between items-center text-[8px] font-mono text-gray-500">
        <div>Last updated: 2m ago</div>
        <div className="flex items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
          <span>Live data</span>
        </div>
      </div>
    </motion.div>
  );
};