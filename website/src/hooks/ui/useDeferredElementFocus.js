import { useEffect } from "react";

export default function useDeferredElementFocus({
  enabled,
  elementId,
  onFocused,
}) {
  useEffect(() => {
    if (!enabled || !elementId) {
      return undefined;
    }

    let frameId = null;
    let timeoutId = null;
    let attempts = 0;

    const focusInput = () => {
      const input = document.getElementById(elementId);

      if (input) {
        input.focus();
        onFocused?.();
        return;
      }

      attempts += 1;

      if (attempts < 8) {
        frameId = window.requestAnimationFrame(focusInput);
      }
    };

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(focusInput);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [elementId, enabled, onFocused]);
}
