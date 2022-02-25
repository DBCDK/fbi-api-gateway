/**
 * Hook for token handling across components 🤯
 *
 * OBS! useToken hook is SWR connected and will trigger an update
 * on connected components.
 */

import fetch from "isomorphic-unfetch";
import useSWR from "swr";

/**
 * Settings
 *
 */

const TOKEN_KEY = "token";
const HISTORY_KEY = "history";

const isToken = (token) => {
  // alpha numeric and more than 32 characters
  return !!(token && token.match(/^(?=.*[a-zA-Z])(?=.*[0-9]).{40}/));
};

/**
 * Custom fetcher
 *
 */
const fetcher = async (url, token) => {
  if (!isToken(token)) {
    return {};
  }
  const response = await fetch(url, {
    method: "GET",
  });
  if (response.status !== 200) {
    return {};
  }
  const configuration = await response.json();

  return { token, configuration };
};

/**
 * Set token in sessionStorage
 *
 */
const _setToken = (token) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Get token from sessionStorage
 *
 */
const _getToken = () => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(TOKEN_KEY);
  }
};

/**
 * Clear token from sessionStorage
 *
 */
const _removeToken = () => {
  if (typeof window !== "undefined") {
    return sessionStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Set history in localStorage
 *
 */
const _setHistory = (data) => {
  if (typeof window !== "undefined") {
    if (data?.token) {
      const timestamp = Date.now();
      const history = _getHistory();
      // remove duplicate
      const uniq = history.filter((obj) => !(obj.token === data.token));
      // add to beginning of array
      uniq.unshift({
        token: data.token,
        timestamp,
      });
      // slice
      const sliced = uniq.slice(0, 10);
      // store
      localStorage.setItem(HISTORY_KEY, JSON.stringify(sliced));
    }
  }
};

/**
 * Get history from localStorage
 *
 */
const _getHistory = () => {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  }
};

/**
 * useToken hook
 *
 * @returns {object}
 *
 * token {string}
 * configuration {object}
 * isValidating {bool}
 * isLoading {bool}
 *
 * setToken {func}
 * removeToken {func}
 *
 */

function useToken(token) {
  // cookie token
  if (!token) {
    token = _getToken();
  }
  // SWR key
  const url = `/api/smaug?token=${token}`;
  // SWR hook
  const { data, isValidating, error, mutate } = useSWR(
    token && [url, token],
    fetcher
  );

  /**
   * Set new token
   *
   * @param {string} token
   *
   * @returns {object}
   *
   */
  const setToken = (token) => {
    if (token && token !== "") {
      _setToken(token);
      _setHistory(data);
      mutate();
    }
  };

  const removeToken = () => {
    if (token) {
      _removeToken();
      mutate();
    }
  };

  return {
    token: data?.token,
    configuration: data?.configuration,
    isValidating,
    isLoading: !data && !error,
    isToken: isToken(data?.token),
    history: _getHistory(),
    setToken,
    removeToken,
  };
}

export default useToken;
