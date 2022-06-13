import useSWR from "swr";
import { isEqual } from "@/components/utils";

export default function useStorage() {
  const { data: history, mutate: mutateHistory } = useSWR("history", (key) =>
    JSON.parse(localStorage.getItem(key) || "[]")
  );

  let {
    data: selectedToken,
    mutate: mutateSelectedToken,
  } = useSWR("selectedToken", (key) =>
    JSON.parse(sessionStorage.getItem(key || "{}"))
  );

  // If user has not explicitly selected a token
  // we use the first one from history if one exists
  if (!selectedToken) {
    // selectedToken = history?.[0];
  }

  const setSelectedToken = (token, profile) => {
    const val = { token, profile };
    sessionStorage.setItem("selectedToken", JSON.stringify(val));
    mutateSelectedToken(val, false);
    setHistory(token, profile);
  };

  /**
   * Clear token from sessionStorage
   *
   */
  const removeSelectedToken = () => {
    sessionStorage.removeItem("selectedToken");
    mutateSelectedToken(null, false);
  };

  const setHistory = (token, profile) => {
    const timestamp = Date.now();

    // Find existing
    const existing = history.find((obj) => obj.token === token);

    // remove duplicate
    const uniq = history.filter((obj) => !(obj.token === token));

    if (existing) {
      // update only the profile if token already exist
      uniq.unshift({
        ...existing,
        profile,
      });
    } else {
      // add to beginning of array
      uniq.unshift({
        token,
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

  const removeHistoryItem = (token, profile) => {
    const newHistory = history.filter((obj) => !(obj.token === token));
    // store
    const stringified = JSON.stringify(newHistory);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(newHistory, false);

    if (selectedToken.token === token) {
      removeSelectedToken();
    }
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
