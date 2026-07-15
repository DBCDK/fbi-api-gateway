import { useCallback, useEffect } from "react";

import useApplications, {
  getApplicationIdentifier,
  getCanonicalApplicationId,
} from "../useApplications";
import useSelectedCredential from "./useSelectedCredential";

const isBrowser = typeof window !== "undefined";

const isAccessToken = (token) => {
  if (typeof token !== "string") {
    return false;
  }

  const stripped = token.replace(/test.*:/, "");
  return stripped.length === 40;
};

export { getApplicationIdentifier as getCredentialEntryIdentifier };
export { getCanonicalApplicationId as getCredentialEntryId };

export function matchesCredentialEntry(left = {}, right = {}) {
  const leftIdentifier = getApplicationIdentifier(left);
  const rightIdentifier = getApplicationIdentifier(right);

  return (
    (leftIdentifier && rightIdentifier && leftIdentifier === rightIdentifier) ||
    (left.clientId && right.clientId && left.clientId === right.clientId) ||
    (left.token && right.token && left.token === right.token)
  );
}

export function shouldClearSelectedCredentialAfterRemoval(
  selectedCredential,
  removedEntry,
  entries = []
) {
  if (!selectedCredential) {
    return false;
  }

  const selectedIdentifier = getApplicationIdentifier(selectedCredential);
  const selectedCanonicalId = getCanonicalApplicationId(selectedCredential);
  const removedIdentifier =
    typeof removedEntry === "string"
      ? removedEntry
      : getApplicationIdentifier(removedEntry || {}) ||
        getCanonicalApplicationId(removedEntry || {});

  if (
    matchesCredentialEntry(selectedCredential, removedEntry || {}) ||
    (selectedIdentifier && selectedIdentifier === removedIdentifier) ||
    (selectedCanonicalId && selectedCanonicalId === removedIdentifier)
  ) {
    return true;
  }

  return !entries.some((item) => {
    const itemIdentifier = getApplicationIdentifier(item);
    const itemCanonicalId = getCanonicalApplicationId(item);

    return (
      matchesCredentialEntry(item, selectedCredential) ||
      (selectedIdentifier && itemIdentifier === selectedIdentifier) ||
      (selectedCanonicalId && itemCanonicalId === selectedCanonicalId)
    );
  });
}

export default function useCredentialEntries() {
  const {
    applications,
    hasFetchedApplications,
    mutateApplications,
    setApplicationItem,
    removeApplicationItem,
    getApplicationItem,
  } = useApplications();
  const { selectedCredential, clearSelectedCredential } = useSelectedCredential();

  const setCredentialEntry = useCallback(
    ({ token, profile, agency, note: draftNote, ...rest }, shallow = true) => {
      if (!isBrowser) {
        return null;
      }

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

      if (!identifier || (!isAccessToken(token) && !nextRest.clientId)) {
        return null;
      }

      const existing = applications?.find((entry) =>
        matchesCredentialEntry(entry, { token, ...nextRest })
      );
      const note =
        typeof draftNote === "string" ? draftNote : existing?.note || "";

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
    },
    [applications, setApplicationItem]
  );

  const removeCredentialEntry = useCallback(
    (tokenOrEntry) => {
      if (!isBrowser) {
        return;
      }

      const identifier =
        typeof tokenOrEntry === "string"
          ? getApplicationIdentifier(
              applications?.find?.((entry) => entry.token === tokenOrEntry) || {
                token: tokenOrEntry,
              }
            )
          : getApplicationIdentifier(tokenOrEntry || {});

      if (!identifier) {
        return;
      }

      const nextEntries = (applications || []).filter((entry) => {
        const entryIdentifier = getApplicationIdentifier(entry);
        return entryIdentifier !== identifier && entry.id !== identifier;
      });

      removeApplicationItem(identifier);

      if (
        shouldClearSelectedCredentialAfterRemoval(
          selectedCredential,
          tokenOrEntry || identifier,
          nextEntries
        )
      ) {
        clearSelectedCredential();
      }
    },
    [
      applications,
      clearSelectedCredential,
      removeApplicationItem,
      selectedCredential,
    ]
  );

  const getCredentialEntry = useCallback(
    (tokenOrEntry) => {
      if (typeof tokenOrEntry === "string" && isAccessToken(tokenOrEntry)) {
        return applications?.find((entry) => entry.token === tokenOrEntry) || null;
      }

      const identifier =
        typeof tokenOrEntry === "string"
          ? tokenOrEntry
          : getApplicationIdentifier(tokenOrEntry || {});

      return getApplicationItem(identifier);
    },
    [applications, getApplicationItem]
  );

  useEffect(() => {
    if (!isBrowser || !hasFetchedApplications || !selectedCredential) {
      return;
    }

    if (
      !shouldClearSelectedCredentialAfterRemoval(
        selectedCredential,
        null,
        applications
      )
    ) {
      return;
    }

    clearSelectedCredential();
  }, [
    applications,
    clearSelectedCredential,
    hasFetchedApplications,
    selectedCredential,
  ]);

  return {
    credentialEntries: applications,
    applications,
    hasFetchedApplications,
    mutateCredentialEntries: mutateApplications,
    setCredentialEntry,
    removeCredentialEntry,
    getCredentialEntry,
  };
}
