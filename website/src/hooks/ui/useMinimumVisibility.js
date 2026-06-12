import { useEffect, useRef, useState } from "react";

export default function useMinimumVisibility(
  isVisible,
  minimumVisibleMs = 500
) {
  const [shouldRender, setShouldRender] = useState(false);
  const visibleSinceRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isVisible) {
      setShouldRender(true);

      if (!visibleSinceRef.current) {
        visibleSinceRef.current = Date.now();
      }

      return undefined;
    }

    if (!shouldRender) {
      visibleSinceRef.current = null;
      return undefined;
    }

    const elapsed = visibleSinceRef.current
      ? Date.now() - visibleSinceRef.current
      : minimumVisibleMs;
    const remaining = Math.max(minimumVisibleMs - elapsed, 0);

    if (remaining === 0) {
      setShouldRender(false);
      visibleSinceRef.current = null;
      return undefined;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      visibleSinceRef.current = null;
      hideTimeoutRef.current = null;
    }, remaining);

    return undefined;
  }, [isVisible, minimumVisibleMs, shouldRender]);

  return shouldRender;
}
