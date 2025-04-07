import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "../../lib/utils";

interface PerformanceData {
  timestamp: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  className?: string;
  highlightColor?: string;
  interactive?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  className = "",
  highlightColor = "#9333ea", // Brand purple default
  interactive = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  // Add some padding to the min/max values for better visualization
  const range = (maxValue - minValue) * 1.1;
  const adjustedMinValue = Math.max(0, minValue - range * 0.05);

  // Calculate percentage change from first to last data point
  const percentageChange = data.length > 1 
    ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100
    : 0;
  
  const isPositiveChange = percentageChange >= 0;

  // Create gradient based on positive/negative change
  const gradientColors = isPositiveChange 
    ? ["rgba(16, 185, 129, 0.2)", "rgba(16, 185, 129, 0)"] 
    : ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0)"];

  // Generate path for line and area
  const generateLinePath = () => {
    return data
      .map((point, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((point.value - adjustedMinValue) / range) * 100;
        return `${i === 0 ? "M" : "L"} ${x}% ${y}%`;
      })
      .join(" ");
  };

  const generateAreaPath = () => {
    return `
      ${generateLinePath()}
      L 100% 100%
      L 0% 100%
      Z
    `;
  };

  // Format date for tooltip
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  // Format the start and end times
  const formatTimeRange = () => {
    if (data.length < 2) return "N/A";
    
    try {
      const startDate = new Date(data[0].timestamp);
      const endDate = new Date(data[data.length - 1].timestamp);
      
      return `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return "Invalid time range";
    }
  };

  // Handle mouse move for interactive tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !chartRef.current || !animationComplete) return;
    
    const chart = chartRef.current;
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartWidth = rect.width;
    
    // Calculate which data point is closest to the cursor
    const pointIndex = Math.min(
      Math.floor((x / chartWidth) * data.length),
      data.length - 1
    );
    
    setHoveredPoint(pointIndex);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  useEffect(() => {
    // Auto-clear hover point after a delay when not interactive
    if (!interactive) {
      const timer = setTimeout(() => {
        setHoveredPoint(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hoveredPoint, interactive]);

  return (
    <div className={`h-80 relative ${className}`}>
      {/* Chart title and stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Performance Chart</h3>
          <div className="text-xs text-gray-400">{formatTimeRange()}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-lg font-semibold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
            {isPositiveChange ? "+" : ""}{percentageChange.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">
            {formatCurrency(data[0]?.value || 0)} → {formatCurrency(data[data.length - 1]?.value || 0)}
          </div>
        </div>
      </div>

      {/* Y-axis labels with animation */}
      <div className="absolute left-0 top-8 bottom-5 w-16 flex flex-col justify-between text-xs text-gray-400">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {formatCurrency(adjustedMinValue + range)}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {formatCurrency(adjustedMinValue + range * 0.75)}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {formatCurrency(adjustedMinValue + range * 0.5)}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {formatCurrency(adjustedMinValue + range * 0.25)}
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {formatCurrency(adjustedMinValue)}
        </motion.span>
      </div>

      {/* Main chart area with interactions */}
      <div 
        ref={chartRef}
        className="absolute left-16 right-0 top-8 bottom-5 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg className="w-full h-full overflow-visible">
          {/* Grid lines with animation */}
          {[...Array(5)].map((_, i) => (
            <motion.line
              key={i}
              x1="0"
              y1={i * (100 / 4) + "%"}
              x2="100%"
              y2={i * (100 / 4) + "%"}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-dark-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            />
          ))}

          {/* Animated area under the line */}
          <motion.path
            d={generateAreaPath()}
            className="fill-gradient"
            style={{
              fill: `url(#areaGradient-${isPositiveChange ? 'positive' : 'negative'})`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Define the gradients */}
          <defs>
            <linearGradient
              id={`areaGradient-${isPositiveChange ? 'positive' : 'negative'}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
            <linearGradient
              id="lineGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={highlightColor} />
              <stop offset="100%" stopColor={isPositiveChange ? "#10b981" : "#ef4444"} />
            </linearGradient>
          </defs>

          {/* Animated line chart */}
          <motion.path
            d={generateLinePath()}
            fill="none"
            stroke={`url(#lineGradient)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            onAnimationComplete={() => setAnimationComplete(true)}
          />

          {/* Data points with hover effect */}
          {data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((point.value - adjustedMinValue) / range) * 100;
            const isHovered = hoveredPoint === i;
            
            return (
              <g key={i}>
                <motion.circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r={isHovered ? "6" : "4"}
                  className={`${isHovered ? "fill-white" : "fill-brand-500"} transition-all duration-300`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: isHovered ? 1 : 0.8,
                    scale: isHovered ? 1.2 : 1
                  }}
                  transition={{ 
                    duration: 0.3,
                    delay: (i / data.length) * 1.5
                  }}
                />
                
                {/* Point hover effects */}
                {isHovered && (
                  <>
                    {/* Vertical guide line */}
                    <line
                      x1={`${x}%`}
                      y1="0%"
                      x2={`${x}%`}
                      y2="100%"
                      stroke="#9333ea"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    
                    {/* Horizontal guide line */}
                    <line
                      x1="0%"
                      y1={`${y}%`}
                      x2="100%"
                      y2={`${y}%`}
                      stroke="#9333ea"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    
                    {/* Data tooltip */}
                    <foreignObject
                      x={`${x > 70 ? x - 20 : x}%`}
                      y={`${y > 80 ? y - 15 : y + 2}%`}
                      width="150"
                      height="60"
                      style={{transform: "translate(-50%, 0)"}}
                    >
                      <div className="bg-gray-900/90 backdrop-blur-sm text-white px-2 py-1 rounded border border-brand-500/30 text-xs font-mono shadow-lg">
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{formatDate(point.timestamp)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span>{formatCurrency(point.value)}</span>
                        </div>
                      </div>
                    </foreignObject>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};