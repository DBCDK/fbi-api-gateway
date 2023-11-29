/**
 * @file Parse and Stringify JSON asynchronously
 *
 * Prevents large JSON structures from blocking the event loop
 * should improve FBI-API concurrency
 */
import yj from "yieldable-json";

/**
 * Parse json asynchronously
 */
export async function parseJSON(str) {
  return new Promise((resolve, reject) => {
    yj.parseAsync(str, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Stringify json asynchronously
 */
export async function stringifyJSON(obj) {
  return new Promise((resolve, reject) => {
    yj.stringifyAsync(obj, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
