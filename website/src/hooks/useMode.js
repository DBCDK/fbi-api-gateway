import { useEffect, useState } from "react";
import useSWR from "swr";

const KEY_NAME = "graphiql:theme";

const ENUM_VALUES = {
  dark: "dark",
  light: "light",
  system: "system",
};

/**
 *
 * @param {*} value
 */
export default function useMode() {
  // state of the operating system [dark/light]
  const [system, setSystem] = useState(null);
  // state of the active selected mode [dark/light/system]
  const { data: mode, mutate: mutateMode, error } = useSWR(
    KEY_NAME,
    (key) => localStorage.getItem(key) || "system"
  );

  // effect to sync the state of the operating system
  useEffect(() => {
    function setSystemMode(e) {
      const state = e.matches ? "dark" : "light";
      if (state !== system) {
        setSystem(state);
      }
    }

    // system mode settings
    const matchMedia = window?.matchMedia("(prefers-color-scheme: dark)");
    // init
    setSystemMode(matchMedia);
    // listen for changes
    matchMedia.addEventListener("change", setSystemMode);
    // cleanup listener
    () => matchMedia.removeEventListener("change", setSystemMode);
  }, []);

  // effect to set final mode [dark/light]
  useEffect(() => {
    if (system) {
      syncMode(mode === "system" ? system : mode);
    }
  }, [system, mode]);

  /**
   * Set mode value [dark/light/system]
   */
  function setMode(value) {
    if (ENUM_VALUES[value]) {
      // store
      localStorage.setItem(KEY_NAME, value);
      // mutate
      mutateMode(value);
    }
  }

  /**
   * sync mode to body as class
   */
  function syncMode(value) {
    if (value === "dark") {
      document.body.classList?.add("dark", "graphiql-dark");
      document.body.classList?.remove("light", "graphiql-light");
    }
    if (value === "light") {
      document.body.classList?.remove("dark", "graphiql-dark");
      document.body.classList?.add("light", "graphiql-light");
    }
  }

  return {
    mode,
    setMode,
    syncMode,
    isLoading: typeof mode === "undefined" && !error,
  };
}
