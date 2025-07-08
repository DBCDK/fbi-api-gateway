import useSWR from "swr";

const isBrowser = typeof window !== "undefined";

const safeGetItem = (storage, key, fallback = null) => {
  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const isToken = (token) => {
  if (typeof token !== "string") return false;
  const stripped = token.replace(/test.*:/, "");
  return stripped.length === 40;
};

export default function useStorage() {
  const { data: history = [], mutate: mutateHistory } = useSWR(
    "history",
    (key) => (isBrowser ? safeGetItem(localStorage, key, []) : []),
    { fallbackData: [] }
  );

  const { data: selectedToken, mutate: mutateSelectedToken } = useSWR(
    "selectedToken",
    (key) => (isBrowser ? safeGetItem(sessionStorage, key, null) : null),
    { fallbackData: null }
  );

  const setSelectedToken = (token, profile) => {
    if (!isBrowser || !isToken(token)) return;

    const value = { token, profile };
    try {
      sessionStorage.setItem("selectedToken", JSON.stringify(value));
    } catch {}
    mutateSelectedToken(value, false);
    setHistoryItem(value, false);
  };

  const removeSelectedToken = () => {
    if (!isBrowser) return;
    try {
      sessionStorage.removeItem("selectedToken");
    } catch {}
    mutateSelectedToken(null, false);
  };

  const setHistoryItem = ({ token, profile, note: _note }, shallow = true) => {
    if (!isBrowser || !isToken(token)) return;

    const timestamp = Date.now();
    const existing = history?.find((obj) => obj.token === token);
    const note = typeof _note === "string" ? _note : existing?.note || "";

    let copy = [...history];

    if (shallow) {
      const index = history?.findIndex((obj) => obj.token === token);
      if (index !== -1) {
        copy[index] = {
          ...existing,
          profile,
          note,
        };
      } else {
        copy.unshift({ token, profile, note, timestamp });
      }
    } else {
      copy = copy.filter((obj) => obj.token !== token);
      copy.unshift({ token, profile, note, timestamp });
    }

    const sliced = copy.slice(0, 10);
    try {
      localStorage.setItem("history", JSON.stringify(sliced));
    } catch {}
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (token) => {
    if (!isBrowser || !isToken(token)) return;

    const newHistory = history?.filter((obj) => obj.token !== token);
    try {
      localStorage.setItem("history", JSON.stringify(newHistory));
    } catch {}
    mutateHistory(newHistory, false);

    if (selectedToken?.token === token) {
      removeSelectedToken();
    }
  };

  const getHistoryItem = (token) => {
    if (!isBrowser || !isToken(token)) return null;
    return history?.find((obj) => obj.token === token) || null;
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
