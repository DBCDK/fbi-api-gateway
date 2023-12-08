/**
 * @file Parse and Stringify JSON asynchronously
 *
 * Prevents large JSON structures from blocking the event loop
 * should improve FBI-API concurrency
 */
// import yj from "yieldable-json";

/**
 * Parse json
 */
function logDuration(duration, key, obj) {
  if (!obj) {
    return;
  }
  if (!obj[key]) {
    obj[key] = 0;
  }
  obj[key] += duration;
}
export async function parseJSON(str, timings) {
  const now = performance.now();
  const res = JSON.parse(str);
  const duration = performance.now() - now;
  logDuration(duration, "jsonParse", timings);

  return res;
}

/**
 * Stringify json
 */
export async function stringifyJSON(obj, timings) {
  const now = performance.now();
  const res = JSON.stringify(obj);
  const duration = performance.now() - now;
  logDuration(duration, "jsonStringify", timings);

  return res;
}
