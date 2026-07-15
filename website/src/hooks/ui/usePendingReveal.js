import { useEffect, useRef, useState } from "react";

export default function usePendingReveal(isPending, durationMs = 320) {
  const [isReveal, setIsReveal] = useState(false);
  const wasPendingRef = useRef(isPending === true);

  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      setIsReveal(true);
      const timeout = setTimeout(() => setIsReveal(false), durationMs);
      wasPendingRef.current = false;
      return () => clearTimeout(timeout);
    }

    wasPendingRef.current = isPending === true;
    return undefined;
  }, [durationMs, isPending]);

  return isReveal;
}
