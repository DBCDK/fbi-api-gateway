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

  console.log("theme", theme);

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
  };

  const _removeTheme = () => {
    // store
    localStorage.removeItem(KEY_NAME);
    // mutate
    mutateHistory(null);
  };

  return {
    theme,
    setTheme,
    isLoading: typeof theme === "undefined" && !error,
  };
}
