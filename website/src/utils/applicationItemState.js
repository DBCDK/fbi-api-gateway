import { dateConverter, timeConverter } from "@/components/utils";
import { hasAvailableAgency } from "@/utils/configuration";
import {
  getClientSecretMessage,
  getCredentialHealthStatus,
  hasData,
} from "@/utils/credentialState";

export function getResolvedApplicationItemData({
  props,
  isClientEntry,
  resolvedConfiguration,
  resolvedUser,
  credentialStatus,
  tokenStatus,
  credentialIsLoading,
  tokenIsLoading,
  internalNetworkCheck,
}) {
  const configuration = hasData(resolvedConfiguration)
    ? resolvedConfiguration
    : props.configuration || {};
  const token =
    isClientEntry && resolvedConfiguration?.resolvedToken
      ? resolvedConfiguration.resolvedToken
      : props.token;
  const clientId = resolvedConfiguration?.resolvedClientId || props.clientId;
  const profile = props.profile || configuration?.profiles?.[0] || null;
  const agency = props.agency || configuration?.agency || null;
  const user = hasData(resolvedUser) ? resolvedUser : props.user || {};
  const configurationStatus = isClientEntry
    ? credentialStatus || props.status || "OK"
    : tokenStatus || props.status || "OK";
  const isLoading = isClientEntry ? credentialIsLoading : tokenIsLoading;
  const hasAttachedClientSecret =
    configuration?.resolvedHasClientSecret ?? props.hasClientSecret;
  const isGlobalNetworkSelected = internalNetworkCheck === "disabled";
  const needsClientSecret =
    props.type === "client"
      ? configurationStatus === "CLIENT_SECRET_REQUIRED"
      : props.requiresClientSecret;
  const hasValidationError =
    configurationStatus !== "OK" &&
    configurationStatus !== "CLIENT_SECRET_REQUIRED";
  const hasWorkingToken = Boolean(token) && !hasValidationError;
  const missingConfiguration =
    !needsClientSecret && (!profile || !hasAvailableAgency(configuration));
  const submitted = {
    date: dateConverter(props.timestamp),
    time: timeConverter(props.timestamp),
  };
  const expires = configuration?.expires
    ? {
        date: dateConverter(configuration.expires),
        time: timeConverter(configuration.expires),
      }
    : {
        date: "Not resolved yet",
        time: "",
      };
  const expireStatus = getCredentialHealthStatus({
    isExternalNetwork: isGlobalNetworkSelected,
    hasClientSecret: hasAttachedClientSecret,
    hasRefreshToken:
      configuration?.resolvedHasRefreshToken ??
      props.hasRefreshToken ??
      false,
    hasWorkingToken,
    requiresManualSecret: needsClientSecret,
    expiresAt: configuration?.expires || null,
  });
  const clientSecretMessage = getClientSecretMessage(
    props.reasonCode,
    props.message
  );
  const statusMessage =
    props.message ||
    (configurationStatus === "INVALID" &&
      (isClientEntry
        ? "This client could not be validated 🧐"
        : "This token is invalid 🧐")) ||
    (configurationStatus === "EXPIRED" &&
      (isClientEntry
        ? "This client could not be renewed 😔"
        : "This token is expired 😔")) ||
    "Error validating token 🤔";

  return {
    configuration,
    token,
    clientId,
    profile,
    agency,
    user,
    configurationStatus,
    isLoading,
    hasAttachedClientSecret,
    isGlobalNetworkSelected,
    needsClientSecret,
    hasValidationError,
    hasWorkingToken,
    missingConfiguration,
    submitted,
    expires,
    expireStatus,
    clientSecretMessage,
    statusMessage,
    hasCulrAccount: user?.hasCulrUniqueId,
  };
}
