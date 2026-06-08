import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import useConfiguration from "@/hooks/useConfiguration";
import useCredentialClientSecret from "@/hooks/useCredentialClientSecret";
import useCredentialNetwork from "@/hooks/useCredentialNetwork";
import useCredentialResolve from "@/hooks/useCredentialResolve";
import useInternalNetworkCheck from "@/hooks/useInternalNetworkCheck";
import useStorage from "@/hooks/useStorage";
import { hasAvailableAgency } from "@/utils/configuration";
import { detectCredentialType } from "@/utils/credentials";

const RESOLVE_DELAY_MS = 1200;
const CLIENT_SECRET_PATTERN = /^[0-9a-f]{64}$/i;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isLikelyClientSecret(value) {
  if (typeof value !== "string") {
    return false;
  }

  return CLIENT_SECRET_PATTERN.test(value.trim());
}

export default function useConnectController({
  id,
  onSubmit,
  onChange,
  onValidityChange,
  onPendingChange,
}) {
  const {
    applications,
    hasFetchedApplications,
    selectedToken,
    setSelectedToken,
    removeSelectedToken,
    setHistoryItem,
  } = useStorage();
  const { resolveCredential } = useCredentialResolve();
  const { attachClientSecret } = useCredentialClientSecret();
  const { isInternal: isDetectedInternal, isLoading: isNetworkLoading } =
    useCredentialNetwork();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const { configuration, status, isLoading } = useConfiguration(selectedToken);

  const [credentialValue, setCredentialValue] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [hasFocus, setHasFocus] = useState(false);
  const [pendingClient, setPendingClient] = useState(null);
  const [resolveError, setResolveError] = useState("");
  const [resolvingCredential, setResolvingCredential] = useState(null);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const lastResolvedCredentialRef = useRef("");
  const lastAttachedSecretRef = useRef("");
  const rehydratedClientIdRef = useRef("");
  const lastSyncedSelectedTokenRef = useRef(null);

  const syncFocusState = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      setHasFocus(false);
      return;
    }

    setHasFocus(container.contains(document.activeElement));
  }, []);

  const blurInput = useCallback(() => {
    window.setTimeout(() => {
      inputRef?.current?.blur();
    }, 0);
  }, []);

  const focusInput = useCallback(() => {
    window.setTimeout(() => {
      inputRef?.current?.focus();
    }, 0);
  }, []);

  const handleResolveCredential = useCallback(
    async function handleResolveCredential(nextValue, options = {}) {
      const { shouldSubmit = true } = options;

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
        const existingEntry =
          applications?.find?.(
            (item) => item?.clientId === normalizedClientId && item?.token
          ) || null;

        if (existingEntry?.hasClientSecret) {
          setResolveError("");
          setPendingClient(null);
          setHistoryItem(existingEntry, false);
          setSelectedToken(
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
            setHasFocus(false);
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
        resolveCredential({
          value: nextValue,
        }),
        wait(RESOLVE_DELAY_MS),
      ]);

      setResolvingCredential(null);

      if (
        response?.safeEntry?.status === "CLIENT_SECRET_REQUIRED" &&
        nextInputType === "client"
      ) {
        setHistoryItem(response.safeEntry, false);
        removeSelectedToken();
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

      setHistoryItem(response.safeEntry, false);
      setSelectedToken(
        response.safeEntry.token,
        response.safeEntry.profile,
        response.safeEntry.agency,
        {
          id: response.safeEntry.id,
          type: response.safeEntry.type,
          clientId: response.safeEntry.clientId,
          hasClientSecret: response.safeEntry.hasClientSecret,
        },
        { reorderApplications: false }
      );
      if (!shouldSubmit) {
        setHasFocus(false);
        blurInput();
      }
      if (shouldSubmit) {
        onSubmit?.(response.safeEntry.token);
      }
      onChange?.(response.safeEntry.token);
    },
    [
      applications,
      blurInput,
      focusInput,
      onChange,
      onSubmit,
      removeSelectedToken,
      resolveCredential,
      setHistoryItem,
      setSelectedToken,
    ]
  );

  const handleAttachSecret = useCallback(
    async function handleAttachSecret(options = {}) {
      const { shouldSubmit = true, secretOverride = null } = options;

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
        attachClientSecret({
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

      lastAttachedSecretRef.current = `${pendingClient.id}:${trimmedSecret}`;
      setHistoryItem(response.safeEntry, false);
      const resolvedClientId =
        pendingClient.clientId || response.safeEntry.clientId || "";
      setCredentialValue(resolvedClientId || response.safeEntry.token);
      lastResolvedCredentialRef.current =
        resolvedClientId || response.safeEntry.token || "";
      setSelectedToken(
        response.safeEntry.token,
        response.safeEntry.profile,
        response.safeEntry.agency,
        {
          id: response.safeEntry.id,
          type: response.safeEntry.type,
          clientId: response.safeEntry.clientId,
          hasClientSecret: response.safeEntry.hasClientSecret,
        },
        { reorderApplications: false }
      );
      setHasFocus(false);
      setPendingClient(null);
      setSecretValue("");
      blurInput();

      if (shouldSubmit) {
        onSubmit?.(response.safeEntry.token);
      }
      onChange?.(response.safeEntry.token);
    },
    [
      attachClientSecret,
      blurInput,
      onChange,
      onSubmit,
      pendingClient,
      secretValue,
      setHistoryItem,
      setSelectedToken,
    ]
  );

  useEffect(() => {
    if (pendingClient) {
      return;
    }

    const nextCredentialValue =
      selectedToken?.clientId || selectedToken?.token || "";

    lastResolvedCredentialRef.current = nextCredentialValue;

    if (
      selectedToken?.token &&
      lastSyncedSelectedTokenRef.current !== selectedToken.token
    ) {
      lastSyncedSelectedTokenRef.current = selectedToken.token;
      onChange?.(selectedToken.token);
    }

    if (!selectedToken?.token) {
      lastSyncedSelectedTokenRef.current = null;
    }
  }, [onChange, pendingClient, selectedToken?.clientId, selectedToken?.token]);

  useEffect(() => {
    const nextIsValid = pendingClient
      ? Boolean(secretValue.trim())
      : Boolean(selectedToken?.token) && !resolvingCredential;

    onValidityChange?.(nextIsValid);
  }, [
    onValidityChange,
    pendingClient,
    resolvingCredential,
    secretValue,
    selectedToken?.token,
  ]);

  useEffect(() => {
    onPendingChange?.(Boolean(resolvingCredential));
  }, [onPendingChange, resolvingCredential]);

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

    if (selectedToken?.token === credentialValue) {
      return;
    }

    if (
      selectedToken?.clientId &&
      selectedToken.clientId === credentialValue.trim()
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
    selectedToken?.clientId,
    selectedToken?.token,
  ]);

  useEffect(() => {
    if (
      pendingClient ||
      resolvingCredential ||
      selectedToken?.token ||
      !hasFetchedApplications
    ) {
      return;
    }

    const normalizedClientId =
      detectCredentialType(credentialValue) === "client"
        ? credentialValue.trim()
        : "";

    if (!normalizedClientId) {
      rehydratedClientIdRef.current = "";
      return;
    }

    const existingEntry =
      applications?.find?.(
        (item) => item?.clientId === normalizedClientId && item?.token
      ) || null;

    if (!existingEntry) {
      return;
    }

    if (rehydratedClientIdRef.current === normalizedClientId) {
      return;
    }

    rehydratedClientIdRef.current = normalizedClientId;

    setSelectedToken(
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
    selectedToken?.token,
    setSelectedToken,
  ]);

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

  const currentApplicationEntry =
    applications?.find?.(
      (item) =>
        (selectedToken?.clientId && item?.clientId === selectedToken.clientId) ||
        (selectedToken?.token && item?.token === selectedToken.token)
    ) || null;
  const effectiveProfile =
    selectedToken?.profile ?? configuration?.profiles?.[0] ?? null;

  const hasResolvedDisplay =
    Boolean(configuration?.displayName) &&
    Boolean(selectedToken?.token) &&
    !pendingClient;
  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";
  const hasMissingConfigurationWarning =
    !isLoading &&
    !hasValidationError &&
    selectedToken?.token &&
    (!effectiveProfile || !hasAvailableAgency(configuration));

  const inputType = detectCredentialType(credentialValue);
  const acceptsCredential = inputType === "token" || inputType === "client";
  const resolvedClientId =
    pendingClient?.clientId ||
    configuration?.resolvedClientId ||
    selectedToken?.clientId ||
    (inputType === "client" ? credentialValue.trim() : "");
  const hasResolvedClientId = Boolean(resolvedClientId);
  const hasResolvedClientSecret = Boolean(
    secretValue.trim() ||
      pendingClient?.hasClientSecret ||
      selectedToken?.hasClientSecret ||
      currentApplicationEntry?.hasClientSecret ||
      configuration?.resolvedHasClientSecret
  );
  const credentialError =
    !pendingClient &&
    !selectedToken?.token &&
    credentialValue &&
    !acceptsCredential
      ? "🧐 Invalid token or clientId!"
      : "";

  const expiredError =
    hasValidationError && status === "EXPIRED" && "😔 This token is expired!";
  const invalidError =
    hasValidationError && status === "INVALID" && "🧐 This token is invalid!";
  const unknownError =
    hasValidationError && status === "ERROR" && "🤔 Error validating token!";

  const isResolvingCredential = Boolean(resolvingCredential);
  const isResolvingClientId =
    resolvingCredential?.type === "client" ||
    resolvingCredential?.type === "token";
  const hasCompletedClientIdStep = hasResolvedClientId && !isResolvingClientId;

  const isEffectiveInternalNetwork =
    !isNetworkLoading &&
    isDetectedInternal &&
    internalNetworkCheck !== "disabled";

  const canShowSteps = !isNetworkLoading && !isEffectiveInternalNetwork;
  const showSteps = canShowSteps && hasResolvedClientId;

  const feedbackMessage =
    resolveError ||
    credentialError ||
    expiredError ||
    invalidError ||
    unknownError;

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    window.setTimeout(syncFocusState, 0);
  }, [feedbackMessage, syncFocusState]);

  const showPendingClientMessage = pendingClient && !resolveError;
  const showReadyMessage = hasResolvedDisplay && !pendingClient;
  const effectiveCredentialValue =
    pendingClient
      ? credentialValue
      : selectedToken?.clientId || selectedToken?.token || credentialValue;

  const focusActiveInput = useCallback(() => {
    if (isResolvingCredential) {
      return;
    }

    inputRef?.current?.focus();
    setHasFocus(true);
  }, [isResolvingCredential]);

  const resetState = useCallback(() => {
    removeSelectedToken();
    setCredentialValue("");
    setSecretValue("");
    setPendingClient(null);
    setResolvingCredential(null);
    setResolveError("");
    setHasFocus(false);
    lastResolvedCredentialRef.current = "";
    lastAttachedSecretRef.current = "";
    rehydratedClientIdRef.current = "";
    lastSyncedSelectedTokenRef.current = null;
  }, [removeSelectedToken]);

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isResolvingCredential) {
        return;
      }

      if (hasResolvedDisplay && selectedToken?.token && !pendingClient) {
        onSubmit?.(selectedToken.token);
        inputRef?.current?.blur();
        return;
      }

      if (pendingClient) {
        await handleAttachSecret();
      } else {
        await handleResolveCredential(credentialValue);
      }

      inputRef?.current?.blur();
    },
    [
      credentialValue,
      handleAttachSecret,
      handleResolveCredential,
      hasResolvedDisplay,
      isResolvingCredential,
      onSubmit,
      pendingClient,
      selectedToken?.token,
    ]
  );

  const handleFormFocusCapture = useCallback(() => {
    setHasFocus(true);
  }, []);

  const handleFormBlurCapture = useCallback(() => {
    window.setTimeout(syncFocusState, 0);
  }, [syncFocusState]);

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      resetState();
      window.setTimeout(() => inputRef?.current?.focus(), 100);
    },
    [resetState]
  );

  const handleClearPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCredentialChange = useCallback(
    (e) => {
      const value = e.target.value;
      setResolveError("");
      lastResolvedCredentialRef.current = "";
      setCredentialValue(value);
      onChange?.(value);
    },
    [onChange]
  );

  const handleCredentialPaste = useCallback(
    (e) => {
      const pastedValue = e.clipboardData?.getData("text")?.trim();

      if (detectCredentialType(pastedValue) !== "token") {
        return;
      }

      e.preventDefault();
      setResolveError("");
      setCredentialValue(pastedValue);
      lastResolvedCredentialRef.current = "";
      onChange?.(pastedValue);
      window.setTimeout(() => {
        handleResolveCredential(pastedValue, { shouldSubmit: false });
      }, 0);
    },
    [handleResolveCredential, onChange]
  );

  const handleSecretChange = useCallback((e) => {
    setResolveError("");
    lastAttachedSecretRef.current = "";
    setSecretValue(e.target.value);
  }, []);

  const handleSecretPaste = useCallback(
    (e) => {
      const pastedValue = e.clipboardData?.getData("text")?.trim() || "";

      if (!pastedValue) {
        return;
      }

      e.preventDefault();
      setResolveError("");
      lastAttachedSecretRef.current = "";
      setSecretValue(pastedValue);

      if (!isLikelyClientSecret(pastedValue)) {
        return;
      }

      window.setTimeout(() => {
        handleAttachSecret({
          shouldSubmit: false,
          secretOverride: pastedValue,
        });
      }, 0);
    },
    [handleAttachSecret]
  );

  return {
    id,
    containerRef,
    inputRef,
    credentialValue: effectiveCredentialValue,
    secretValue,
    hasFocus,
    pendingClient,
    configuration,
    status,
    isLoading,
    isResolvingCredential,
    showResolvingMarker:
      isResolvingCredential && !hasResolvedDisplay && !pendingClient,
    hasResolvedDisplay,
    hasMissingConfigurationWarning,
    hasResolvedClientSecret,
    hasCompletedClientIdStep,
    showSteps,
    feedbackMessage,
    showFeedbackOverlay: !hasFocus && Boolean(feedbackMessage),
    showPendingClientMessage,
    showReadyMessage,
    handleFormSubmit,
    handleFormFocusCapture,
    handleFormBlurCapture,
    focusActiveInput,
    handleClear,
    handleClearPointerDown,
    handleCredentialChange,
    handleCredentialPaste,
    handleSecretChange,
    handleSecretPaste,
  };
}
