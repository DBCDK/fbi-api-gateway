import useSWR from "swr";

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

  const isToken = (token) => {
    const strippedToken = token?.replace(/test.*:/, "");
    return !!(strippedToken.length === 40);
  };

  const setSelectedToken = (token, profile, note) => {
    if (isToken(token)) {
      const val = { token, profile, note };
      sessionStorage.setItem("selectedToken", JSON.stringify(val));
      mutateSelectedToken(val, false);
      setHistory(val);
    }
  };

  /**
   * Clear token from sessionStorage
   *
   */
  const removeSelectedToken = () => {
    sessionStorage.removeItem("selectedToken");
    mutateSelectedToken(null, false);
  };

  const setHistory = ({ token, profile, note }) => {
    const timestamp = Date.now();

    // Find existing
    const existing = history.find((obj) => obj.token === token);

    const index = history.findIndex((obj) => obj.token === token);

    let arr;
    if (existing) {
      // history copy
      arr = [...history];
      // update only the profile if token already exist
      arr[index] = {
        ...existing,
        profile,
        note: typeof note === "string" ? note : "",
      };
    } else {
      // remove duplicate
      arr = history.filter((obj) => !(obj.token === token));
      // add to beginning of array
      arr.unshift({
        token,
        profile,
        note,
        timestamp,
      });
    }

    // slice
    const sliced = arr.slice(0, 10);
    // store
    const stringified = JSON.stringify(sliced);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (token) => {
    const newHistory = history.filter((obj) => !(obj.token === token));
    // store
    const stringified = JSON.stringify(newHistory);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(newHistory, false);

    if (selectedToken?.token === token) {
      removeSelectedToken();
    }
  };

  return {
    selectedToken,
    setSelectedToken,
    removeSelectedToken,
    history,
    setHistory,
    removeHistoryItem,
  };
}
