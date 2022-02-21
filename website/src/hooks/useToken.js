/**
 * Hook for token handling across components 🤯
 *
 * OBS! useToken hook is SWR connected and will trigger an update
 * on connected components.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import getConfig from "next/config";
import nookies from "nookies";
import fetch from "isomorphic-unfetch";

import useSWR from "swr";

const APP_URL =
  getConfig()?.publicRuntimeConfig?.app?.url || "http://localhost:3000";

/**
 *
 * Settings
 *
 *
 */

// Custom fetcher
const fetcher = async (url, token) => {
  if (!token || token === "") {
    return {};
  }
  const response = await fetch(`${APP_URL}${url}`, {
    method: "GET",
  });
  if (response.status !== 200) {
    return {};
  }
  const configuration = await response.json();

  return { token, configuration };
};

/**
 * useToken hook
 *
 * @returns {object}
 *
 * token
 * configuration
 * setToken
 *
 */

function useToken() {
  // cookie token
  const token = nookies.get().token;
  // SWR key
  const url = `/api/smaug?token=${token}`;
  // SWR hook
  const { data, isValidating, error, mutate } = useSWR([url, token], fetcher);

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
      nookies.set({}, "token", token, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      mutate(token);
    }
  };

  const clearToken = () => {
    if (token) {
      nookies.destroy({}, "token");
      mutate();
    }
  };

  return {
    token: data?.token,
    configuration: data?.configuration,
    isValidating,
    isLoading: !data && !error,
    setToken,
    clearToken,
  };
}

export default useToken;
