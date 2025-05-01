import React, { useEffect, useRef, useState } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number; // How much of the element needs to be visible
  rootMargin?: string; // Margin around the root
}

export const LazyLoad: React.FC<LazyLoadProps> = ({ 
  children, 
  placeholder = <div className="animate-pulse bg-dark-400/20 rounded h-full w-full"></div>,
  threshold = 0.1,
  rootMargin = "100px" // Load a bit before element comes into view
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className="h-full">
      {isVisible ? children : placeholder}
    </div>
  );
};