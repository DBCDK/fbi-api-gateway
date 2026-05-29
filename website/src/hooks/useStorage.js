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

const getHistoryIdentifier = ({ id, token, clientId }) =>
  clientId ? `client:${clientId}` : id || token || null;

const matchesHistoryEntry = (left = {}, right = {}) => {
  const leftIdentifier = getHistoryIdentifier(left);
  const rightIdentifier = getHistoryIdentifier(right);

  return (
    (leftIdentifier && rightIdentifier && leftIdentifier === rightIdentifier) ||
    (left.clientId && right.clientId && left.clientId === right.clientId) ||
    (left.token && right.token && left.token === right.token)
  );
};

const normalizeHistory = (items = []) =>
  items.reduce((acc, item) => {
    const existingIndex = acc.findIndex((entry) =>
      matchesHistoryEntry(entry, item)
    );

    if (existingIndex === -1) {
      acc.push(item);
      return acc;
    }

    acc[existingIndex] = {
      ...item,
      ...acc[existingIndex],
      ...item,
      note:
        typeof item?.note === "string"
          ? item.note
          : acc[existingIndex]?.note || "",
    };

    return acc;
  }, []);

export default function useStorage() {
  const { data: history = [], mutate: mutateHistory } = useSWR(
    "history",
    (key) =>
      isBrowser ? normalizeHistory(safeGetItem(localStorage, key, [])) : [],
    { fallbackData: [] }
  );

  const { data: selectedToken, mutate: mutateSelectedToken } = useSWR(
    "selectedToken",
    (key) => (isBrowser ? safeGetItem(sessionStorage, key, null) : null),
    { fallbackData: null }
  );

  const setSelectedToken = (token, profile, agency, metadata = null) => {
    if (!isBrowser || !isToken(token)) return;

    const current = selectedToken?.token === token ? selectedToken : {};
    const historyItem =
      metadata?.id || metadata?.clientId
        ? null
        : history?.find?.((item) => item?.token === token) || null;
    const value = {
      token,
      profile: profile === undefined ? current?.profile ?? null : profile,
      agency: agency === undefined ? current?.agency ?? null : agency,
      id:
        metadata?.id ??
        historyItem?.id ??
        current?.id ??
        null,
      type:
        metadata?.type ??
        historyItem?.type ??
        current?.type ??
        null,
      clientId:
        metadata?.clientId ??
        historyItem?.clientId ??
        current?.clientId ??
        null,
    };
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

  const setHistoryItem = (
    { token, profile, agency, note: _note, ...rest },
    shallow = true
  ) => {
    if (!isBrowser) return;

    const identifier = getHistoryIdentifier({ token, ...rest });

    if (!identifier || (!isToken(token) && !rest.clientId)) return;

    const timestamp = Date.now();
    const existing = history?.find((obj) =>
      matchesHistoryEntry(obj, { token, ...rest })
    );
    const note = typeof _note === "string" ? _note : existing?.note || "";

    let copy = [...history];

    if (shallow) {
      const index = history?.findIndex((obj) =>
        matchesHistoryEntry(obj, { token, ...rest })
      );
      if (index !== -1) {
        copy[index] = {
          ...existing,
          ...rest,
          profile,
          agency,
          note,
        };
      } else {
        copy.unshift({
          token,
          profile,
          agency,
          note,
          timestamp,
          ...rest,
        });
      }
    } else {
      copy = copy.filter((obj) => !matchesHistoryEntry(obj, { token, ...rest }));
      copy.unshift({
        token,
        profile,
        agency,
        note,
        timestamp,
        ...rest,
      });
    }

    const sliced = normalizeHistory(copy).slice(0, 10);
    try {
      localStorage.setItem("history", JSON.stringify(sliced));
    } catch {}
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (tokenOrEntry) => {
    if (!isBrowser) return;

    const removedToken =
      typeof tokenOrEntry === "string" ? tokenOrEntry : tokenOrEntry?.token;
    const identifier =
      typeof tokenOrEntry === "string"
        ? getHistoryIdentifier(
            history?.find?.((obj) => obj.token === tokenOrEntry) || {
              token: tokenOrEntry,
            }
          )
        : getHistoryIdentifier(tokenOrEntry || {});

    if (!identifier) return;

    const newHistory = history?.filter(
      (obj) => !matchesHistoryEntry(obj, tokenOrEntry || {})
    );
    try {
      localStorage.setItem("history", JSON.stringify(newHistory));
    } catch {}
    mutateHistory(newHistory, false);

    if (selectedToken?.token === removedToken) {
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
