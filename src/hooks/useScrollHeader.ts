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

      // Determine if we should be in compact mode
      const shouldBeCompact = currentScroll > threshold;

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
      timeoutId = setTimeout(handleScroll, 10); // Small delay for smooth performance
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
