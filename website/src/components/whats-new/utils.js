import whatsNewNews from "./whatsNewNews";

export const WHATS_NEW_RESTORED_EVENT = "fbi:whats-new-restored";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getLocalStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

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

function parseDays(value, fallback = null) {
  const parsed = Number.parseInt(String(value || ""), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isPublished({ publishedAt }, now = Date.now()) {
  if (!publishedAt) {
    return true;
  }

  const publishedAtTime = Date.parse(publishedAt);
  return !Number.isFinite(publishedAtTime) || publishedAtTime <= now;
}

export function isExpired(
  { publishedAt, expiresAfterDays },
  now = Date.now()
) {
  if (!publishedAt || !expiresAfterDays) {
    return false;
  }

  const publishedAtTime = Date.parse(publishedAt);

  if (!Number.isFinite(publishedAtTime)) {
    return false;
  }

  return publishedAtTime + expiresAfterDays * DAY_IN_MS <= now;
}

export function getResolvedWhatsNew(news = whatsNewNews) {
  const newsItems = Array.isArray(news) ? news : [news];
  const globallyEnabled = parseEnabled(
    process.env.NEXT_PUBLIC_WHATS_NEW_ENABLED,
    true
  );
  const defaultPublishedAt = parsePublishedAt(
    process.env.NEXT_PUBLIC_WHATS_NEW_PUBLISHED_AT
  );
  const defaultExpiresAfterDays = parseDays(
    process.env.NEXT_PUBLIC_WHATS_NEW_EXPIRES_AFTER_DAYS
  );

  return newsItems.filter(Boolean).map((item) => ({
    ...item,
    active: globallyEnabled && (item.active ?? true),
    publishedAt: parsePublishedAt(item.publishedAt, defaultPublishedAt),
    expiresAfterDays: Object.hasOwn(item, "expiresAfterDays")
      ? parseDays(item.expiresAfterDays)
      : defaultExpiresAfterDays,
    repeatAfterDays: parseDays(item.repeatAfterDays),
  }));
}

export function getWhatsNewStorageKey(newsId) {
  return `fbi:news:${newsId}:seen-at`;
}

function getSeenAt(newsId, storage = getLocalStorage()) {
  if (!newsId || !storage) {
    return null;
  }

  try {
    const seenAt = Date.parse(storage.getItem(getWhatsNewStorageKey(newsId)));
    return Number.isFinite(seenAt) ? seenAt : null;
  } catch {
    return null;
  }
}

export function getVisibleWhatsNew(
  news = whatsNewNews,
  { now = Date.now(), storage = getLocalStorage() } = {}
) {
  const resolvedNews = getResolvedWhatsNew(news);

  return resolvedNews.filter((item) => {
    if (
      !item.id ||
      !item.title ||
      !item.body ||
      !item.active ||
      !isPublished(item, now) ||
      isExpired(item, now)
    ) {
      return false;
    }

    const seenAt = getSeenAt(item.id, storage);

    if (seenAt === null) {
      return true;
    }

    return Boolean(
      item.repeatAfterDays &&
        seenAt + item.repeatAfterDays * DAY_IN_MS <= now
    );
  });
}

export function markWhatsNewSeen(
  news,
  { now = Date.now(), storage = getLocalStorage() } = {}
) {
  const newsItems = (Array.isArray(news) ? news : [news]).filter(
    (item) => item?.id
  );

  if (newsItems.length === 0 || !storage) {
    return false;
  }

  try {
    const seenAt = new Date(now).toISOString();

    for (const item of newsItems) {
      storage.setItem(getWhatsNewStorageKey(item.id), seenAt);
    }

    return true;
  } catch {
    return false;
  }
}

export function isWhatsNewRestorable(
  news = whatsNewNews,
  { now = Date.now(), storage = getLocalStorage() } = {}
) {
  const resolvedNews = getResolvedWhatsNew(news);

  return resolvedNews.some(
    (item) =>
      item.id &&
      item.active &&
      isPublished(item, now) &&
      !isExpired(item, now) &&
      getSeenAt(item.id, storage) !== null
  );
}

export function restoreWhatsNew(
  news = whatsNewNews,
  { storage = getLocalStorage() } = {}
) {
  if (!storage) {
    return false;
  }

  try {
    for (const item of getResolvedWhatsNew(news)) {
      if (item.id) {
        storage.removeItem(getWhatsNewStorageKey(item.id));
      }
    }

    window.dispatchEvent(new CustomEvent(WHATS_NEW_RESTORED_EVENT));
    return true;
  } catch {
    return false;
  }
}
