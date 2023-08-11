/**
 * Check for validity of a cpr
 *
 * @param cpr
 * @returns {boolean|Date|boolean}
 */
export function isValidCpr(cpr) {
  return isNumeric(cpr) && isValidDate(cpr) && cpr.length === 10;
}

/**
 *
 * @param n
 * @returns {boolean}
 */
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Check if first 6 digits contains a valid date
 * @param ddmmyy
 * @returns {Date|boolean}
 */
function isValidDate(ddmmyy) {
  const mm = ddmmyy.substr(2, 2) || "00";
  const d = new Date(ddmmyy.substr(4, 2), mm - 1, ddmmyy.substr(0, 2));
  return d && d.getMonth() + 1 === parseInt(mm, 10);
}
