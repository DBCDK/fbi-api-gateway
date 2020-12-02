/**
 * @file Get creator metadata
 * Based on data fetched from forfatterweb on 1.dec. 2020
 */

import metadata from "./creators.json";

/**
 * Get metadata for a single creator
 * @param {string} name
 */

function getCreator(name) {
  return metadata[name];
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export default async function batchLoader(keys) {
  return keys.map(name => getCreator(name));
}
