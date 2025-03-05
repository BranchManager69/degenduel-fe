import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient?: string;
  isUpcoming?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  description, 
  icon, 
  gradient = "from-purple-500 via-brand-400 to-pink-500",
  isUpcoming = false 
}) => {
  // Generate a seed for deterministic but unique patterns for each card
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw candlestick chart with animated scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart config - increased size for prominence
    const chartHeight = canvas.height - 2; // Larger chart area
    const candleWidth = 6; // Even wider candles
    const padding = 2; // Spacing between candles
    
    // Generate candlestick data
    const generatePattern = () => {
      // Optimized random function
      const random = (min: number, max: number, index: number) => {
        // Deterministic random based on seed and index
        const x = Math.sin(seed + index) * 10000;
        return ((x - Math.floor(x)) * (max - min)) + min;
      };
      
      // Generate more candles to allow for animation
      const points: number[] = new Array(36); // More points for scrolling animation
      let price = 100 + random(-20, 20, 0);
      
      for (let i = 0; i < 36; i++) {
        // Higher volatility for more dramatic visuals
        const volatility = title.includes('Real-Time') ? 15 : 
                           title.includes('Prize') ? 12 : 10;
        
        const change = random(-volatility, volatility, i + 1);
        price += change;
        if (price < 50) price = 50; // Prevent negative prices
        points[i] = price;
      }
      
      return points;
    };
    
    // Generate the pattern data
    const patterns = generatePattern();
    
    // Find min/max for scaling
    const min = Math.min(...patterns);
    const max = Math.max(...patterns);
    const range = max - min;
    
    // Function to scale a price to canvas height
    const scaleY = (price: number) => chartHeight - ((price - min) / range) * chartHeight + 2;
    
    // Animation variables
    let offset = 0;
    let animationFrameId: number;
    const candleCount = Math.floor(canvas.width / (candleWidth + padding)); // Visible candles
    
    // Animation function
    const animate = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate starting index based on offset
      const startIdx = Math.floor(offset) % (patterns.length - candleCount);
      
      // Draw the candlesticks
      for (let i = 0; i < candleCount; i++) {
        const patternIdx = (startIdx + i) % patterns.length;
        const nextIdx = (patternIdx + 1) % patterns.length;
        
        const prevPrice = patterns[patternIdx];
        const price = patterns[nextIdx];
        
        // X position for this candle
        const x = i * (candleWidth + padding);
        
        // Determine if candle is up or down
        const isUp = price >= prevPrice;
        
        // Set color based on direction - fully opaque vibrant colors
        const upColor = isUpcoming ? 'rgba(59, 130, 246, 1)' : 'rgba(34, 197, 94, 1)';
        const downColor = isUpcoming ? 'rgba(99, 102, 241, 1)' : 'rgba(220, 38, 38, 1)';
        
        ctx.fillStyle = isUp ? upColor : downColor;
        
        // Draw rectangle from previous price to current price
        const y1 = scaleY(prevPrice);
        const y2 = scaleY(price);
        const height = Math.max(Math.abs(y2 - y1), 2); // Ensure minimum height for visibility
        
        // Draw candle body with rounded corners for a modern look
        const radius = candleWidth / 3; // More rounded corners
        const y = Math.min(y1, y2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + candleWidth - radius, y);
        ctx.arcTo(x + candleWidth, y, x + candleWidth, y + radius, radius);
        ctx.lineTo(x + candleWidth, y + height - radius);
        ctx.arcTo(x + candleWidth, y + height, x + candleWidth - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.fill();
        
        // Add prominent wicks to all candles
        const wickTop = Math.min(y1, y2) - 5; // Longer wicks
        const wickBottom = Math.max(y1, y2) + 5;
        
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, wickTop);
        ctx.lineTo(x + candleWidth/2, wickBottom);
        ctx.lineWidth = 2; // Thicker wicks
        ctx.strokeStyle = isUp ? upColor : downColor;
        ctx.stroke();
      }
      
      // Update offset for animation
      offset += 0.05; // Slow scrolling speed
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Clean up animation on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [title, seed, isUpcoming]);
  
  return (
    <Card className={`
      ${
        isUpcoming
          ? "bg-gradient-to-br from-[#1e1a42]/90 to-[#1a1333]/90 border-blue-500/10 hover:border-blue-400/30"
          : "bg-gradient-to-br from-[#1a1333]/90 to-[#120d24]/90 border-purple-500/10 hover:border-purple-400/30"
      }
      backdrop-blur-sm border transform transition-all hover:scale-105
      relative overflow-hidden h-full
    `}>
      <CardContent className="p-6 relative">
        {isUpcoming && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/30 z-10">
            <span className="text-xs font-cyber text-blue-400 tracking-wider flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              SOON
            </span>
          </div>
        )}
      
        {/* Animated gradient overlay */}
        <div className={`absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-700 bg-gradient-to-r ${gradient}`} />
        
        {/* Content */}
        <div className="flex items-start space-x-4 mb-4">
          <div className={`
            text-3xl p-2 rounded-lg
            ${isUpcoming ? "text-blue-400" : "text-purple-400"}
          `}>
            {icon}
          </div>
          <div>
            <h3 className={`
              text-lg font-semibold mb-2
              ${isUpcoming ? "text-blue-300" : "text-purple-300"}
            `}>
              {title}
            </h3>
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          </div>
        </div>
        
        {/* Candlestick chart as a more prominent feature - GPU optimized and enlarged */}
        <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden candles-gpu">
          <div className="w-full optimized-animation">
            <canvas 
              ref={canvasRef} 
              width={480} 
              height={60} 
              className="transform translate-y-1 opacity-100"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};