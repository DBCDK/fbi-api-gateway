import { useEffect, useRef } from "react";

export default function useStableSWRData({
  data,
  enabled = true,
  cacheKey = "",
  hasMeaningfulData = (value) => Boolean(value),
}) {
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      previousDataRef.current = null;
      return;
    }

    if (!hasMeaningfulData(data)) {
      return;
    }

    previousDataRef.current = {
      key: cacheKey,
      data,
    };
  }, [cacheKey, data, enabled, hasMeaningfulData]);

  if (data) {
    return data;
  }

  if (previousDataRef.current?.key === cacheKey) {
    return previousDataRef.current.data;
  }

  return null;
}
