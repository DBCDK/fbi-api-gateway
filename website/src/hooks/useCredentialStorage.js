import useSWR from "swr";

import { normalizeCredentialEntry } from "@/utils/credentials";
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

function getInitialHistory() {
  if (!isBrowser) {
    return [];
  }

  return safeGetItem(localStorage, APPLICATIONS_KEY, []) || [];
}

function getInitialSelectedCredential() {
  if (!isBrowser) {
    return null;
  }

  return safeGetItem(sessionStorage, SELECTED_APPLICATION_KEY, null);
}

export default function useCredentialStorage() {
  const { data: history = [], mutate: mutateHistory } = useSWR(
    APPLICATIONS_KEY,
    getInitialHistory,
    { fallbackData: [] }
  );

  const { data: selectedCredential, mutate: mutateSelectedCredential } = useSWR(
    SELECTED_APPLICATION_KEY,
    getInitialSelectedCredential,
    { fallbackData: null }
  );

  const persistHistory = (nextHistory) => {
    try {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(nextHistory));
    } catch {}
    mutateHistory(nextHistory, false);
  };

  const persistSelectedCredential = (entry) => {
    try {
      if (!entry) {
        sessionStorage.removeItem(SELECTED_APPLICATION_KEY);
      } else {
        sessionStorage.setItem(
          SELECTED_APPLICATION_KEY,
          JSON.stringify(entry)
        );
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

    const sliced = copy.slice(0, MAX_CLIENT_ENTRIES);
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
