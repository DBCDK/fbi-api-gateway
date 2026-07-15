import { useEffect, useState } from "react";

import Carousel from "@/components/base/carousel";
import Link from "@/components/base/link";
import Text from "@/components/base/text";
import Title from "@/components/base/title";

import clientBasedAccessNews from "./clientBasedAccessNews";
import styles from "./WhatsNew.module.css";
import {
  WHATS_NEW_RESTORED_EVENT,
  getResolvedWhatsNew,
  getWhatsNewStorageKey,
  isExpired,
} from "./utils";

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

export default function WhatsNew() {
  const resolvedNews = getResolvedWhatsNew(clientBasedAccessNews);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!resolvedNews.newsId) {
      setIsHydrated(true);
      return;
    }

    try {
      const isStoredDismissed =
        localStorage.getItem(getWhatsNewStorageKey(resolvedNews.newsId)) ===
        "true";
      setIsDismissed(isStoredDismissed);
    } catch {}

    setIsHydrated(true);
  }, [resolvedNews.newsId]);

  useEffect(() => {
    function handleNewsRestored(event) {
      if (event?.detail?.newsId !== resolvedNews.newsId) {
        return;
      }

      setIsDismissed(false);
    }

    window.addEventListener(WHATS_NEW_RESTORED_EVENT, handleNewsRestored);

    return () => {
      window.removeEventListener(WHATS_NEW_RESTORED_EVENT, handleNewsRestored);
    };
  }, [resolvedNews.newsId]);

  function dismissNews() {
    setIsDismissed(true);

    if (!resolvedNews.newsId) {
      return;
    }

    try {
      localStorage.setItem(getWhatsNewStorageKey(resolvedNews.newsId), "true");
    } catch {}
  }

  if (
    !isHydrated ||
    isDismissed ||
    !resolvedNews.active ||
    isExpired(resolvedNews)
  ) {
    return null;
  }

  return (
    <Carousel
      items={resolvedNews.slides.filter((slide) => slide?.title && slide?.body)}
      className={styles.wrap}
      contentClassName={styles.content}
      closeClassName={styles.closeButton}
      dotClassName={styles.dot}
      dotActiveClassName={styles.dotActive}
      primaryButtonClassName={styles.primaryButton}
      secondaryButtonClassName={styles.secondaryButton}
      ariaLabel="What's new"
      dotsLabel="What's new progress"
      closeLabel="Close what's new"
      previousLabel="Back"
      nextLabel="Next"
      completeLabel="Got it"
      onClose={dismissNews}
      onComplete={dismissNews}
      getItemKey={(slide, index) => `${slide.title}-${index}`}
      getItemAriaLabel={(slide, index) =>
        `Show what's new item ${index + 1}${slide.title ? `: ${slide.title}` : ""}`
      }
      renderItem={(slide, { interactive }) => (
        <>
          <div className={styles.badge}>
            <span className={styles.icon} aria-hidden="true">
              {slide.icon || "i"}
            </span>
            <span>{slide.eyebrow || "What is new"}</span>
          </div>

          <Title as="h3" type="title7" className={styles.title}>
            {slide.title}
          </Title>
          <Text type="text1" className={styles.body}>
            {renderBody(slide.body, { interactive })}
          </Text>
        </>
      )}
    />
  );
}
