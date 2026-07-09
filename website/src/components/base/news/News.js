import { useEffect, useMemo, useRef, useState } from "react";

import Link from "@/components/base/link";
import Text from "@/components/base/text";
import Title from "@/components/base/title";
import { WHATS_NEW_RESTORED_EVENT } from "@/components/whats-new/utils";

import styles from "./News.module.css";

function getStorageKey(newsId) {
  return `fbi:news:${newsId}:dismissed`;
}

function renderBody(body = "", { interactive = true } = {}) {
  if (typeof body !== "string") {
    return body;
  }

  const parts = [];
  let lastIndex = 0;
  let cursor = 0;

  while (cursor < body.length) {
    const labelStart = body.indexOf("[", cursor);

    if (labelStart === -1) {
      break;
    }

    const labelEnd = body.indexOf("]", labelStart + 1);
    const hrefStart = body.indexOf("(", labelEnd + 1);
    const hrefEnd = body.indexOf(")", hrefStart + 1);

    const hasValidStructure =
      labelEnd > labelStart &&
      hrefStart === labelEnd + 1 &&
      hrefEnd > hrefStart;

    if (!hasValidStructure) {
      cursor = labelStart + 1;
      continue;
    }

    const label = body.slice(labelStart + 1, labelEnd);
    const href = body.slice(hrefStart + 1, hrefEnd);
    const isValidHref =
      label.trim() !== "" &&
      /^https?:\/\//.test(href) &&
      !/\s/.test(href);

    if (!isValidHref) {
      cursor = labelStart + 1;
      continue;
    }

    if (labelStart > lastIndex) {
      parts.push(body.slice(lastIndex, labelStart));
    }

    parts.push(
      interactive ? (
        <Link
          key={`${href}-${labelStart}`}
          href={href}
          target="_blank"
          underline
        >
          {label}
        </Link>
      ) : (
        label
      )
    );

    lastIndex = hrefEnd + 1;
    cursor = hrefEnd + 1;
  }

  if (lastIndex < body.length) {
    parts.push(body.slice(lastIndex));
  }

  return parts.length > 0 ? parts : body;
}

export default function News({ newsId, slides = [], className = "" }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(0);
  const measurementRefs = useRef([]);

  useEffect(() => {
    if (!newsId) {
      setIsHydrated(true);
      return;
    }

    try {
      const isStoredDismissed =
        localStorage.getItem(getStorageKey(newsId)) === "true";
      setIsDismissed(isStoredDismissed);
    } catch {}

    setIsHydrated(true);
  }, [newsId]);

  useEffect(() => {
    function handleNewsRestored(event) {
      if (event?.detail?.newsId !== newsId) {
        return;
      }

      setIsDismissed(false);
      setCurrentIndex(0);
    }

    window.addEventListener(WHATS_NEW_RESTORED_EVENT, handleNewsRestored);

    return () => {
      window.removeEventListener(WHATS_NEW_RESTORED_EVENT, handleNewsRestored);
    };
  }, [newsId]);

  const safeSlides = useMemo(
    () => slides.filter((slide) => slide?.title && slide?.body),
    [slides]
  );

  useEffect(() => {
    if (!isHydrated || safeSlides.length === 0) {
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
  }, [isHydrated, safeSlides]);

  const activeSlide = safeSlides[currentIndex] || null;
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === safeSlides.length - 1;

  function dismissNews() {
    setIsDismissed(true);

    if (!newsId) {
      return;
    }

    try {
      localStorage.setItem(getStorageKey(newsId), "true");
    } catch {}
  }

  function handlePrevious() {
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  function handleNext() {
    if (isLastSlide) {
      dismissNews();
      return;
    }

    setCurrentIndex((current) => Math.min(safeSlides.length - 1, current + 1));
  }

  if (!isHydrated || isDismissed || safeSlides.length === 0 || !activeSlide) {
    return null;
  }

  return (
    <aside
      className={`${styles.wrap} ${className}`}
      aria-live="polite"
      aria-label="News"
    >
      <button
        type="button"
        className={styles.close}
        onClick={dismissNews}
        aria-label="Close news"
        title="Close"
      >
        <span className={styles.closeGlyph} aria-hidden="true" />
      </button>

      <div
        className={styles.content}
        style={
          maxContentHeight > 0
            ? { minHeight: `${maxContentHeight}px` }
            : undefined
        }
      >
        <div className={styles.badge}>
          <span className={styles.icon} aria-hidden="true">
            {activeSlide.icon || "i"}
          </span>
          <span className={styles.badgeText}>
            {activeSlide.eyebrow || "What is new"}
          </span>
        </div>

        <Title as="h3" type="title7" className={styles.title}>
          {activeSlide.title}
        </Title>
        <Text type="text1" className={styles.body}>
          {renderBody(activeSlide.body)}
        </Text>
      </div>

      <div className={styles.measurements} aria-hidden="true">
        {safeSlides.map((slide, index) => (
          <div
            key={`${slide.title}-${index}-measure`}
            ref={(element) => {
              measurementRefs.current[index] = element;
            }}
            className={styles.measureCard}
          >
            <div className={styles.badge}>
              <span className={styles.icon}>{slide.icon || "i"}</span>
              <span className={styles.badgeText}>
                {slide.eyebrow || "What is new"}
              </span>
            </div>

            <Title as="h3" type="title7" className={styles.title}>
              {slide.title}
            </Title>
            <Text type="text1" className={styles.body}>
              {renderBody(slide.body, { interactive: false })}
            </Text>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.dots} aria-label="News progress">
          {safeSlides.map((slide, index) => (
            <button
              key={`${slide.title}-${index}`}
              type="button"
              className={`${styles.dot} ${
                index === currentIndex ? styles.dotActive : ""
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Show news item ${index + 1}`}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={handlePrevious}
            disabled={isFirstSlide}
          >
            Back
          </button>
          <button type="button" className={styles.primary} onClick={handleNext}>
            {isLastSlide ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </aside>
  );
}
