/**
 *
 * @param {*} value
 */
export default function useLocalStorage(_key) {
  /**
   *
   * @param {string} key
   * @param {number} ttl
   */
  function _add(key = _key, ttl = 60 * 60 * 24) {
    const obj = { value: true, date: new Date().getTime() / 1000 + ttl };
    localStorage.setItem(key, JSON.stringify(obj));
  }

  /**
   *
   * @param {string} key
   * @param {number} ttl
   */
  function setItem(key = _key, ttl) {
    if (!getItem(key)) {
      _add(key, ttl);
    }
  }

  /**
   *
   * @param {string} key
   * @returns {*}
   */
  function getItem(key = _key) {
    const now = new Date().getTime() / 1000;
    const item = JSON.parse(localStorage.getItem(key));
    if (item?.expire <= now) {
      return item?.value;
    }
  }

  /**
   *
   * @param {string} key
   * @param {number} ttl
   */
  function updateItem(key = _key, ttl) {
    if (getItem(key)) {
      _add(key, ttl);
    }
  }

  /**
   *
   * @param {string} key
   */
  function removeItem(key = _key) {
    localStorage.removeItem(key);
  }

  return {
    setItem,
    getItem,
    updateItem,
    removeItem,
  };
}
