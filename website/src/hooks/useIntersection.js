import { useState, useEffect } from "react";
import debounce from "lodash/debounce";

export default function useIntersection(element, rootMargin) {
  const [isVisible, setState] = useState(false);

  useEffect(() => {
    const handleObservation = debounce(function (entries) {
      setState(entries.some((entry) => entry.isIntersecting));
    }, 100);

    const observer = new IntersectionObserver(handleObservation, {
      rootMargin,
    });

    element && observer.observe(element);

    return () => element && observer.unobserve(element);
  }, [element]);

  return isVisible;
}
