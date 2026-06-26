import { useCallback, useEffect, useRef, useState } from "react";

import { SELECTED_CREDENTIAL_CLEARED_EVENT } from "@/hooks/credentials/useSelectedCredential";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import { detectCredentialType } from "@/utils/credentials";
import { isLikelyClientSecret } from "@/utils/credentialState";

const RESOLVE_DELAY_MS = 1200;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function findResolvedClientEntry(applications, clientId) {
  return (
    applications?.find?.(
      (item) => item?.clientId === clientId && item?.token
    ) || null
  );
}

async function prewarmClientConfiguration(entry) {
  const entryId = entry?.id;

  if (!entryId) {
    return null;
  }

  const params = new URLSearchParams({ entryId });

  if (entry?.agency) {
    params.set("agency", entry.agency);
  }

  const response = await fetch(
    `/api/credentials/configuration?${params.toString()}`,
    {
      method: "GET",
      headers: getCredentialRequestHeaders(),
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export default function useCredentialInputFlow({
  applications,
  hasFetchedApplications,
  selectedCredential,
  setCredentialEntry,
  resolveCredentialValue,
  attachCredentialSecret,
  selectCredential,
  clearSelectedCredential,
  onSubmit,
  onChange,
  blurInput,
  focusInput,
}) {
  const [credentialValue, setCredentialValue] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [pendingClient, setPendingClient] = useState(null);
  const [resolveError, setResolveError] = useState("");
  const [resolvingCredential, setResolvingCredential] = useState(null);

  const inputRef = useRef(null);
  const lastResolvedCredentialRef = useRef("");
  const lastAttachedSecretRef = useRef("");
  const rehydratedClientIdRef = useRef("");
  const lastSyncedSelectedTokenRef = useRef(null);
  const lastSelectedCredentialSnapshotRef = useRef(null);
  const suppressedRehydrateClientIdRef = useRef("");

  const enrichResolvedEntry = useCallback(
    async (entry) => {
      if (!entry?.token || entry?.type !== "client") {
        return entry;
      }

      try {
        const configuration = await prewarmClientConfiguration(entry);

        if (!configuration) {
          return entry;
        }

        const enrichedEntry = {
          ...entry,
          configuration,
          profile: entry.profile || configuration?.profiles?.[0] || null,
          agency: entry.agency || configuration?.agency || null,
        };

        setCredentialEntry(enrichedEntry, false);
        selectCredential(
          enrichedEntry.token,
          enrichedEntry.profile,
          enrichedEntry.agency,
          {
            id: enrichedEntry.id,
            type: enrichedEntry.type,
            clientId: enrichedEntry.clientId,
            hasClientSecret: enrichedEntry.hasClientSecret,
          },
          { reorderApplications: false }
        );

        return enrichedEntry;
      } catch {
        return entry;
      }
    },
    [selectCredential, setCredentialEntry]
  );

  const handleResolveCredential = useCallback(
    async (nextValue, options = {}) => {
      const { shouldSubmit = true, onResolvedSelection } = options;

      if (!nextValue) {
        return;
      }

      const nextInputType = detectCredentialType(nextValue);

      if (!nextInputType) {
        setResolveError("🧐 Input must be a valid token or clientId!");
        return;
      }

      if (nextInputType === "client") {
        const normalizedClientId = nextValue.trim();
        const existingEntry = findResolvedClientEntry(
          applications,
          normalizedClientId
        );

        if (existingEntry?.token) {
          setResolveError("");
          setPendingClient(null);
          setCredentialEntry(existingEntry, false);
          selectCredential(
            existingEntry.token,
            existingEntry.profile,
            existingEntry.agency,
            {
              id: existingEntry.id,
              type: existingEntry.type,
              clientId: existingEntry.clientId,
              hasClientSecret: existingEntry.hasClientSecret,
            },
            { reorderApplications: false }
          );

          if (!shouldSubmit) {
            onResolvedSelection?.();
            blurInput();
          }

          if (shouldSubmit) {
            onSubmit?.(existingEntry.token);
          }

          onChange?.(existingEntry.token);
          return;
        }
      }

      setResolveError("");
      setResolvingCredential({
        type: nextInputType,
        value: nextValue,
      });

      const [response] = await Promise.all([
        resolveCredentialValue({
          value: nextValue,
        }),
        wait(RESOLVE_DELAY_MS),
      ]);

      setResolvingCredential(null);

      if (
        response?.safeEntry?.status === "CLIENT_SECRET_REQUIRED" &&
        nextInputType === "client"
      ) {
        setCredentialEntry(response.safeEntry, false);
        clearSelectedCredential();
        setPendingClient(response.safeEntry);
        setSecretValue("");
        focusInput();
        return;
      }

      if (!response?.safeEntry?.token) {
        setResolveError(
          response?.message || "🧐 Input must be a valid token or clientId!"
        );
        return;
      }

      const resolvedEntry = await enrichResolvedEntry(response.safeEntry);

      if (!shouldSubmit) {
        onResolvedSelection?.();
        blurInput();
      }

      if (shouldSubmit) {
        onSubmit?.(resolvedEntry?.token || response.safeEntry.token);
      }

      onChange?.(resolvedEntry?.token || response.safeEntry.token);
    },
    [
      applications,
      blurInput,
      clearSelectedCredential,
      enrichResolvedEntry,
      focusInput,
      onChange,
      onSubmit,
      resolveCredentialValue,
      selectCredential,
      setCredentialEntry,
    ]
  );

  const handleAttachSecret = useCallback(
    async (options = {}) => {
      const {
        shouldSubmit = true,
        secretOverride = null,
        onResolvedSelection,
      } = options;

      if (!pendingClient?.id) {
        setResolveError(
          "Client setup could not be continued. Please try again."
        );
        return;
      }

      const trimmedSecret =
        typeof secretOverride === "string"
          ? secretOverride.trim()
          : typeof inputRef.current?.value === "string" &&
              inputRef.current.value.trim()
            ? inputRef.current.value.trim()
            : secretValue.trim();

      if (!trimmedSecret) {
        setResolveError("Client secret is required to continue.");
        return;
      }

      setResolveError("");
      setResolvingCredential({
        type: "client-secret",
        value: pendingClient.clientId || pendingClient.id,
      });

      const [response] = await Promise.all([
        attachCredentialSecret({
          entryId: pendingClient.id,
          clientSecret: trimmedSecret,
          agency: pendingClient.agency || null,
        }),
        wait(RESOLVE_DELAY_MS),
      ]);

      setResolvingCredential(null);

      if (!response?.safeEntry?.token) {
        setResolveError(response?.message || "Secret could not be validated.");
        return;
      }

      const resolvedEntry = await enrichResolvedEntry(response.safeEntry);

      lastAttachedSecretRef.current = `${pendingClient.id}:${trimmedSecret}`;
      const resolvedClientId =
        pendingClient.clientId ||
        resolvedEntry?.clientId ||
        response.safeEntry.clientId ||
        "";
      setCredentialValue(resolvedClientId || response.safeEntry.token);
      lastResolvedCredentialRef.current =
        resolvedClientId || response.safeEntry.token || "";
      onResolvedSelection?.();
      setPendingClient(null);
      setSecretValue("");
      blurInput();

      if (shouldSubmit) {
        onSubmit?.(resolvedEntry?.token || response.safeEntry.token);
      }

      onChange?.(resolvedEntry?.token || response.safeEntry.token);
    },
    [
      attachCredentialSecret,
      blurInput,
      enrichResolvedEntry,
      onChange,
      onSubmit,
      pendingClient,
      secretValue,
    ]
  );

  useEffect(() => {
    if (pendingClient) {
      return;
    }

    const nextCredentialValue =
      selectedCredential?.clientId || selectedCredential?.token || "";

    lastResolvedCredentialRef.current = nextCredentialValue;

    if (
      selectedCredential?.token &&
      lastSyncedSelectedTokenRef.current !== selectedCredential.token
    ) {
      lastSyncedSelectedTokenRef.current = selectedCredential.token;
      onChange?.(selectedCredential.token);
    }

    if (!selectedCredential?.token) {
      lastSyncedSelectedTokenRef.current = null;
    }
  }, [
    onChange,
    pendingClient,
    selectedCredential?.clientId,
    selectedCredential?.token,
  ]);

  useEffect(() => {
    if (pendingClient || resolvingCredential) {
      return;
    }

    const previousSelection = lastSelectedCredentialSnapshotRef.current;
    const currentSelection = selectedCredential || null;

    if (
      previousSelection?.token &&
      !currentSelection?.token &&
      !secretValue &&
      (credentialValue === previousSelection.token ||
        credentialValue === previousSelection.clientId)
    ) {
      suppressedRehydrateClientIdRef.current = previousSelection.clientId || "";
      setCredentialValue("");
      onChange?.("");
      lastResolvedCredentialRef.current = "";
      rehydratedClientIdRef.current = "";
    }
  }, [
    credentialValue,
    onChange,
    pendingClient,
    resolvingCredential,
    secretValue,
    selectedCredential,
  ]);

  useEffect(() => {
    if (pendingClient) {
      return;
    }

    const nextInputType = detectCredentialType(credentialValue);

    if (nextInputType !== "client") {
      if (!credentialValue) {
        lastResolvedCredentialRef.current = "";
      }

      return;
    }

    if (selectedCredential?.token === credentialValue) {
      return;
    }

    if (
      selectedCredential?.clientId &&
      selectedCredential.clientId === credentialValue.trim()
    ) {
      lastResolvedCredentialRef.current = credentialValue;
      return;
    }

    if (lastResolvedCredentialRef.current === credentialValue) {
      return;
    }

    lastResolvedCredentialRef.current = credentialValue;
    handleResolveCredential(credentialValue, { shouldSubmit: false });
  }, [
    credentialValue,
    handleResolveCredential,
    pendingClient,
    selectedCredential?.clientId,
    selectedCredential?.token,
  ]);

  useEffect(() => {
    if (
      pendingClient ||
      resolvingCredential ||
      selectedCredential?.token ||
      !hasFetchedApplications
    ) {
      return;
    }

    const normalizedClientId =
      detectCredentialType(credentialValue) === "client"
        ? credentialValue.trim()
        : "";
    const previousSelection = lastSelectedCredentialSnapshotRef.current;

    if (!normalizedClientId) {
      rehydratedClientIdRef.current = "";
      return;
    }

    if (
      suppressedRehydrateClientIdRef.current === normalizedClientId ||
      (previousSelection?.token &&
        !selectedCredential?.token &&
        previousSelection.clientId === normalizedClientId)
    ) {
      return;
    }

    const existingEntry = findResolvedClientEntry(
      applications,
      normalizedClientId
    );

    if (!existingEntry) {
      return;
    }

    if (rehydratedClientIdRef.current === normalizedClientId) {
      return;
    }

    rehydratedClientIdRef.current = normalizedClientId;

    selectCredential(
      existingEntry.token,
      existingEntry.profile,
      existingEntry.agency,
      {
        id: existingEntry.id,
        type: existingEntry.type,
        clientId: existingEntry.clientId,
        hasClientSecret: existingEntry.hasClientSecret,
      },
      { reorderApplications: false }
    );
  }, [
    applications,
    credentialValue,
    hasFetchedApplications,
    pendingClient,
    resolvingCredential,
    selectCredential,
    selectedCredential?.token,
  ]);

  useEffect(() => {
    if (selectedCredential?.token) {
      suppressedRehydrateClientIdRef.current = "";
      return;
    }

    const normalizedClientId =
      detectCredentialType(credentialValue) === "client"
        ? credentialValue.trim()
        : "";

    if (
      suppressedRehydrateClientIdRef.current &&
      normalizedClientId !== suppressedRehydrateClientIdRef.current
    ) {
      suppressedRehydrateClientIdRef.current = "";
    }
  }, [credentialValue, selectedCredential?.token]);

  useEffect(() => {
    if (
      !pendingClient?.id ||
      !isLikelyClientSecret(secretValue) ||
      resolvingCredential
    ) {
      return;
    }

    const attemptKey = `${pendingClient.id}:${secretValue.trim()}`;

    if (lastAttachedSecretRef.current === attemptKey) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastAttachedSecretRef.current = attemptKey;
      handleAttachSecret({ shouldSubmit: false });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [handleAttachSecret, pendingClient, resolvingCredential, secretValue]);

  useEffect(() => {
    function handleSelectedCredentialCleared(event) {
      const clearedCredential = event?.detail || null;

      if (pendingClient || resolvingCredential) {
        return;
      }

      if (
        credentialValue !== clearedCredential?.token &&
        credentialValue !== clearedCredential?.clientId
      ) {
        return;
      }

      suppressedRehydrateClientIdRef.current = clearedCredential?.clientId || "";
      setCredentialValue("");
      setSecretValue("");
      setPendingClient(null);
      setResolveError("");
      lastResolvedCredentialRef.current = "";
      rehydratedClientIdRef.current = "";
      lastSyncedSelectedTokenRef.current = null;
      onChange?.("");
    }

    window.addEventListener(
      SELECTED_CREDENTIAL_CLEARED_EVENT,
      handleSelectedCredentialCleared
    );

    return () => {
      window.removeEventListener(
        SELECTED_CREDENTIAL_CLEARED_EVENT,
        handleSelectedCredentialCleared
      );
    };
  }, [
    credentialValue,
    onChange,
    pendingClient,
    resolvingCredential,
    setResolveError,
  ]);

  useEffect(() => {
    lastSelectedCredentialSnapshotRef.current = selectedCredential || null;
  }, [selectedCredential]);

  const resetCredentialInput = useCallback(() => {
    clearSelectedCredential();
    setCredentialValue("");
    setSecretValue("");
    setPendingClient(null);
    setResolvingCredential(null);
    setResolveError("");
    lastResolvedCredentialRef.current = "";
    lastAttachedSecretRef.current = "";
    rehydratedClientIdRef.current = "";
    lastSyncedSelectedTokenRef.current = null;
    suppressedRehydrateClientIdRef.current = "";
  }, [clearSelectedCredential]);

  return {
    inputRef,
    credentialValue,
    setCredentialValue,
    secretValue,
    setSecretValue,
    pendingClient,
    resolveError,
    setResolveError,
    resolvingCredential,
    handleResolveCredential,
    handleAttachSecret,
    resetCredentialInput,
  };
}
