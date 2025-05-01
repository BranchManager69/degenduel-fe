// src/components/shared/LoadingFallback.tsx

import React, { useState, useEffect } from 'react';
import SpriteAnimation from '../animated-guys/SpriteAnimation';

interface LoadingFallbackProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'minimal' | 'full';
}

/**
 * Shared loading fallback component that displays animated degen characters
 * Use this component for all Suspense fallbacks and loading states to maintain consistency
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...',
  size = 'medium',
  variant = 'default'
}) => {
  // Choose a random character for variety
  const [character, setCharacter] = useState<'green' | 'red'>('green');
  
  useEffect(() => {
    // Randomly select a character when component mounts
    setCharacter(Math.random() > 0.5 ? 'green' : 'red');
    
    // For future expansion with more characters:
    // const characters: ('green' | 'red' /* | 'blue' | 'yellow' */)[] = ['green', 'red' /* , 'blue', 'yellow' */];
    // const randomIndex = Math.floor(Math.random() * characters.length);
    // setCharacter(characters[randomIndex]);
  }, []);

  // Configure size based on the size prop
  const dimensions = {
    small: { width: 40, height: 40 },
    medium: { width: 60, height: 60 },
    large: { width: 80, height: 80 }
  };

  // Minimal variant just shows the spinning character
  if (variant === 'minimal') {
    return (
      <div className="flex justify-center items-center p-2">
        <div className="animate-spin">
          <SpriteAnimation
            type={character}
            width={dimensions[size].width}
            height={dimensions[size].height}
            fps={12}
          />
        </div>
      </div>
    );
  }
  
  // Full variant with more elaborate animation and branding
  if (variant === 'full') {
    return (
      <div className="flex flex-col justify-center items-center p-6 bg-dark-200/70 backdrop-blur-sm rounded-lg border border-brand-500/30 max-w-md mx-auto">
        <div className="mb-4 relative">
          {/* Character running in place */}
          <div className="animate-bounce">
            <SpriteAnimation
              type={character}
              width={dimensions.large.width}
              height={dimensions.large.height}
              fps={15}
            />
          </div>
          
          {/* Add a pulsing glow effect */}
          <div className="absolute inset-0 bg-brand-500/20 rounded-full filter blur-xl animate-pulse -z-10"></div>
        </div>
        
        <h3 className="text-xl font-cyber text-brand-400 mb-2">DegenDuel</h3>
        <p className="text-gray-300 text-sm font-mono">{message}</p>
        
        {/* Loading progress bar effect */}
        <div className="w-64 h-1 bg-dark-300 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-400 to-cyber-400 animate-loadingBar"></div>
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="flex flex-col justify-center items-center p-4">
      <div className="relative mb-2">
        {/* Animated character */}
        <SpriteAnimation
          type={character}
          width={dimensions[size].width}
          height={dimensions[size].height}
          fps={10}
        />
        
        {/* Optional pulsing circle behind character */}
        <div className="absolute inset-0 bg-brand-500/10 rounded-full filter blur-md animate-pulse -z-10"></div>
      </div>
      
      <p className="text-gray-300 text-sm font-mono mt-2">{message}</p>
    </div>
  );
};

export default LoadingFallback;