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
export default function useTheme() {
  // state of the operating system [dark/light]
  const [system, setSystem] = useState(null);
  // state of the active selected theme [dark/light/system]
  const { data: theme, mutate: mutateTheme, error } = useSWR(
    KEY_NAME,
    (key) => localStorage.getItem(key) || "system"
  );

  // effect to sync the state of the operating system
  useEffect(() => {
    function setSystemTheme(e) {
      const state = e.matches ? "dark" : "light";
      if (state !== system) {
        setSystem(state);
      }
    }

    // system theme settings
    const matchMedia = window?.matchMedia("(prefers-color-scheme: dark)");
    // init
    setSystemTheme(matchMedia);
    // listen for changes
    matchMedia.addEventListener("change", setSystemTheme);
    // cleanup listener
    () => matchMedia.removeEventListener("change", setSystemTheme);
  }, []);

  // effect to set final theme [dark/light]
  useEffect(() => {
    if (system) {
      syncTheme(theme === "system" ? system : theme);
    }
  }, [system, theme]);

  /**
   * Set theme value [dark/light/system]
   */
  const setTheme = (value) => {
    if (ENUM_VALUES[value]) {
      // store
      localStorage.setItem(KEY_NAME, value);
      // mutate
      mutateTheme(value);
    }
  };

  /**
   * sync theme to body as class
   */
  const syncTheme = (value) => {
    if (value === "dark") {
      document.body.classList?.add("dark", "graphiql-dark");
      document.body.classList?.remove("light", "graphiql-light");
    }
    if (value === "light") {
      document.body.classList?.remove("dark", "graphiql-dark");
      document.body.classList?.add("light", "graphiql-light");
    }
  };

  return {
    theme,
    setTheme,
    syncTheme,
    isLoading: typeof theme === "undefined" && !error,
  };
}
