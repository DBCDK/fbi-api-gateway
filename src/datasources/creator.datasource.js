/**
 * @file Get creator metadata
 * At some point we might have access to a creator/author service
 */

const metadata = {};

/**
 * Get metadata for a single creator
 * @param {string} name
 */

export function load(name) {
  return metadata[name];
}
