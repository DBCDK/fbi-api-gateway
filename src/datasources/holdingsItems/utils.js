// Helper function to construct the URL dynamically
export function buildPath(
  url,
  { agencyId, bibliographicRecordId, trackingId, itemId }
) {
  const basePath = [url, agencyId, bibliographicRecordId, itemId]
    .filter(Boolean)
    .join("/");
  const query = trackingId
    ? `?trackingId=${encodeURIComponent(trackingId)}`
    : "";
  return `${basePath}${query}`;
}
