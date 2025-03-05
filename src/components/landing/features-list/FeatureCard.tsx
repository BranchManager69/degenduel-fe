import React, { useRef, useEffect } from 'react';
import { MeasureRender, usePerformanceMeasure } from '../../../utils/performance';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient?: string; // Keeping this for compatibility with Features.tsx
  isUpcoming?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  isUpcoming = false 
}) => {
  // No need to track hover state anymore
  
  // Generate a seed for deterministic patterns
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Performance measurement for canvas operations
  const canvasPerf = usePerformanceMeasure('FeatureCard-canvas');
  
  // Pre-calculate candle data outside useEffect for better performance
  const calculateCandleData = (seed: number, count: number) => {
    const data: {isUp: boolean, height: number}[] = [];
    
    // Deterministic random function
    const random = (s: number, i: number) => {
      return ((Math.sin(s + i * 100) + 1) / 2); // 0-1 value
    };
    
    for (let i = 0; i < count; i++) {
      const randVal = random(seed, i);
      const isUp = randVal > 0.5;
      
      // Calculate height - taller toward edges for visual effect
      const centerDistanceFactor = Math.abs((i / (count - 1)) - 0.5) * 2; // 0 at center, 1 at edges
      const heightFactor = 0.5 + centerDistanceFactor * 0.5; // 0.5-1.0
      const height = heightFactor * (0.3 + randVal * 0.4); // Normalized height

      data.push({ isUp, height });
    }
    
    return data;
  };
  
  // Pre-calculate the data
  const CANDLE_COUNT = 5; // Very few candles for maximum performance
  const candleData = calculateCandleData(seed, CANDLE_COUNT);
  
  // Draw minimal, efficient red/green candles pattern
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for performance
    if (!ctx) return;
    
    canvasPerf.start();
    
    // Constants for better performance
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const CANDLE_WIDTH = WIDTH / (CANDLE_COUNT * 2);
    const CANDLE_SPACING = CANDLE_WIDTH;
    
    // Pre-compute colors for better performance
    const GREEN = isUpcoming ? '#3b82f6' : '#22c55e';
    const RED = isUpcoming ? '#6366f1' : '#dc2626';
    const BG_COLOR = isUpcoming ? '#1e1a42' : '#1a1333';
    
    // Clear canvas with background color (faster than clearRect + fillRect)
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Draw abstract candle representation
    for (let i = 0; i < CANDLE_COUNT; i++) {
      const { isUp, height } = candleData[i];
      
      // Determine candle position
      const x = i * (CANDLE_WIDTH + CANDLE_SPACING) + CANDLE_SPACING/2;
      
      // Candle positioning - stagger for visual interest
      const yBottom = HEIGHT;
      const yTop = yBottom - height * HEIGHT;
      
      // Select color based on direction
      ctx.fillStyle = isUp ? GREEN : RED;
      
      // Draw simplified candle without rounded corners
      ctx.fillRect(x, yTop, CANDLE_WIDTH, height * HEIGHT);
    }
    
    // Replace complex line connecting points with a simple horizontal line
    // This is much faster than calculating and drawing curves
    ctx.strokeStyle = isUpcoming ? '#3b82f6' : '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT * 0.4);
    ctx.lineTo(WIDTH, HEIGHT * 0.4);
    ctx.stroke();
    
    canvasPerf.end();
    
  }, [candleData, isUpcoming, canvasPerf]); // Note: using pre-calculated candleData instead of seed
  
  return (
    <MeasureRender id="FeatureCard" logThreshold={5}>
      <div 
        className="relative overflow-hidden rounded-xl border border-opacity-20 h-full transform transition hover:scale-102"
        style={{
          borderColor: isUpcoming ? '#3b82f6' : '#a855f7',
          backgroundColor: isUpcoming ? 'rgba(30, 26, 66, 0.7)' : 'rgba(26, 19, 51, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Bottom stripe with candles visualization - minimal implementation */}
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={250} 
            height={40}
            className="w-full h-full"
          />
        </div>
        
        {/* Content area */}
        <div className="relative z-10 p-4 pb-12">
          {/* SOON tag - simplified */}
          {isUpcoming && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400"></div>
          )}
          
          {/* Title - simplified typography */}
          <h3 className={`
            text-lg font-bold mb-2
            ${isUpcoming ? "text-blue-100" : "text-purple-100"}
          `}>
            {title}
          </h3>
          
          {/* Description - truncated with ellipsis for very long text */}
          <p className={`
            text-sm line-clamp-3
            ${isUpcoming ? "text-blue-200/80" : "text-purple-200/80"}
          `}>
            {description}
          </p>
        </div>
        
        {/* Left color accent bar - static, no animation */}
        <div 
          className={`
            absolute top-0 left-0 bottom-0 w-1
            ${isUpcoming ? 'bg-blue-500' : 'bg-green-500'}
          `}
        />
      </div>
    </MeasureRender>
  );
};