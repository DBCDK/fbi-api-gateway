/**
 * Hook for q search param sync across components 🤯
 *
 * OBS! useQ hook is SWR connected and will trigger an update
 * on connected components.
 */

import { useEffect } from "react";
import { useRouter } from "next/router";

import useHistory from "@/hooks/useHistory";

import useSWR from "swr";

/**
 *
 * Settings
 *
 *
 */

// Global state
let locale = {};

// Global useQ hook initialization
let initialized = false;

// Custom fetcher
const fetcher = () => locale;

/**
 * useQ hook
 *
 * @returns {object}
 *
 * q
 * setQ
 * clearQ
 * setQuery
 * getQuery
 * hasQuery
 * types
 *
 */

function useToken() {
  // SWR
  const { data: _token, mutate: _setToken } = useSWR("token", fetcher, {
    initialData: {},
  });

  /**
   * Get token from history
   *
   * @returns {string}
   *
   */
  export const getToken = () => {
    localStorage.getItem();
  };

  /**
   * Set new token
   *
   * @param {string} token
   *
   * @returns {object}
   *
   */
  export const setToken = (token) => {};

  return {
    token: getToken(),
    setToken,
  };
}

export default useQ;
