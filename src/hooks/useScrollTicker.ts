import { useCallback, useEffect, useState } from "react";

interface ScrollTickerState {
  isExpanded: boolean;
  scrollDirection: "up" | "down" | null;
  scrolledDistance: number;
}

/**
 * Custom hook for ticker expansion based on scroll position
 * 
 * @param threshold Scroll threshold after which the ticker expands/contracts
 * @returns Object with isExpanded flag and other scroll information
 */
export const useScrollTicker = (threshold: number = 20) => {
  const [state, setState] = useState<ScrollTickerState>({
    isExpanded: true,  // Start expanded when at top
    scrollDirection: null,
    scrolledDistance: 0,
  });

  const handleScroll = useCallback(() => {
    const currentScroll = window.scrollY;

    setState((prevState) => {
      // At the top, expand ticker
      if (currentScroll <= threshold) {
        return {
          isExpanded: true,
          scrollDirection: prevState.scrolledDistance > currentScroll ? "up" : "down",
          scrolledDistance: currentScroll,
        };
      }

      // When scrolled down, contract ticker
      const shouldBeExpanded = currentScroll <= threshold;

      // Only update state if there's a meaningful change
      if (
        prevState.isExpanded !== shouldBeExpanded ||
        Math.abs(prevState.scrolledDistance - currentScroll) > 5
      ) {
        return {
          isExpanded: shouldBeExpanded,
          scrollDirection:
            prevState.scrolledDistance < currentScroll ? "down" : "up",
          scrolledDistance: currentScroll,
        };
      }

      return prevState;
    });
  }, [threshold]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother performance
    let rafId: number;
    let isScrolling = false;

    const onScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        rafId = requestAnimationFrame(() => {
          handleScroll();
          isScrolling = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll]);

  return state;
};