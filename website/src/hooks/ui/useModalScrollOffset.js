import { useEffect, useState } from "react";

export default function useModalScrollOffset(modalId = "modal") {
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const modal = document.getElementById(modalId);

    if (!modal) {
      return undefined;
    }

    function handleModalScroll() {
      setScrollOffset(modal.scrollTop);
    }

    handleModalScroll();
    modal.addEventListener("scroll", handleModalScroll, { passive: true });

    return () => modal.removeEventListener("scroll", handleModalScroll);
  }, [modalId]);

  return scrollOffset;
}
