const CLIENT_SECRET_PATTERN = /^[0-9a-f]{64}$/i;

export function hasData(value) {
  return Boolean(value && Object.keys(value).length > 0);
}

export function isLikelyClientSecret(value) {
  if (typeof value !== "string") {
    return false;
  }

  return CLIENT_SECRET_PATTERN.test(value.trim());
}

export function getCredentialHealthStatus({
  isExternalNetwork = false,
  hasClientSecret = false,
  hasRefreshToken = false,
  hasWorkingToken = false,
  requiresManualSecret = false,
  expiresAt = null,
}) {
  if (requiresManualSecret) {
    return "health-critical";
  }

  const canAutoRenew =
    !isExternalNetwork || hasClientSecret || hasRefreshToken;

  if (canAutoRenew) {
    return "health-safe";
  }

  if (!hasWorkingToken) {
    return "health-critical";
  }

  if (!expiresAt) {
    return "health-warning";
  }

  const expiresAtTimestamp = new Date(expiresAt).getTime();

  if (!Number.isFinite(expiresAtTimestamp)) {
    return "health-warning";
  }

  const hoursUntilExpiration =
    (expiresAtTimestamp - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilExpiration <= 24) {
    return "health-critical";
  }

  return "health-warning";
}

export function getClientSecretMessage(reasonCode, fallbackMessage) {
  if (fallbackMessage) {
    return fallbackMessage;
  }

  if (reasonCode === "CLIENT_SECRET_AUTO_EXCHANGE_FAILED") {
    return "Automatic token exchange failed. Enter secret manually.";
  }

  if (reasonCode === "CLIENT_SECRET_REQUIRED") {
    return "Secret is required";
  }

  return "Secret is required before token exchange";
}
