import { Readable } from "stream";
import { parser } from "stream-json";
import { streamValues } from "stream-json/streamers/StreamValues";

/**
 * Parses a JSON string asynchronously (non-blocking)
 */
export async function parseAsync(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    throw new TypeError("Input must be a non-empty string");
  }

  return new Promise((resolve, reject) => {
    // Create a Readable stream from the provided JSON string
    const inputStream = Readable.from([jsonString]);

    // Build the pipeline: parser() -> streamValues()
    const pipeline = inputStream.pipe(parser()).pipe(streamValues());

    let result = null;

    // 'data' event: This fires for each top-level item in the JSON
    pipeline.on("data", ({ value }) => {
      // If the JSON is a top-level object (or array), this will be triggered once
      result = value;
    });

    // 'end' event: Emitted when the entire JSON has been parsed
    pipeline.on("end", () => {
      resolve(result);
    });

    // 'error' event: Emitted if any error occurs during parsing
    pipeline.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * @file Parse and Stringify JSON asynchronously
 *
 * Prevents large JSON structures from blocking the event loop
 * should improve FBI-API concurrency
 */

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
  let res;

  // Goal is to block main thread as little as possible
  // while parsing JSON.
  // Small JSON blobs we use the native parser, which is more efficient
  // But for larger JSON blobs we use a non-blocking parser
  if (str?.length > 100000) {
    res = await parseAsync(str);
  } else {
    res = JSON.parse(str);
  }
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
