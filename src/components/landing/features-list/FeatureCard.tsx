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
  
  // Draw candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart config
    const chartHeight = canvas.height - 4; // Leave small margins
    const candleWidth = 3;
    const padding = 2;
    
    // Generate candlestick data
    const generatePattern = () => {
      const random = (min: number, max: number, index: number) => {
        // Deterministic random based on seed and index
        const x = Math.sin(seed + index) * 10000;
        return ((x - Math.floor(x)) * (max - min)) + min;
      };
      
      const points: number[] = [];
      let price = 100 + random(-20, 20, 0);
      
      for (let i = 0; i < 30; i++) {
        const volatility = title.includes('Real-Time') ? 8 : 
                          title.includes('Prize') ? 5 : 4;
        
        const change = random(-volatility, volatility, i + 1);
        price += change;
        if (price < 50) price = 50; // Prevent negative prices
        points.push(price);
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
    
    // Draw the candlesticks
    let prevPrice = patterns[0];
    let x = 0;
    
    patterns.forEach((price, i) => {
      if (i === 0) return;
      
      // Determine if candle is up or down
      const isUp = price >= prevPrice;
      
      // Set color based on direction
      const upColor = isUpcoming ? 'rgba(59, 130, 246, 0.5)' : 'rgba(34, 197, 94, 0.5)';
      const downColor = isUpcoming ? 'rgba(99, 102, 241, 0.5)' : 'rgba(220, 38, 38, 0.5)';
      
      ctx.fillStyle = isUp ? upColor : downColor;
      
      // Draw rectangle from previous price to current price
      const y1 = scaleY(prevPrice);
      const y2 = scaleY(price);
      const height = Math.abs(y2 - y1);
      
      ctx.fillRect(x, Math.min(y1, y2), candleWidth, height);
      
      // Add wicks to some candles
      if (i % 3 === 0) {
        const wickTop = Math.min(y1, y2) - 2;
        const wickBottom = Math.max(y1, y2) + 2;
        
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, wickTop);
        ctx.lineTo(x + candleWidth/2, wickBottom);
        ctx.strokeStyle = isUp ? upColor : downColor;
        ctx.stroke();
      }
      
      // Move to next candle position
      x += candleWidth + padding;
      prevPrice = price;
    });
    
    // Add a subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0.2)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        
        {/* Candlestick chart at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden opacity-60">
          <div className="animate-scroll-slow w-[800px]">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={20} 
              className="transform translate-y-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};