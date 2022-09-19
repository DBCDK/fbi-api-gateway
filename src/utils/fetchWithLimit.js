import promiseLimit from "promise-limit";
import fetch from "isomorphic-unfetch";

/**
 * Returns a fetch function that is concurrency limited.
 *
 * This is useful for avoiding a single incoming request consuming
 * too many resources, by making 1000s of outgoing HTTP requests in parallel.
 */
export function createFetchWithConcurrencyLimit(concurrency) {
  const limit = promiseLimit(concurrency);
  function fetchWithLimit(url, options) {
    return limit(() => fetch(url, options));
  }
  return fetchWithLimit;
}
