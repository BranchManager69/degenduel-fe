import { useEffect, useRef } from 'react';

/**
 * Custom hook for handling setInterval with immediate execution on first render
 * @param callback Function to call on each interval
 * @param delay Delay in milliseconds, or null to pause the interval
 * @param immediate Whether to run the callback immediately on mount
 */
export function useInterval(
  callback: () => void, 
  delay: number | null,
  immediate: boolean = false
) {
  const savedCallback = useRef<(() => void) | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Execute callback immediately if requested
  useEffect(() => {
    if (immediate && savedCallback.current) {
      savedCallback.current();
    }
  }, [immediate]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;
    
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}