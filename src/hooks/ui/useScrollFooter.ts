import { useCallback, useEffect, useState } from "react";

interface ScrollFooterState {
  isCompact: boolean;
  scrollDirection: "up" | "down" | null;
  scrolledDistance: number;
}

export const useScrollFooter = (threshold: number = 50) => {
  // Check for Storybook environment mock
  if (typeof window !== 'undefined' && 'useScrollFooterMock' in window && typeof (window as any).useScrollFooterMock === 'function') {
    const mockState = (window as any).useScrollFooterMock();
    return {
      isCompact: mockState.isCompact,
      scrollDirection: mockState.scrollDirection,
      scrolledDistance: 0
    };
  }
  
  // Normal implementation for actual app
  const [state, setState] = useState<ScrollFooterState>({
    isCompact: true, // Start compact by default
    scrollDirection: null,
    scrolledDistance: 0,
  });

  const handleScroll = useCallback(() => {
    const currentScroll = window.scrollY;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const distanceFromBottom = maxScroll - currentScroll;

    setState((prevState) => {
      // If we're near the bottom, expand the footer
      const shouldBeCompact = distanceFromBottom > threshold;

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
