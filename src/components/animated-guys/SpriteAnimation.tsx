// src/components/animated-guys/SpriteAnimation.tsx

import React, { useEffect, useRef, useState } from 'react';
// Import the images directly
import greenSpriteSheet from './guys/white_buy_guy.png';
import redSpriteSheet from './guys/black_sell_guy.png';
// For future expansion, you can add more sprite sheets:
// import blueSpriteSheet from './guys/basic_guy.png';
// import blackBuySpriteSheet from './guys/black_buy_guy.png';
// import whiteSellSpriteSheet from './guys/white_sell_guy.png';

interface SpriteAnimationProps {
  type: 'green' | 'red'; // Add new types here when you add sprite sheets
  width?: number;
  height?: number;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
  type,
  width = 192,
  height = 256,
  fps = 10,
  className = '',
  style = {},
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [processedSpriteSheet, setProcessedSpriteSheet] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Ref for offscreen canvas

  const ROWS = 3;
  const COLS = 4;
  const TOTAL_FRAMES = ROWS * COLS;
  
  const sourceSpriteSheet = type === 'green' ? greenSpriteSheet : redSpriteSheet;

  // Process the sprite sheet to remove background
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Needed if image isn't hosted locally
    img.src = sourceSpriteSheet;
    img.onload = () => {
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Size canvas to image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Remove #414141 background
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Check RGB values for #414141 (decimal 65)
          if (data[i] === 65 && data[i + 1] === 65 && data[i + 2] === 65) {
            data[i + 3] = 0; // Make pixel transparent
          }
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Set the processed image as data URL
        setProcessedSpriteSheet(canvas.toDataURL());
      } catch (e) {
        console.error("Error processing sprite sheet for transparency:", e);
        // Fallback to original if canvas processing fails (e.g., CORS)
        setProcessedSpriteSheet(sourceSpriteSheet);
      }
    };
    img.onerror = () => {
        console.error("Error loading sprite sheet image.");
        setProcessedSpriteSheet(sourceSpriteSheet); // Fallback on error
    }

  }, [sourceSpriteSheet]); // Re-run when type changes

  // Animation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % TOTAL_FRAMES);
    }, 1000 / fps);
    
    return () => clearInterval(interval);
  }, [fps]);
  
  // Calculate position in sprite sheet
  const row = Math.floor(frameIndex / COLS);
  const col = frameIndex % COLS;
  
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'hidden',
    position: 'relative',
    ...style
  };
  
  const scaleX = width * COLS;
  const scaleY = height * ROWS;
  
  const spriteStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${scaleX}px`,
    height: `${scaleY}px`,
    backgroundImage: processedSpriteSheet ? `url(${processedSpriteSheet})` : 'none', // Use processed sheet
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${scaleX}px ${scaleY}px`,
    imageRendering: 'pixelated',
    left: `${-col * width}px`,
    top: `${-row * height}px`,
  };

  // Don't render until processed sheet is ready
  if (!processedSpriteSheet) {
      return null; // Or a loading indicator
  }
  
  return (
    <div className={`sprite-animation-container ${className}`} style={containerStyle}>
      <div style={spriteStyle} />
    </div>
  );
};

export default SpriteAnimation;