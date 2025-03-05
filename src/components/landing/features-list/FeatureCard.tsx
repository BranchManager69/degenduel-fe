import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '../../ui/Card';

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
  icon, 
  isUpcoming = false 
}) => {
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  // Generate a seed for deterministic but unique patterns for each card
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Handle 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on mouse position
    const rotateY = ((x / rect.width) - 0.5) * 25; // -12.5 to 12.5 degrees
    const rotateX = ((y / rect.height) - 0.5) * -25; // 12.5 to -12.5 degrees
    
    setRotation({ x: rotateX, y: rotateY });
  };
  
  // Reset rotation on mouse leave
  const handleMouseLeave = () => {
    setHovered(false);
    setRotation({ x: 0, y: 0 });
  };
  
  // Draw candlestick chart with animated scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set chart dimensions to fill the entire canvas
    const chartHeight = canvas.height;
    const candleWidth = 8; // Wider candles
    const padding = 3; // Spacing between candles
    
    // Generate candlestick data
    const generatePattern = () => {
      // Optimized random function
      const random = (min: number, max: number, index: number) => {
        // Deterministic random based on seed and index
        const x = Math.sin(seed + index) * 10000;
        return ((x - Math.floor(x)) * (max - min)) + min;
      };
      
      // Generate more candles to allow for animation
      const points: number[] = new Array(42);
      let price = 100 + random(-20, 20, 0);
      
      for (let i = 0; i < 42; i++) {
        // Higher volatility for more dramatic visuals
        const volatility = title.includes('Real-Time') ? 20 : 
                           title.includes('Prize') ? 16 : 12;
        
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
    const min = Math.min(...patterns) - 10; // Add padding
    const max = Math.max(...patterns) + 10;
    const range = max - min;
    
    // Function to scale a price to canvas height
    const scaleY = (price: number) => chartHeight - ((price - min) / range) * chartHeight;
    
    // Animation variables
    let offset = 0;
    let animationFrameId: number;
    const candleCount = Math.floor(canvas.width / (candleWidth + padding));
    
    // Animation function
    const animate = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle grid lines
      ctx.strokeStyle = isUpcoming ? 'rgba(59, 130, 246, 0.1)' : 'rgba(126, 34, 206, 0.1)';
      ctx.lineWidth = 0.5;
      
      // Draw horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw vertical grid lines
      for (let i = 0; i <= candleCount; i++) {
        const x = (canvas.width / candleCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, chartHeight);
        ctx.stroke();
      }
      
      // Add dark tinted background to the bottom portion
      const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
      if (isUpcoming) {
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');
      } else {
        gradient.addColorStop(0, 'rgba(126, 34, 206, 0)');
        gradient.addColorStop(1, 'rgba(126, 34, 206, 0.1)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, chartHeight);
      
      // Calculate starting index based on offset
      const startIdx = Math.floor(offset) % (patterns.length - candleCount);
      
      // Calculate line points for area fill
      const linePoints: {x: number, y: number}[] = [];
      
      // Draw the candlesticks
      for (let i = 0; i < candleCount; i++) {
        const patternIdx = (startIdx + i) % patterns.length;
        const nextIdx = (patternIdx + 1) % patterns.length;
        
        const prevPrice = patterns[patternIdx];
        const price = patterns[nextIdx];
        
        // Store points for line graph
        linePoints.push({
          x: i * (candleWidth + padding) + candleWidth/2,
          y: scaleY(price)
        });
        
        // X position for this candle
        const x = i * (candleWidth + padding);
        
        // Determine if candle is up or down
        const isUp = price >= prevPrice;
        
        // Set color based on direction with glow effect
        const upColorBase = isUpcoming ? 'rgba(59, 130, 246, 1)' : 'rgba(34, 197, 94, 1)';
        const downColorBase = isUpcoming ? 'rgba(99, 102, 241, 1)' : 'rgba(220, 38, 38, 1)';
        
        // Draw shadow first for glow effect
        ctx.shadowColor = isUp ? upColorBase : downColorBase;
        ctx.shadowBlur = hovered ? 8 : 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw rectangle from previous price to current price
        const y1 = scaleY(prevPrice);
        const y2 = scaleY(price);
        const height = Math.max(Math.abs(y2 - y1), 2);
        
        // Draw candle body with rounded corners
        const radius = candleWidth / 3;
        const y = Math.min(y1, y2);
        
        ctx.fillStyle = isUp ? upColorBase : downColorBase;
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
        
        // Reset shadow for wicks
        ctx.shadowBlur = 0;
        
        // Add prominent wicks to all candles
        const wickTop = Math.min(y1, y2) - 6;
        const wickBottom = Math.max(y1, y2) + 6;
        
        ctx.beginPath();
        ctx.moveTo(x + candleWidth/2, wickTop);
        ctx.lineTo(x + candleWidth/2, wickBottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = isUp ? upColorBase : downColorBase;
        ctx.stroke();
      }
      
      // Draw area under the line
      if (linePoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(linePoints[0].x, chartHeight);
        
        // First point
        ctx.lineTo(linePoints[0].x, linePoints[0].y);
        
        // Connect all points
        for (let i = 1; i < linePoints.length; i++) {
          ctx.lineTo(linePoints[i].x, linePoints[i].y);
        }
        
        // Close the path to bottom right then bottom left
        ctx.lineTo(linePoints[linePoints.length-1].x, chartHeight);
        ctx.lineTo(linePoints[0].x, chartHeight);
        
        // Fill with gradient
        const areaGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        if (isUpcoming) {
          areaGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else {
          areaGradient.addColorStop(0, 'rgba(126, 34, 206, 0.2)');
          areaGradient.addColorStop(1, 'rgba(126, 34, 206, 0)');  
        }
        
        ctx.fillStyle = areaGradient;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Update offset for animation - speed up when hovered
      offset += hovered ? 0.1 : 0.05;
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Clean up animation on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [title, seed, isUpcoming, hovered]);
  
  return (
    <div 
      ref={cardRef}
      className={`
        perspective-1000 transform-style-3d cursor-pointer
        transition-transform duration-700 h-full
      `}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d'
      }}
    >
      <Card className={`
        ${
          isUpcoming
            ? "bg-gradient-to-br from-[#1e1a42]/80 to-[#1a1333]/90 border-blue-500/20"
            : "bg-gradient-to-br from-[#1a1333]/80 to-[#120d24]/90 border-purple-500/20"
        }
        backdrop-blur-sm border rounded-xl
        overflow-hidden h-full
        transition-all duration-500
        ${hovered ? 'shadow-xl shadow-purple-500/20' : ''}
        transform-style-3d
      `}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Dynamic background with canvas as full backdrop */}
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={400}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
          />
          
          {/* Overlay gradient for better text contrast */}
          <div className={`
            absolute inset-0 
            bg-gradient-to-b 
            ${isUpcoming ? 
              'from-[#1e1a42]/90 via-[#1e1a42]/60 to-transparent' : 
              'from-[#1a1333]/90 via-[#1a1333]/60 to-transparent'
            }
          `}></div>
        </div>
        
        <CardContent className="p-6 relative z-10">
          {isUpcoming && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 z-10 backdrop-blur-sm">
              <span className="text-xs font-cyber text-blue-400 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                SOON
              </span>
            </div>
          )}
        
          {/* Title with 3D depth effect */}
          <div 
            className="mb-3"
            style={{ 
              transform: 'translateZ(30px)',
              transformStyle: 'preserve-3d' 
            }}
          >
            <h3 className={`
              text-xl font-bold mb-1 flex items-center
              ${isUpcoming ? "text-blue-300" : "text-purple-300"}
            `}>
              <span className={`
                mr-3 text-2xl
                ${isUpcoming ? "text-blue-400" : "text-purple-400"}
              `}>
                {icon}
              </span>
              {title}
            </h3>
          </div>
          
          {/* Description with slight 3D effect */}
          <div
            className="mb-8"
            style={{ 
              transform: 'translateZ(20px)',
              transformStyle: 'preserve-3d'
            }}
          >
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          </div>
          
          {/* Interactive element */}
          <div 
            className={`
              absolute bottom-4 right-4 z-20
              transition-all duration-300 ease-in-out
              ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
            style={{ 
              transform: `translateZ(40px) ${hovered ? 'scale(1)' : 'scale(0.9)'}`, 
              transformStyle: 'preserve-3d'
            }}
          >
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-medium
              flex items-center gap-1.5
              ${isUpcoming ? 
                'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 
                'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }
              backdrop-blur-sm
            `}>
              <span className={`
                w-1.5 h-1.5 rounded-full animate-pulse
                ${isUpcoming ? 'bg-blue-400' : 'bg-purple-400'}
              `}></span>
              Explore
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};