// src/hooks/useDebounce.ts

import { useEffect, useState } from "react";

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Debounce the value to prevent multiple calls to the API

  // This is useful when the user is typing in a search input
  // and we don't want to make multiple API calls until the user has stopped typing
  // (e.g. when searching for a user in the admin balance manager)
  //
  // This is a simple implementation of the debounce pattern
  // It uses a setTimeout to delay the setting of the debounced value
  // and a clearTimeout to cancel the timeout if the value changes before the timeout completes
  // This ensures that the debounced value is only set once, after the delay, and not multiple times
  // if the user is typing quickly
  //
  // The delay is the number of milliseconds to wait before setting the debounced value
  // The value is the value to debounce
  // The debounced value is the value that is set after the delay
  //
  // The useEffect hook is used to set up the debounce
  // It creates a timeout that sets the debounced value after the delay
  // and returns a cleanup function that clears the timeout when the component unmounts or the value changes
  // This ensures that the debounce is only active while the component is mounted and the value is changing
  // and not after the component unmounts or the value changes

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
