/**
 * Read an environment variable expected to be a comma-separated list of strings.
 *
 * Behavior:
 * - If the variable is missing or empty, returns [].
 * - Splits the string on commas.
 * - Trims each item and removes empty entries.
 *
 * Expected format (e.g. in Kubernetes or .env):
 *   - name: LOCKED_AGENCY_ID_LIST
 *     value: "190101,790900"
 *
 * @param {string | undefined | null} raw
 *   The raw comma-separated string value to parse.
 *
 * @returns {string[]}
 *   Array of strings, or [] if missing/invalid.
 *
 * @example
 * getStringArray("190101,790900");
 * // => ["190101", "790900"]
 *
 * @example
 * getStringArray(" 190101 , , 790900 ");
 * // => ["190101", "790900"]
 *
 * @example
 * getStringArray(undefined);
 * // => []
 */
export function getStringArray(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return [];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
