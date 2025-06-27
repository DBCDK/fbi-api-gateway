import useSWR from "swr";

export default function useStorage() {
  const { data: history, mutate: mutateHistory } = useSWR("history", (key) =>
    JSON.parse(localStorage.getItem(key) || "[]")
  );

  let { data: selectedToken, mutate: mutateSelectedToken } = useSWR(
    "selectedToken",
    (key) => JSON.parse(sessionStorage.getItem(key || "{}"))
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

  const setSelectedToken = (token, profile) => {
    if (isToken(token)) {
      const val = { token, profile };
      sessionStorage.setItem("selectedToken", JSON.stringify(val));
      mutateSelectedToken(val, false);
      setHistoryItem(val, false);
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

  // Shallow true will update history items without reordering the items (last updated first)
  const setHistoryItem = ({ token, profile, note: _note }, shallow = true) => {
    const timestamp = Date.now();

    // Find existing
    const existing = history.find((obj) => obj.token === token);

    const note = typeof _note === "string" ? _note : existing?.note || "";

    // history copy
    let copy = [...history];

    if (shallow) {
      const index = history.findIndex((obj) => obj.token === token);

      // update only the profile if token already exist
      copy[index] = {
        ...existing,
        profile,
        note,
      };
    } else {
      // remove duplicate
      copy = copy.filter((obj) => !(obj.token === token));

      // add to beginning of array
      copy.unshift({
        token,
        profile,
        note,
        timestamp,
      });
    }

    // slice
    const sliced = copy.slice(0, 10);
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

  const getHistoryItem = (token) => {
    const match = history.find((obj) => obj.token === token);

    if (match) {
      return match;
    }
    return null;
  };

  return {
    selectedToken,
    setSelectedToken,
    removeSelectedToken,
    history,
    setHistoryItem,
    getHistoryItem,
    removeHistoryItem,
  };
}
