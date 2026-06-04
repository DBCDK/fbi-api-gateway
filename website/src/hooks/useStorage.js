import useSWR from "swr";
import { toCredentialId } from "@/utils/credentials";
import { MAX_CLIENT_ENTRIES } from "@/utils/clientEntries";

const isBrowser = typeof window !== "undefined";
const APPLICATIONS_KEY = "credentialApplications";
const SELECTED_APPLICATION_KEY = "selectedCredentialApplication";

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

export const getHistoryIdentifier = (entry = {}) => {
  const { id, token, clientId } = entry || {};
  return clientId ? `client:${clientId}` : id || token || null;
};

export const getCanonicalId = (entry = {}) => {
  const { id, type, token, clientId } = entry || {};
  return id || toCredentialId({ type, token, clientId }) || null;
};

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

    if (typeof window !== "undefined") {
      console.info("[credentials][storage] normalize merge", {
        incomingId: item?.id || null,
        incomingType: item?.type || null,
        incomingClientId: item?.clientId || null,
        incomingTokenPreview:
          typeof item?.token === "string" ? `${item.token.slice(0, 6)}...` : null,
        existingId: acc[existingIndex]?.id || null,
        existingType: acc[existingIndex]?.type || null,
        existingClientId: acc[existingIndex]?.clientId || null,
      });
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
    APPLICATIONS_KEY,
    (key) =>
      isBrowser ? normalizeHistory(safeGetItem(localStorage, key, [])) : [],
    { fallbackData: [] }
  );

  const { data: selectedToken, mutate: mutateSelectedToken } = useSWR(
    SELECTED_APPLICATION_KEY,
    (key) => (isBrowser ? safeGetItem(sessionStorage, key, null) : null),
    { fallbackData: null }
  );

  const setSelectedToken = (
    token,
    profile,
    agency,
    metadata = null,
    options = {}
  ) => {
    if (!isBrowser || !isToken(token)) return;

    const { reorderHistory = true } = options;
    const current = selectedToken?.token === token ? selectedToken : {};
    const historyItem =
      metadata?.id || metadata?.clientId
        ? null
        : history?.find?.((item) => item?.token === token) || null;
    const value = {
      token,
      profile: profile === undefined ? current?.profile ?? null : profile,
      agency: agency === undefined ? current?.agency ?? null : agency,
      id: getCanonicalId({
        id: metadata?.id ?? historyItem?.id ?? current?.id ?? null,
        type:
          metadata?.type ??
          historyItem?.type ??
          current?.type ??
          null,
        token,
        clientId:
          metadata?.clientId ??
          historyItem?.clientId ??
          current?.clientId ??
          null,
      }),
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
      sessionStorage.setItem(SELECTED_APPLICATION_KEY, JSON.stringify(value));
    } catch {}
    console.info("[credentials][storage] setSelectedToken", {
      id: value.id || null,
      type: value.type || null,
      clientId: value.clientId || null,
      tokenPreview: `${token.slice(0, 6)}...`,
      profile: value.profile || null,
      agency: value.agency || null,
      reorderHistory,
    });
    mutateSelectedToken(value, false);
    if (reorderHistory) {
      setHistoryItem(value, false);
    }
  };

  const removeSelectedToken = () => {
    if (!isBrowser) return;
    try {
      sessionStorage.removeItem(SELECTED_APPLICATION_KEY);
    } catch {}
    mutateSelectedToken(null, false);
  };

  const setHistoryItem = (
    { token, profile, agency, note: _note, ...rest },
    shallow = true
  ) => {
    if (!isBrowser) return;

    const nextRest = {
      ...rest,
      id: getCanonicalId({
        id: rest?.id || null,
        type: rest?.type || null,
        token,
        clientId: rest?.clientId || null,
      }),
    };

    const identifier = getHistoryIdentifier({ token, ...nextRest });

    if (!identifier || (!isToken(token) && !nextRest.clientId)) return;

    const timestamp = Date.now();
    const existing = history?.find((obj) =>
      matchesHistoryEntry(obj, { token, ...nextRest })
    );
    const note = typeof _note === "string" ? _note : existing?.note || "";
    const operation = shallow && existing ? "update" : "insert";

    let copy = [...history];

    if (shallow) {
      const index = history?.findIndex((obj) =>
        matchesHistoryEntry(obj, { token, ...nextRest })
      );
      if (index !== -1) {
        copy[index] = {
          ...existing,
          ...nextRest,
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
          ...nextRest,
        });
      }
    } else {
      copy = copy.filter((obj) =>
        !matchesHistoryEntry(obj, { token, ...nextRest })
      );
      copy.unshift({
        token,
        profile,
        agency,
        note,
        timestamp,
        ...nextRest,
      });
    }

    const sliced = normalizeHistory(copy).slice(0, MAX_CLIENT_ENTRIES);
    try {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(sliced));
    } catch {}
    console.info("[credentials][storage] setHistoryItem", {
      operation,
      id: nextRest?.id || null,
      type: nextRest?.type || null,
      clientId: nextRest?.clientId || null,
      tokenPreview: typeof token === "string" ? `${token.slice(0, 6)}...` : null,
      historySize: sliced.length,
      matchedExistingId: existing?.id || null,
    });
    mutateHistory(sliced, false);
  };

  const removeHistoryItem = (tokenOrEntry) => {
    if (!isBrowser) return;

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
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(newHistory));
    } catch {}
    mutateHistory(newHistory, false);

    if (matchesHistoryEntry(selectedToken, tokenOrEntry || {})) {
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
