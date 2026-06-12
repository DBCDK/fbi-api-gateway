import { useCallback, useEffect, useRef, useState } from "react";

import useConfiguration from "@/hooks/legacy/useConfiguration";
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
  const { applications, hasFetchedApplications, setCredentialEntry } =
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

  const [hasFocus, setHasFocus] = useState(false);
  const containerRef = useRef(null);

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

  const showLoadingSpinner = useMinimumVisibility(
    isLoading || Boolean(resolvingCredential),
    500
  );

  useEffect(() => {
    if (resolvingCredential) {
      setHasFocus(false);
      return;
    }

    if (selectedToken?.token && !pendingClient) {
      setHasFocus(false);
    }
  }, [pendingClient, resolvingCredential, selectedToken?.token]);

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
    pendingClient,
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
    pendingClient,
    configuration,
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
