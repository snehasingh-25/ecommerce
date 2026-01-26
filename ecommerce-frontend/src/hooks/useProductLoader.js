import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for managing product loading with time-based animation trigger
 * 
 * Only shows loading animation if loading takes >= 1 second (1000ms)
 * 
 * @param {boolean} isLoading - Current loading state
 * @returns {object} - { showLoader: boolean, loadingStartTime: number }
 */
export function useProductLoader(isLoading) {
  const [showLoader, setShowLoader] = useState(false);
  const loadingStartTime = useRef(null);
  const minLoadTimeReached = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading
      if (loadingStartTime.current === null) {
        loadingStartTime.current = Date.now();
        minLoadTimeReached.current = false;

        // Set timeout to show loader after 1 second
        timeoutRef.current = setTimeout(() => {
          minLoadTimeReached.current = true;
          setShowLoader(true);
        }, 1000);
      }
    } else {
      // Loading completed
      if (loadingStartTime.current !== null) {
        const loadDuration = Date.now() - loadingStartTime.current;

        // Clear the timeout if it hasn't fired yet
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // If loading was fast (< 1 second), don't show loader at all
        if (loadDuration < 1000) {
          setShowLoader(false);
        } else {
          // Loading took >= 1 second, loader is already showing
          // Keep it showing until animation completes
          // The loader component will handle the fade-out
        }

        // Reset for next load
        loadingStartTime.current = null;
      } else {
        // Not loading and wasn't loading before
        setShowLoader(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { 
    showLoader, 
    loadingStartTime: loadingStartTime.current 
  };
}
