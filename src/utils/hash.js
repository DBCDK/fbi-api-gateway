import crypto from "crypto";

/**
 * Creates a hash version of a string
 *
 * @param {*} value
 * @returns {string} hashed value
 */
export default function createHash(value) {
  if (!value) {
    return "";
  }
  // initialize hash function
  const shasum = crypto.createHash("sha256");
  // encode token
  return shasum.update(value).digest("hex");
}
