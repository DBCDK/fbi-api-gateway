/**
 * @file Get creator metadata
 * At some point we might have access to a creator/author service
 */

const metadata = {};

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
  return keys.map((name) => getCreator(name));
}
