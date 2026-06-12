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

    const focusInput = () => {
      const input = document.getElementById(elementId);

      if (input) {
        input.focus();
        onFocused?.();
      }
    };

    const timeout = setTimeout(focusInput, 0);

    return () => clearTimeout(timeout);
  }, [elementId, enabled, onFocused]);
}
