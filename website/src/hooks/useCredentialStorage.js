import useSWR from "swr";

import { normalizeCredentialEntry } from "@/utils/credentials";

const isBrowser = typeof window !== "undefined";
const HISTORY_KEY = "credentialHistory";
const SELECTED_KEY = "selectedCredential";
const LEGACY_HISTORY_KEY = "history";
const LEGACY_SELECTED_KEY = "selectedToken";

const safeGetItem = (storage, key, fallback = null) => {
  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

function getInitialHistory() {
  if (!isBrowser) {
    return [];
  }

  const current = safeGetItem(localStorage, HISTORY_KEY, null);
  if (current) {
    return current;
  }

  const legacy = safeGetItem(localStorage, LEGACY_HISTORY_KEY, []);
  return legacy
    .map((entry) => normalizeCredentialEntry({ ...entry, type: "token" }))
    .filter(Boolean);
}

function getInitialSelectedCredential() {
  if (!isBrowser) {
    return null;
  }

  const current = safeGetItem(sessionStorage, SELECTED_KEY, null);
  if (current) {
    return current;
  }

  const legacy = safeGetItem(sessionStorage, LEGACY_SELECTED_KEY, null);
  return legacy ? normalizeCredentialEntry({ ...legacy, type: "token" }) : null;
}

export default function useCredentialStorage() {
  const { data: history = [], mutate: mutateHistory } = useSWR(
    HISTORY_KEY,
    getInitialHistory,
    { fallbackData: [] }
  );

  const { data: selectedCredential, mutate: mutateSelectedCredential } = useSWR(
    SELECTED_KEY,
    getInitialSelectedCredential,
    { fallbackData: null }
  );

  const persistHistory = (nextHistory) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {}
    mutateHistory(nextHistory, false);
  };

  const persistSelectedCredential = (entry) => {
    try {
      if (!entry) {
        sessionStorage.removeItem(SELECTED_KEY);
      } else {
        sessionStorage.setItem(SELECTED_KEY, JSON.stringify(entry));
      }
    } catch {}

    mutateSelectedCredential(entry, false);
  };

  const setSelectedCredential = (input, profile, agency) => {
    const current =
      typeof input === "object" && input?.id === selectedCredential?.id
        ? selectedCredential
        : {};

    const entry = normalizeCredentialEntry(
      typeof input === "object" ? input : { value: input, profile, agency },
      current
    );

    if (!isBrowser || !entry) {
      return null;
    }

    persistSelectedCredential(entry);
    setHistoryItem(entry, false);
    return entry;
  };

  const removeSelectedCredential = () => {
    if (!isBrowser) return;
    persistSelectedCredential(null);
  };

  const setHistoryItem = (input, shallow = true) => {
    const existing = history?.find((item) => {
      const normalized = normalizeCredentialEntry(input);
      return normalized && item.id === normalized.id;
    });

    const entry = normalizeCredentialEntry(input, existing || {});

    if (!isBrowser || !entry) {
      return null;
    }

    let copy = [...history];

    if (shallow) {
      const index = copy.findIndex((item) => item.id === entry.id);
      if (index !== -1) {
        copy[index] = { ...copy[index], ...entry };
      } else {
        copy.unshift(entry);
      }
    } else {
      copy = copy.filter((item) => item.id !== entry.id);
      copy.unshift(entry);
    }

    const sliced = copy.slice(0, 10);
    persistHistory(sliced);
    return entry;
  };

  const removeHistoryItem = (idOrValue) => {
    if (!isBrowser) {
      return;
    }

    const normalized = normalizeCredentialEntry({ value: idOrValue }) || {
      id: idOrValue,
    };
    const nextHistory = history.filter((item) => item.id !== normalized.id);
    persistHistory(nextHistory);

    if (selectedCredential?.id === normalized.id) {
      removeSelectedCredential();
    }
  };

  const getHistoryItem = (idOrValue) => {
    const normalized = normalizeCredentialEntry({ value: idOrValue }) || {
      id: idOrValue,
    };
    return history.find((item) => item.id === normalized.id) || null;
  };

  return {
    selectedCredential,
    setSelectedCredential,
    removeSelectedCredential,
    history,
    setHistoryItem,
    getHistoryItem,
    removeHistoryItem,

    // Temporary aliases while the rest of the app is migrating.
    selectedToken: selectedCredential,
    setSelectedToken: setSelectedCredential,
    removeSelectedToken: removeSelectedCredential,
  };
}
