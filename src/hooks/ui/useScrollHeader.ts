import { useCallback, useEffect, useState } from "react";

interface ScrollHeaderState {
  isCompact: boolean;
  scrollDirection: "up" | "down" | null;
  scrolledDistance: number;
}

export const useScrollHeader = (threshold: number = 50) => {
  const [state, setState] = useState<ScrollHeaderState>({
    isCompact: false,
    scrollDirection: null,
    scrolledDistance: 0,
  });

  const handleScroll = useCallback(() => {
    const currentScroll = window.scrollY;

    setState((prevState) => {
      // Don't update state if we're at the top
      if (currentScroll === 0) {
        return {
          isCompact: false,
          scrollDirection: null,
          scrolledDistance: 0,
        };
      }

      // Use hysteresis to prevent rapid switching
      // Different thresholds for compact on/off to create a "dead zone"
      const compactOnThreshold = threshold;
      const compactOffThreshold = threshold - 20; // 20px buffer zone
      
      let shouldBeCompact = prevState.isCompact;
      
      if (!prevState.isCompact && currentScroll > compactOnThreshold) {
        // Switch to compact when scrolling down past threshold
        shouldBeCompact = true;
      } else if (prevState.isCompact && currentScroll < compactOffThreshold) {
        // Switch to normal when scrolling up past lower threshold
        shouldBeCompact = false;
      }

      // Only update state if there's a meaningful change
      if (
        prevState.isCompact !== shouldBeCompact ||
        Math.abs(prevState.scrolledDistance - currentScroll) > 5
      ) {
        return {
          isCompact: shouldBeCompact,
          scrollDirection:
            prevState.scrolledDistance < currentScroll ? "down" : "up",
          scrolledDistance: currentScroll,
        };
      }

      return prevState;
    });
  }, [threshold]);

  useEffect(() => {
    // Debounced scroll handler
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 50); // Increased delay to prevent flickering
    };

    window.addEventListener("scroll", debouncedScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", debouncedScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleScroll]);

  return state;
};
