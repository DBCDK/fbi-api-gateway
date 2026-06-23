import { hasAvailableAgency } from "@/utils/configuration";
import { detectCredentialType } from "@/utils/credentials";

export function getConnectState({
  applications,
  configuration,
  credentialValue,
  pendingClient,
  resolveError,
  resolvingCredential,
  selectedCredential,
  secretValue,
  status,
  isLoading,
  isNetworkLoading,
  isDetectedInternal,
  internalNetworkCheck,
}) {
  const currentApplicationEntry =
    applications?.find?.(
      (item) =>
        (selectedCredential?.clientId &&
          item?.clientId === selectedCredential.clientId) ||
        (selectedCredential?.token && item?.token === selectedCredential.token)
    ) || null;
  const effectiveProfile =
    selectedCredential?.profile ?? configuration?.profiles?.[0] ?? null;
  const hasResolvedDisplay =
    Boolean(configuration?.displayName) &&
    Boolean(selectedCredential?.token) &&
    !pendingClient;
  const hasValidationError =
    selectedCredential?.token && !isLoading && status !== "OK";
  const hasMissingConfigurationWarning =
    !isLoading &&
    !hasValidationError &&
    selectedCredential?.token &&
    (!effectiveProfile || !hasAvailableAgency(configuration));

  const inputType = detectCredentialType(credentialValue);
  const acceptsCredential = inputType === "token" || inputType === "client";
  const resolvedClientId =
    pendingClient?.clientId ||
    configuration?.resolvedClientId ||
    selectedCredential?.clientId ||
    (inputType === "client" ? credentialValue.trim() : "");
  const hasResolvedClientId = Boolean(resolvedClientId);
  const hasResolvedClientSecret = Boolean(
    secretValue.trim() ||
      pendingClient?.hasClientSecret ||
      selectedCredential?.hasClientSecret ||
      currentApplicationEntry?.hasClientSecret ||
      configuration?.resolvedHasClientSecret
  );
  const credentialError =
    !pendingClient &&
    !selectedCredential?.token &&
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
  const hasCompletedCredentialSelection =
    Boolean(selectedCredential?.token) && !pendingClient;
  const showSteps =
    canShowSteps && hasResolvedClientId && !hasCompletedCredentialSelection;
  const feedbackMessage =
    resolveError ||
    credentialError ||
    expiredError ||
    invalidError ||
    unknownError;
  const showPendingClientMessage = pendingClient && !resolveError;
  const showReadyMessage = hasResolvedDisplay && !pendingClient;
  const effectiveCredentialValue =
    resolvingCredential?.type === "token"
      ? credentialValue
      : pendingClient
      ? credentialValue
      : selectedCredential?.clientId ||
        selectedCredential?.token ||
        credentialValue;

  return {
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
  };
}
