import { useEffect, useRef, useState } from "react";

export default function useCredentialSessionRecovery({
  entry,
  enabled = true,
  configurationStatus,
  internalNetworkCheck,
  resolveCredentialValue,
  setCredentialEntry,
  selectCredential,
  mutateConfiguration,
  mutateUser,
}) {
  const [isRehydratingSession, setIsRehydratingSession] = useState(false);
  const rehydratedSessionKeyRef = useRef(null);

  useEffect(() => {
    const sessionLookupFailed =
      enabled && entry?.type === "client" && configurationStatus === "EXPIRED";
    const rehydrationValue =
      internalNetworkCheck === "enabled" && entry?.clientId
        ? entry.clientId
        : entry?.token || entry?.clientId || null;
    const rehydrationKey = [
      entry?.id || "",
      internalNetworkCheck,
      rehydrationValue || "",
    ].join(":");

    if (
      entry?.isPending ||
      !sessionLookupFailed ||
      !rehydrationValue ||
      !entry?.id
    ) {
      return undefined;
    }

    if (rehydratedSessionKeyRef.current === rehydrationKey) {
      return undefined;
    }

    rehydratedSessionKeyRef.current = rehydrationKey;
    let isCancelled = false;

    async function rehydrateMissingSessionEntry() {
      setIsRehydratingSession(true);

      try {
        const response = await resolveCredentialValue({
          value: rehydrationValue,
          entryId: entry.id,
          agency: entry.agency,
        });

        if (isCancelled) {
          return;
        }

        if (response?.safeEntry) {
          setCredentialEntry(
            {
              ...response.safeEntry,
              note: entry.note || "",
            },
            false
          );

          if (entry.inUse && response.safeEntry.token) {
            selectCredential(
              response.safeEntry.token,
              response.safeEntry.profile,
              response.safeEntry.agency,
              {
                id: response.safeEntry.id,
                type: response.safeEntry.type,
                clientId: response.safeEntry.clientId,
              },
              { reorderApplications: false }
            );
          }

          mutateConfiguration?.();
          mutateUser?.();
          return;
        }

        setCredentialEntry(
          {
            id: entry.id,
            type: entry.type,
            token: entry.token,
            clientId: entry.clientId,
            note: entry.note || "",
            status:
              response?.status === "CLIENT_SECRET_REQUIRED"
                ? "CLIENT_SECRET_REQUIRED"
                : response?.statusCode === 404
                  ? "EXPIRED"
                  : "ERROR",
            message:
              response?.message || "Could not restore application session",
          },
          false
        );
      } finally {
        if (!isCancelled) {
          setIsRehydratingSession(false);
        }
      }
    }

    rehydrateMissingSessionEntry();

    return () => {
      isCancelled = true;
    };
  }, [
    configurationStatus,
    enabled,
    entry?.agency,
    entry?.clientId,
    entry?.id,
    entry?.inUse,
    entry?.isPending,
    entry?.note,
    entry?.token,
    entry?.type,
    internalNetworkCheck,
    mutateConfiguration,
    mutateUser,
    resolveCredentialValue,
    selectCredential,
    setCredentialEntry,
  ]);

  return {
    isRehydratingSession,
  };
}
