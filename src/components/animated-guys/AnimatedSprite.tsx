import React, { useState, useEffect } from 'react';

interface AnimatedSpriteProps {
  sprite: 'green' | 'red';
  width?: number;
  height?: number;
  animationSpeed?: number; // in ms
  frameCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  sprite,
  width = 128,
  height = 128,
  animationSpeed = 150,
  frameCount = 4, // Simulated frames since they're static images
  className = '',
  style = {},
}) => {
  const [frame, setFrame] = useState(0);
  
  // The sprite images are static, so we'll create a bobbing animation effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % frameCount);
    }, animationSpeed);
    
    return () => clearInterval(intervalId);
  }, [frameCount, animationSpeed]);

  // Get the appropriate sprite image
  const spriteImage = sprite === 'green' 
    ? '/src/components/animated-guys/degen-green.png'
    : '/src/components/animated-guys/degen-red.png';
  
  // Calculate translation based on current frame for bobbing effect
  const translateY = frame % 2 === 0 ? 0 : -5;
  const scale = 1 + (frame % 2) * 0.05;
  
  const animationStyle: React.CSSProperties = {
    width,
    height,
    backgroundImage: `url(${spriteImage})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transform: `translateY(${translateY}px) scale(${scale})`,
    transition: `transform ${animationSpeed}ms ease-in-out`,
    ...style,
  };

  return (
    <div className={`animated-sprite ${className}`} style={animationStyle} />
  );
};

export default AnimatedSprite;