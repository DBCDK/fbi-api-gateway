/**
 * Debug utility functions for adding metadata to context for logging
 */

/**
 * Adds a key-value pair to the debug metadata object on context
 * @param {string} key - Debug key
 * @param {*} value - Debug value
 * @param {Object} context - GraphQL context
 */
export function addDebugInfo(key, value, context) {
  if (!context._debugObjForLog) {
    context._debugObjForLog = {};
  }
  context._debugObjForLog[String(key)] = String(value);
}

/**
 * Gets the debug metadata object from context
 * @param {Object} context - GraphQL context or request object
 * @returns {Object} Debug metadata object or empty object if not exists
 */
export function getDebugInfo(context) {
  return context._debugObjForLog || {};
}
