/**
 * Read an environment variable and return it as string[].
 *
 * Behavior:
 * - If the variable is missing or an empty string, returns [].
 * - Tries to parse the value as JSON first (recommended: '["a","b"]').
 * - If JSON parsing fails or is not a string[], falls back to comma-split.
 * - Trims each item and removes empty entries.
 *
 * @param {string} name
 *   The name of the environment variable (e.g. "MY_LIST").
 *
 * @returns {string[]}
 *   An array of strings derived from the environment variable.
 *
 * @example
 * // .env -> MY_LIST=["alpha","beta","gamma"]
 * const list = getStringArray("MY_LIST"); // ["alpha","beta","gamma"]
 *
 * @example
 * // .env -> MY_LIST=alpha, beta , gamma
 * const list = getStringArray("MY_LIST"); // ["alpha","beta","gamma"]
 *
 * @example
 * // Missing or empty env -> returns []
 * const list = getStringArray("NOT_SET"); // []
 */
export function getStringArray(name) {
  const raw = process.env[name];
  if (raw == null || raw === "") return [];

  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
      return arr;
    }
    // If JSON exists but is not a string[], fall back to split
  } catch {
    // Ignore and try delimiter split
  }

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
