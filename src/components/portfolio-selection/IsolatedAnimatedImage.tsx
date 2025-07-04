import React, { useEffect, useRef } from 'react';

interface IsolatedAnimatedImageProps {
  src: string;
  alt: string;
}

// This component creates the image element OUTSIDE of React's control
// to prevent any re-renders from affecting the animation
export const IsolatedAnimatedImage: React.FC<IsolatedAnimatedImageProps> = ({ src, alt }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCreatedImage = useRef(false);
  
  useEffect(() => {
    if (!containerRef.current || hasCreatedImage.current) return;
    
    // Create image element manually, outside of React
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'absolute inset-0 w-full h-full object-cover';
    img.style.cssText = `
      object-position: center center;
      animation: bannerScan 60s ease-in-out infinite;
      will-change: object-position;
      transform: translateZ(0);
      backface-visibility: hidden;
    `;
    
    containerRef.current.appendChild(img);
    hasCreatedImage.current = true;
    
    // Never cleanup - let the image stay there
  }, []); // Empty deps - only run once
  
  return <div ref={containerRef} className="absolute inset-0" />;
};

IsolatedAnimatedImage.displayName = 'IsolatedAnimatedImage';