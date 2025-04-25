import { useCallback, useEffect } from "react";

/**
 * Hook to handle scrollbar visibility
 * Shows the scrollbar during scrolling and hides it after a delay
 */
export const useScrollbarVisibility = (delay: number = 1500) => {
  const handleScroll = useCallback(() => {
    // When scrolling starts, add the scrolling class
    document.documentElement.classList.add('scrolling');
    
    // Remove the class after scrolling stops
    const removeScrollingClass = () => {
      document.documentElement.classList.remove('scrolling');
    };
    
    // Use requestAnimationFrame to ensure this runs after the current frame
    window.requestAnimationFrame(() => {
      window.setTimeout(removeScrollingClass, delay);
    });
  }, [delay]);

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also show scrollbar on hover over the document edges
    const handleMouseEdge = (e: MouseEvent) => {
      const edgeThreshold = 20;
      
      // Check if the mouse is near an edge
      if (
        e.clientX < edgeThreshold || 
        e.clientX > window.innerWidth - edgeThreshold ||
        e.clientY < edgeThreshold || 
        e.clientY > window.innerHeight - edgeThreshold
      ) {
        document.documentElement.classList.add('scrolling');
      } else {
        // Only remove if we're not actually scrolling
        if (!document.documentElement.classList.contains('scrolling-active')) {
          document.documentElement.classList.remove('scrolling');
        }
      }
    };
    
    // Track active scrolling
    let scrollingTimeoutId: number;
    const trackActiveScrolling = () => {
      // Mark as actively scrolling
      document.documentElement.classList.add('scrolling-active');
      
      // Clear any existing timeout
      window.clearTimeout(scrollingTimeoutId);
      
      // Set timeout to remove active scrolling class
      scrollingTimeoutId = window.setTimeout(() => {
        document.documentElement.classList.remove('scrolling-active');
      }, 300);
    };
    
    window.addEventListener('mousemove', handleMouseEdge, { passive: true });
    window.addEventListener('wheel', trackActiveScrolling, { passive: true });
    document.addEventListener('touchmove', trackActiveScrolling, { passive: true });
    
    // Initial check - make scrollbar visible on page load for a moment
    document.documentElement.classList.add('scrolling');
    setTimeout(() => {
      document.documentElement.classList.remove('scrolling');
    }, 2000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseEdge);
      window.removeEventListener('wheel', trackActiveScrolling);
      document.removeEventListener('touchmove', trackActiveScrolling);
      window.clearTimeout(scrollingTimeoutId);
    };
  }, [handleScroll]);
  
  // This hook doesn't return any values since it only adds/removes classes
  return null;
};