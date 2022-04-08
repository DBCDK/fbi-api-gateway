import useSWR from "swr";
import { isEqual } from "@/components/utils";

export default function useStorage() {
  const { data: history, mutate: mutateHistory } = useSWR("history", (key) =>
    JSON.parse(localStorage.getItem(key) || "[]")
  );

  const {
    data: selectedToken,
    mutate: mutateSelectedToken,
  } = useSWR("selectedToken", (key) =>
    JSON.parse(sessionStorage.getItem(key || "{}"))
  );

  const setSelectedToken = (token, agency, profile) => {
    const val = { token, agency, profile };
    sessionStorage.setItem("selectedToken", JSON.stringify(val));
    mutateSelectedToken(val, false);
    setHistory(token, agency, profile);
  };

  /**
   * Clear token from sessionStorage
   *
   */
  const removeSelectedToken = () => {
    sessionStorage.removeItem("selectedToken");
    mutateSelectedToken(null, false);
  };

  const setHistory = (token, agency, profile) => {
    const timestamp = Date.now();

    // Find existing
    const existing = history.find((obj) =>
      isEqual(obj, { token, agency, profile })
    );

    // remove duplicate
    const uniq = history.filter(
      (obj) => !isEqual(obj, { token, agency, profile })
    );

    if (existing) {
      uniq.unshift(existing);
    } else {
      // add to beginning of array
      uniq.unshift({
        token,
        agency,
        profile,
        timestamp,
      });
    }

    // slice
    const sliced = uniq.slice(0, 10);
    // store
    const stringified = JSON.stringify(sliced);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (token, agency, profile) => {
    const newHistory = history.filter(
      (obj) => !isEqual(obj, { token, agency, profile })
    );
    // store
    const stringified = JSON.stringify(newHistory);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(newHistory, false);
  };

  return {
    selectedToken: selectedToken,
    setSelectedToken,
    removeSelectedToken,
    history,
    setHistory,
    removeHistoryItem,
  };
}
