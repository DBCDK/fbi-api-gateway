import useSWR from "swr";

const safeParseJSON = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const isBrowser = typeof window !== "undefined";

export default function useStorage() {
  const { data: history = [], mutate: mutateHistory } = useSWR(
    "history",
    (key) => (isBrowser ? safeParseJSON(localStorage.getItem(key), []) : [])
  );

  const { data: selectedToken, mutate: mutateSelectedToken } = useSWR(
    "selectedToken",
    (key) =>
      isBrowser ? safeParseJSON(sessionStorage.getItem(key), null) : null
  );

  const isToken = (token) => {
    if (typeof token !== "string") return false;
    const stripped = token.replace(/test.*:/, "");
    return stripped.length === 40;
  };

  const setSelectedToken = (token, profile) => {
    if (!isBrowser || !isToken(token)) return;

    const value = { token, profile };
    sessionStorage.setItem("selectedToken", JSON.stringify(value));
    mutateSelectedToken(value, false);
    setHistoryItem(value, false);
  };

  const removeSelectedToken = () => {
    if (!isBrowser) return;

    sessionStorage.removeItem("selectedToken");
    mutateSelectedToken(null, false);
  };

  const setHistoryItem = ({ token, profile, note: _note }, shallow = true) => {
    if (!isBrowser || !isToken(token)) return;

    const timestamp = Date.now();
    const existing = history.find((obj) => obj.token === token);
    const note = typeof _note === "string" ? _note : existing?.note || "";

    let copy = [...history];

    if (shallow) {
      const index = history.findIndex((obj) => obj.token === token);
      if (index !== -1) {
        copy[index] = {
          ...existing,
          profile,
          note,
        };
      } else {
        // fallback if not found
        copy.unshift({ token, profile, note, timestamp });
      }
    } else {
      copy = copy.filter((obj) => obj.token !== token);
      copy.unshift({ token, profile, note, timestamp });
    }

    const sliced = copy.slice(0, 10);
    localStorage.setItem("history", JSON.stringify(sliced));
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (token) => {
    if (!isBrowser || !isToken(token)) return;

    const newHistory = history.filter((obj) => obj.token !== token);
    localStorage.setItem("history", JSON.stringify(newHistory));
    mutateHistory(newHistory, false);

    if (selectedToken?.token === token) {
      removeSelectedToken();
    }
  };

  const getHistoryItem = (token) => {
    if (!isBrowser || !isToken(token)) return null;
    return history.find((obj) => obj.token === token) || null;
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
