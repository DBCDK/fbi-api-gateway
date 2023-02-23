import useSWR from "swr";

const KEY_NAME = "graphiql:theme";

const ENUM_VALUES = {
  dark: "dark",
  light: "light",
};

export default function useTheme() {
  const { data: theme, mutate: mutateTheme, error } = useSWR(
    KEY_NAME,
    (key) => localStorage.getItem(key) || null
  );

  const setTheme = (value) => {
    if (ENUM_VALUES[value]) {
      // store
      localStorage.setItem(KEY_NAME, value);
      // mutate
      mutateTheme(value);
    }

    if (value === null) {
      _removeTheme();
    }

    syncTheme(value);
  };

  const _removeTheme = () => {
    // store
    localStorage.removeItem(KEY_NAME);
    // mutate
    mutateTheme(null);
  };

  const syncTheme = (value = theme) => {
    if (value === null) {
      document.body.classList?.remove("dark", "graphiql-dark");
      document.body.classList?.remove("light", "graphiql-light");
    }
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
