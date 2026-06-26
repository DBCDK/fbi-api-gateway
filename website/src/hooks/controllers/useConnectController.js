import { useCallback, useEffect, useRef, useState } from "react";

import useConfiguration from "@/hooks/useConfiguration";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialInputFlow from "@/hooks/credentials/useCredentialInputFlow";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import useMinimumVisibility from "@/hooks/ui/useMinimumVisibility";
import { getConnectState } from "@/utils/connectState";
import { detectCredentialType } from "@/utils/credentials";
import { isLikelyClientSecret } from "@/utils/credentialState";

export default function useConnectController({
  id,
  onSubmit,
  onChange,
  onValidityChange,
  onPendingChange,
}) {
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const {
    applications,
    hasFetchedApplications,
    setCredentialEntry,
    getCredentialEntry,
  } =
    useCredentialEntries();
  const {
    clearSelectedCredential,
    resolveCredentialValue,
    attachCredentialSecret,
    selectCredential,
  } = useCredentialMutations();
  const { isInternal: isDetectedInternal, isLoading: isNetworkLoading } =
    useCredentialNetwork();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const { configuration, status, isLoading } = useConfiguration(selectedToken);
  const selectedEntry = selectedToken ? getCredentialEntry(selectedToken) : null;
  const resolvedDisplayName = selectedEntry?.note || configuration?.displayName || "";
  const isEffectiveInternalNetwork =
    !isNetworkLoading &&
    isDetectedInternal &&
    internalNetworkCheck !== "disabled";

  const [hasFocus, setHasFocus] = useState(false);
  const [isSubmittingFlow, setIsSubmittingFlow] = useState(false);
  const containerRef = useRef(null);
  const lastResolvedNetworkModeRef = useRef(null);

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

  const {
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
  } = useCredentialInputFlow({
    applications,
    hasFetchedApplications,
    selectedCredential: selectedToken,
    setCredentialEntry,
    resolveCredentialValue,
    attachCredentialSecret,
    selectCredential,
    clearSelectedCredential,
    onSubmit,
    onChange,
    blurInput,
    focusInput,
  });
  const requiresClientSecretInput =
    Boolean(pendingClient) && !isEffectiveInternalNetwork;

  useEffect(() => {
    const nextIsValid = pendingClient
      ? isEffectiveInternalNetwork || Boolean(secretValue.trim())
      : Boolean(selectedToken?.token) && !resolvingCredential;

    onValidityChange?.(nextIsValid);
  }, [
    isEffectiveInternalNetwork,
    onValidityChange,
    pendingClient,
    resolvingCredential,
    secretValue,
    selectedToken?.token,
  ]);

  const showLoadingSpinner = useMinimumVisibility(
    Boolean(resolvingCredential) || isSubmittingFlow,
    1000
  );

  useEffect(() => {
    onPendingChange?.(showLoadingSpinner);
  }, [onPendingChange, showLoadingSpinner]);

  useEffect(() => {
    if (!isSubmittingFlow) {
      return;
    }

    if (resolvingCredential) {
      return;
    }

    if (pendingClient && !isEffectiveInternalNetwork) {
      setIsSubmittingFlow(false);
      return;
    }

    if (!selectedToken?.token) {
      setIsSubmittingFlow(false);
      return;
    }

    if (!isLoading) {
      setIsSubmittingFlow(false);
    }
  }, [
    isEffectiveInternalNetwork,
    isLoading,
    isSubmittingFlow,
    pendingClient,
    resolvingCredential,
    selectedToken?.token,
  ]);

  useEffect(() => {
    if (resolvingCredential) {
      setHasFocus(false);
      return;
    }

    if (selectedToken?.token && !pendingClient) {
      setHasFocus(false);
    }
  }, [pendingClient, resolvingCredential, selectedToken?.token]);

  useEffect(() => {
    if (isNetworkLoading || resolvingCredential) {
      return;
    }

    const nextNetworkMode = isEffectiveInternalNetwork
      ? "internal"
      : "external";
    const previousNetworkMode = lastResolvedNetworkModeRef.current;
    lastResolvedNetworkModeRef.current = nextNetworkMode;

    if (!previousNetworkMode || previousNetworkMode === nextNetworkMode) {
      return;
    }

    const clientIdToRefresh =
      pendingClient?.clientId ||
      (selectedToken?.clientId && !selectedToken?.hasClientSecret
        ? selectedToken.clientId
        : null);

    if (!clientIdToRefresh) {
      return;
    }

    handleResolveCredential(clientIdToRefresh, {
      shouldSubmit: false,
      onResolvedSelection: () => setHasFocus(false),
    });
  }, [
    handleResolveCredential,
    isEffectiveInternalNetwork,
    isNetworkLoading,
    pendingClient?.clientId,
    resolvingCredential,
    selectedToken?.clientId,
    selectedToken?.hasClientSecret,
  ]);

  const {
    hasResolvedDisplay,
    hasMissingConfigurationWarning,
    hasResolvedClientSecret,
    hasCompletedClientIdStep,
    showSteps,
    feedbackMessage,
    showPendingClientMessage,
    showReadyMessage,
    effectiveCredentialValue,
    isResolvingCredential,
  } = getConnectState({
    applications,
    configuration,
    credentialValue,
    pendingClient: requiresClientSecretInput ? pendingClient : null,
    resolveError,
    resolvingCredential,
    selectedCredential: selectedToken,
    secretValue,
    status,
    isLoading,
    isNetworkLoading,
    isDetectedInternal,
    internalNetworkCheck,
  });

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    window.setTimeout(syncFocusState, 0);
  }, [feedbackMessage, syncFocusState]);

  const focusActiveInput = useCallback(() => {
    if (isResolvingCredential) {
      return;
    }

    inputRef?.current?.focus();
    setHasFocus(true);
  }, [isResolvingCredential]);

  const resetState = useCallback(() => {
    resetCredentialInput();
    setHasFocus(false);
  }, [resetCredentialInput]);

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

      setIsSubmittingFlow(true);

      if (pendingClient) {
        if (isEffectiveInternalNetwork) {
          await handleResolveCredential(pendingClient.clientId || credentialValue, {
            shouldSubmit: true,
          });
        } else {
          await handleAttachSecret();
        }
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
      isEffectiveInternalNetwork,
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
      onChange?.(pastedValue);
      window.setTimeout(() => {
        handleResolveCredential(pastedValue, {
          shouldSubmit: false,
          onResolvedSelection: () => setHasFocus(false),
        });
      }, 0);
    },
    [handleResolveCredential, onChange]
  );

  const handleSecretChange = useCallback((e) => {
    setResolveError("");
    setSecretValue(e.target.value);
  }, [setResolveError, setSecretValue]);

  const handleSecretPaste = useCallback(
    (e) => {
      const pastedValue = e.clipboardData?.getData("text")?.trim() || "";

      if (!pastedValue) {
        return;
      }

      e.preventDefault();
      setResolveError("");
      setSecretValue(pastedValue);

      if (!isLikelyClientSecret(pastedValue)) {
        return;
      }

      window.setTimeout(() => {
        handleAttachSecret({
          shouldSubmit: false,
          secretOverride: pastedValue,
          onResolvedSelection: () => setHasFocus(false),
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
    pendingClient: requiresClientSecretInput ? pendingClient : null,
    configuration,
    resolvedDisplayName,
    status,
    isLoading,
    showLoadingSpinner,
    isResolvingCredential,
    hasResolvedDisplay,
    hasMissingConfigurationWarning,
    hasResolvedClientSecret,
    hasCompletedClientIdStep,
    showSteps,
    feedbackMessage,
    showFeedbackOverlay: !hasFocus && Boolean(feedbackMessage),
    showPendingClientMessage,
    showReadyMessage: showReadyMessage && !showLoadingSpinner,
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
