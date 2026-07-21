import useSWR from "swr";

const isBrowser = typeof window !== "undefined";
const SELECTED_CREDENTIAL_KEY = "selectedCredentialApplication";
export const SELECTED_CREDENTIAL_CLEARED_EVENT =
  "credentials:selected-cleared";

function safeGetItem(storage, key, fallback = null) {
  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function isAccessToken(token) {
  if (typeof token !== "string") {
    return false;
  }

  const stripped = token.replace(/test.*:/, "");
  return stripped.length === 40;
}

export function matchesSelectedCredentialIdentity(
  selectedCredential = {},
  token,
  metadata = null
) {
  if (!selectedCredential) {
    return false;
  }

  return (
    selectedCredential?.token === token ||
    (metadata?.clientId &&
      selectedCredential?.clientId &&
      selectedCredential.clientId === metadata.clientId) ||
    (metadata?.id &&
      selectedCredential?.id &&
      selectedCredential.id === metadata.id)
  );
}

export default function useSelectedCredential() {
  const { data: selectedCredential, mutate: mutateSelectedCredential } = useSWR(
    SELECTED_CREDENTIAL_KEY,
    (key) => (isBrowser ? safeGetItem(sessionStorage, key, null) : null),
    { fallbackData: null }
  );

  const setSelectedCredential = (value) => {
    if (!isBrowser || !value?.token || !isAccessToken(value.token)) {
      return null;
    }

    try {
      sessionStorage.setItem(SELECTED_CREDENTIAL_KEY, JSON.stringify(value));
    } catch {}

    mutateSelectedCredential(value, false);
    return value;
  };

  const clearSelectedCredential = () => {
    if (!isBrowser) {
      return;
    }

    const clearedCredential = selectedCredential || null;

    try {
      sessionStorage.removeItem(SELECTED_CREDENTIAL_KEY);
    } catch {}

    mutateSelectedCredential(null, false);

    window.dispatchEvent(
      new CustomEvent(SELECTED_CREDENTIAL_CLEARED_EVENT, {
        detail: clearedCredential,
      })
    );
  };

  return {
    selectedCredential,
    setSelectedCredential,
    clearSelectedCredential,
    mutateSelectedCredential,
  };
}
