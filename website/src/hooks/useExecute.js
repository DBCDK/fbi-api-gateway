import useSWR from "swr";

const KEY_NAME = "graphiql:execute";

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
    (key) => localStorage.getItem(key) || "auto"
  );

  /**
   * Set mode value [dark/light/system]
   */
  function setExecute(value) {
    if (ENUM_VALUES[value]) {
      // store
      localStorage.setItem(KEY_NAME, value);
      // mutate
      mutate(value);
    }
  }

  return {
    execute,
    setExecute,
  };
}
