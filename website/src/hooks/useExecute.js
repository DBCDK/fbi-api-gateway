import useSWR from "swr";

const KEY_NAME = "graphiql:execute";
const isBrowser = typeof window !== "undefined";

const ENUM_VALUES = {
  manual: "manual",
  auto: "auto",
};

/**
 *
 * @param {*} value
 */
export default function useExecute() {
  const { data: execute, mutate } = useSWR(
    KEY_NAME,
    (key) => {
      if (!isBrowser) {
        return "auto";
      }

      try {
        return localStorage.getItem(key) || "auto";
      } catch {
        return "auto";
      }
    },
    { fallbackData: "auto" }
  );

  /**
   * Set mode value [dark/light/system]
   */
  function setExecute(value) {
    if (ENUM_VALUES[value]) {
      // store
      if (isBrowser) {
        try {
          localStorage.setItem(KEY_NAME, value);
        } catch {}
      }
      // mutate
      mutate(value);
    }
  }

  return {
    execute,
    setExecute,
  };
}
