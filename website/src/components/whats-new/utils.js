import clientBasedAccessNews from "./clientBasedAccessNews";

export const WHATS_NEW_RESTORED_EVENT = "fbi:whats-new-restored";

function parseEnabled(value, fallback = true) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

function parsePublishedAt(value, fallback = null) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function parseExpiresAfterDays(value, fallback = null) {
  const parsed = Number.parseInt(String(value || ""), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isExpired({ publishedAt, expiresAfterDays }) {
  if (!publishedAt || !expiresAfterDays) {
    return false;
  }

  const publishedAtTime = Date.parse(publishedAt);

  if (!Number.isFinite(publishedAtTime)) {
    return false;
  }

  const expiresAtTime =
    publishedAtTime + Number(expiresAfterDays) * 24 * 60 * 60 * 1000;

  return Date.now() >= expiresAtTime;
}

export function getResolvedWhatsNew(news = clientBasedAccessNews) {
  return {
    ...news,
    active: parseEnabled(
      process.env.NEXT_PUBLIC_WHATS_NEW_ENABLED,
      news.active ?? true
    ),
    publishedAt: parsePublishedAt(
      process.env.NEXT_PUBLIC_WHATS_NEW_PUBLISHED_AT,
      news.publishedAt || null
    ),
    expiresAfterDays: parseExpiresAfterDays(
      process.env.NEXT_PUBLIC_WHATS_NEW_EXPIRES_AFTER_DAYS,
      news.expiresAfterDays || null
    ),
  };
}

export function getWhatsNewStorageKey(newsId) {
  return `fbi:news:${newsId}:dismissed`;
}

export function isWhatsNewRestorable(news = clientBasedAccessNews) {
  const resolvedNews = getResolvedWhatsNew(news);

  if (!resolvedNews.active || isExpired(resolvedNews) || !resolvedNews.newsId) {
    return false;
  }

  try {
    return (
      localStorage.getItem(getWhatsNewStorageKey(resolvedNews.newsId)) === "true"
    );
  } catch {
    return false;
  }
}

export function restoreWhatsNew(news = clientBasedAccessNews) {
  const resolvedNews = getResolvedWhatsNew(news);

  if (!resolvedNews.newsId) {
    return false;
  }

  try {
    localStorage.removeItem(getWhatsNewStorageKey(resolvedNews.newsId));
    window.dispatchEvent(
      new CustomEvent(WHATS_NEW_RESTORED_EVENT, {
        detail: { newsId: resolvedNews.newsId },
      })
    );
    return true;
  } catch {
    return false;
  }
}
