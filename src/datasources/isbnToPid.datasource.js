/**
 * Resolves an ISBN to the PID of the manifestation that matched the search.
 *
 * Complex Search returns matching works separately from the manifestation PIDs
 * that caused each hit. The latter are exposed as searchHits and must be used
 * here to avoid selecting an arbitrary manifestation from the work.
 */
export async function load({ isbn, profile }, context) {
  const normalizedIsbn = String(isbn || "").replace(/[\s-]/g, "");
  if (!/^(\d{13}|\d{9}[\dXx])$/.test(normalizedIsbn)) {
    return null;
  }

  const response = await context.getLoader("complexsearch").load({
    cql: `term.isbn="${normalizedIsbn}"`,
    profile,
    offset: 0,
    limit: 1,
  });

  const workId = response?.works?.[0];
  return (workId && response?.searchHits?.[workId]?.[0]) || null;
}

export const options = {
  redis: {
    prefix: "isbnToPid-1",
    ttl: 60 * 60 * 24,
    staleWhileRevalidate: 60 * 60 * 24 * 30,
    dedupe: {
      waitTimeoutMs: 5_000,
      lockTtlMs: 8_000,
    },
  },
};
