import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./Carousel.module.css";

export default function Carousel({
  items = [],
  className = "",
  contentClassName = "",
  closeClassName = "",
  dotClassName = "",
  dotActiveClassName = "",
  primaryButtonClassName = "",
  secondaryButtonClassName = "",
  ariaLabel = "Carousel",
  dotsLabel = "Carousel progress",
  closeLabel = "Close",
  previousLabel = "Back",
  nextLabel = "Next",
  completeLabel = "Done",
  getItemKey,
  getItemAriaLabel,
  onClose,
  onComplete,
  renderItem,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(0);
  const [slideDirection, setSlideDirection] = useState("forward");
  const measurementRefs = useRef([]);

  const safeItems = useMemo(() => items.filter(Boolean), [items]);

  useEffect(() => {
    setCurrentIndex((current) =>
      Math.min(current, Math.max(0, safeItems.length - 1))
    );
  }, [safeItems.length]);

  useEffect(() => {
    if (safeItems.length === 0) {
      return;
    }

    const nextMaxHeight = measurementRefs.current.reduce(
      (maxHeight, element) => {
        if (!element) {
          return maxHeight;
        }

        return Math.max(maxHeight, element.offsetHeight);
      },
      0
    );

    setMaxContentHeight(nextMaxHeight);
  }, [safeItems, renderItem]);

  if (safeItems.length === 0 || typeof renderItem !== "function") {
    return null;
  }

  const activeItem = safeItems[currentIndex] || null;
  const isFirstItem = currentIndex === 0;
  const isLastItem = currentIndex === safeItems.length - 1;

  function updateCurrentIndex(nextIndex) {
    setCurrentIndex((current) => {
      const boundedNextIndex = Math.max(
        0,
        Math.min(safeItems.length - 1, nextIndex)
      );

      if (boundedNextIndex === current) {
        return current;
      }

      setSlideDirection(boundedNextIndex > current ? "forward" : "backward");
      return boundedNextIndex;
    });
  }

  function handlePrevious() {
    updateCurrentIndex(currentIndex - 1);
  }

  function handleNext() {
    if (isLastItem) {
      onComplete?.();
      return;
    }

    updateCurrentIndex(currentIndex + 1);
  }

  return (
    <section
      className={`${styles.carousel} ${className}`.trim()}
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {onClose ? (
        <button
          type="button"
          className={`${styles.close} ${closeClassName}`.trim()}
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
        >
          <span className={styles.closeGlyph} aria-hidden="true" />
        </button>
      ) : null}

      <div
        className={`${styles.content} ${contentClassName}`.trim()}
        style={
          maxContentHeight > 0
            ? { minHeight: `${maxContentHeight}px` }
            : undefined
        }
      >
        {activeItem ? (
          <div
            key={getItemKey ? getItemKey(activeItem, currentIndex) : currentIndex}
            className={`${styles.slide} ${
              slideDirection === "backward"
                ? styles.slideBackward
                : styles.slideForward
            }`}
          >
            {renderItem(activeItem, { interactive: true })}
          </div>
        ) : null}
      </div>

      <div className={styles.measurements} aria-hidden="true">
        {safeItems.map((item, index) => (
          <div
            key={getItemKey ? getItemKey(item, index) : index}
            ref={(element) => {
              measurementRefs.current[index] = element;
            }}
            className={styles.measureItem}
          >
            {renderItem(item, { interactive: false })}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.dots} aria-label={dotsLabel}>
          {safeItems.map((item, index) => (
            <button
              key={getItemKey ? getItemKey(item, index) : index}
              type="button"
              className={`${styles.dot} ${dotClassName} ${
                index === currentIndex
                  ? `${styles.dotActive} ${dotActiveClassName}`.trim()
                  : ""
              }`}
              onClick={() => updateCurrentIndex(index)}
              aria-label={
                getItemAriaLabel
                  ? getItemAriaLabel(item, index)
                  : `Show slide ${index + 1}`
              }
            />
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.secondary} ${secondaryButtonClassName}`.trim()}
            onClick={handlePrevious}
            disabled={isFirstItem}
          >
            {previousLabel}
          </button>
          <button
            type="button"
            className={`${styles.primary} ${primaryButtonClassName}`.trim()}
            onClick={handleNext}
          >
            {isLastItem ? completeLabel : nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
