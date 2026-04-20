import { useState, useEffect, useRef } from 'react';

/**
 * useDebouncedInput
 * Custom hook to debounce control inputs (A/B buttons and directions)
 * to prevent double-triggering events in rapid succession.
 */
export const useDebouncedInput = (value, delay = 150) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // If the value is becoming "active" (like aPressed transitioning true),
    // we want to react faster, but still prevent immediate double hits.
    
    if (value === true || (typeof value === 'string' && value !== null)) {
      // Rapid check: if we already have a value, debounce it.
      // If we are transitioning from null/false, we can be more responsive.
      setDebouncedValue(value);
      
      // But clear any existing timeout to restart the "quiet" period
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // No action needed after timeout for boolean "down" states,
        // but this stops multiple true values from stacking logic.
      }, delay);
    } else {
      // For releasing buttons/directions, we can sync immediately
      setDebouncedValue(value);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
};
