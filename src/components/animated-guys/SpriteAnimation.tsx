import React, { useState, useEffect } from 'react';
// Import the images directly
import greenSpriteSheet from './degen-green.png';
import redSpriteSheet from './degen-red.png';

interface SpriteAnimationProps {
  type: 'green' | 'red';
  width?: number;
  height?: number;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
  type,
  width = 64,
  height = 64,
  fps = 10,
  className = '',
  style = {},
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const ROWS = 3;
  const COLS = 4;
  const TOTAL_FRAMES = ROWS * COLS;
  
  // Select the appropriate sprite sheet
  const spriteSheet = type === 'green' ? greenSpriteSheet : redSpriteSheet;
  
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
  
  // Calculate the scale factor to size the sprite sheet correctly
  const scaleX = width * COLS;
  const scaleY = height * ROWS;
  
  const spriteStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${scaleX}px`,
    height: `${scaleY}px`,
    backgroundImage: `url(${spriteSheet})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${scaleX}px ${scaleY}px`,
    imageRendering: 'pixelated',
    left: `${-col * width}px`,
    top: `${-row * height}px`,
  };
  
  return (
    <div className={`sprite-animation-container ${className}`} style={containerStyle}>
      <div style={spriteStyle} />
    </div>
  );
};

export default SpriteAnimation;