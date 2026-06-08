import { useEffect } from "react";
import useSWR from "swr";

import useApplications, {
  getApplicationIdentifier,
  getCanonicalApplicationId,
} from "./useApplications";

const isBrowser = typeof window !== "undefined";
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

export const getHistoryIdentifier = getApplicationIdentifier;
export const getCanonicalId = getCanonicalApplicationId;

const matchesApplicationEntry = (left = {}, right = {}) => {
  const leftIdentifier = getApplicationIdentifier(left);
  const rightIdentifier = getApplicationIdentifier(right);

  return (
    (leftIdentifier && rightIdentifier && leftIdentifier === rightIdentifier) ||
    (left.clientId && right.clientId && left.clientId === right.clientId) ||
    (left.token && right.token && left.token === right.token)
  );
};

export const shouldClearSelectedTokenAfterRemoval = (
  selectedToken,
  removedEntry,
  applications = []
) => {
  if (!selectedToken) {
    return false;
  }

  const selectedIdentifier = getApplicationIdentifier(selectedToken);
  const selectedCanonicalId = getCanonicalApplicationId(selectedToken);
  const removedIdentifier =
    typeof removedEntry === "string"
      ? removedEntry
      : getApplicationIdentifier(removedEntry || {}) ||
        getCanonicalApplicationId(removedEntry || {});

  if (
    matchesApplicationEntry(selectedToken, removedEntry || {}) ||
    (selectedIdentifier && selectedIdentifier === removedIdentifier) ||
    (selectedCanonicalId && selectedCanonicalId === removedIdentifier)
  ) {
    return true;
  }

  return !applications.some((item) => {
    const itemIdentifier = getApplicationIdentifier(item);
    const itemCanonicalId = getCanonicalApplicationId(item);

    return (
      matchesApplicationEntry(item, selectedToken) ||
      (selectedIdentifier && itemIdentifier === selectedIdentifier) ||
      (selectedCanonicalId && itemCanonicalId === selectedCanonicalId)
    );
  });
};

export default function useStorage() {
  const {
    applications,
    hasFetchedApplications,
    setApplicationItem,
    removeApplicationItem,
    getApplicationItem,
  } = useApplications();

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

    const { reorderApplications = true, reorderHistory } = options;
    const shouldReorderApplications =
      reorderHistory === undefined ? reorderApplications : reorderHistory;
    const current = selectedToken?.token === token ? selectedToken : {};
    const applicationItem =
      metadata?.id || metadata?.clientId
        ? null
        : applications?.find?.((item) => item?.token === token) || null;
    const value = {
      token,
      profile: profile === undefined ? current?.profile ?? null : profile,
      agency: agency === undefined ? current?.agency ?? null : agency,
      id: getCanonicalApplicationId({
        id: metadata?.id ?? applicationItem?.id ?? current?.id ?? null,
        type:
          metadata?.type ??
          applicationItem?.type ??
          current?.type ??
          null,
        token,
        clientId:
          metadata?.clientId ??
          applicationItem?.clientId ??
          current?.clientId ??
          null,
      }),
      type:
        metadata?.type ??
        applicationItem?.type ??
        current?.type ??
        null,
      clientId:
        metadata?.clientId ??
        applicationItem?.clientId ??
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
      reorderApplications: shouldReorderApplications,
    });
    mutateSelectedToken(value, false);
    if (shouldReorderApplications) {
      setApplicationEntry(value, false);
    }
  };

  const removeSelectedToken = () => {
    if (!isBrowser) return;
    try {
      sessionStorage.removeItem(SELECTED_APPLICATION_KEY);
    } catch {}
    mutateSelectedToken(null, false);
  };

  useEffect(() => {
    if (!isBrowser || !hasFetchedApplications || !selectedToken) {
      return;
    }

    if (
      !shouldClearSelectedTokenAfterRemoval(selectedToken, null, applications)
    ) {
      return;
    }

    console.info(
      "[credentials][storage] clearing stale selected token after applications sync",
      {
        selectedId: selectedToken?.id || null,
        selectedClientId: selectedToken?.clientId || null,
        applicationCount: applications.length,
      }
    );

    removeSelectedToken();
  }, [applications, hasFetchedApplications, selectedToken]);

  const setApplicationEntry = (
    { token, profile, agency, note: _note, ...rest },
    shallow = true
  ) => {
    if (!isBrowser) return null;

    const nextRest = {
      ...rest,
      id: getCanonicalApplicationId({
        id: rest?.id || null,
        type: rest?.type || null,
        token,
        clientId: rest?.clientId || null,
      }),
    };

    const identifier = getApplicationIdentifier({ token, ...nextRest });

    if (!identifier || (!isToken(token) && !nextRest.clientId)) return null;

    const existing = applications?.find((obj) =>
      matchesApplicationEntry(obj, { token, ...nextRest })
    );
    const note = typeof _note === "string" ? _note : existing?.note || "";
    const operation = shallow && existing ? "update" : "insert";

    console.info("[credentials][storage] setApplicationEntry", {
      operation,
      id: nextRest?.id || null,
      type: nextRest?.type || null,
      clientId: nextRest?.clientId || null,
      tokenPreview: typeof token === "string" ? `${token.slice(0, 6)}...` : null,
      applicationCount: applications.length,
      matchedExistingId: existing?.id || null,
    });

    return setApplicationItem(
      {
        token,
        profile,
        agency,
        note,
        ...nextRest,
      },
      shallow
    );
  };

  const removeApplicationEntry = (tokenOrEntry) => {
    if (!isBrowser) return;

    const identifier =
      typeof tokenOrEntry === "string"
        ? getApplicationIdentifier(
            applications?.find?.((obj) => obj.token === tokenOrEntry) || {
              token: tokenOrEntry,
            }
          )
        : getApplicationIdentifier(tokenOrEntry || {});

    if (!identifier) return;

    const nextApplications = (applications || []).filter((item) => {
      const itemIdentifier = getApplicationIdentifier(item);
      return itemIdentifier !== identifier && item.id !== identifier;
    });

    removeApplicationItem(identifier);

    if (
      shouldClearSelectedTokenAfterRemoval(
        selectedToken,
        tokenOrEntry || identifier,
        nextApplications
      )
    ) {
      console.info("[credentials][storage] clearing stale selected token", {
        selectedId: selectedToken?.id || null,
        selectedClientId: selectedToken?.clientId || null,
        removedIdentifier: identifier,
        remainingApplications: nextApplications.length,
      });
      removeSelectedToken();
    }
  };

  const getApplicationEntry = (tokenOrEntry) => {
    if (typeof tokenOrEntry === "string" && isToken(tokenOrEntry)) {
      return applications?.find((obj) => obj.token === tokenOrEntry) || null;
    }

    const identifier =
      typeof tokenOrEntry === "string"
        ? tokenOrEntry
        : getApplicationIdentifier(tokenOrEntry || {});

    return getApplicationItem(identifier);
  };

  const setHistoryItem = setApplicationEntry;
  const getHistoryItem = getApplicationEntry;
  const removeHistoryItem = removeApplicationEntry;

  return {
    selectedToken,
    setSelectedToken,
    removeSelectedToken,
    history: applications,
    applications,
    setApplicationEntry,
    getApplicationEntry,
    removeApplicationEntry,
    setHistoryItem,
    getHistoryItem,
    removeHistoryItem,
  };
}
