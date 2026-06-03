import { useEffect, useRef, useState } from "react";

import useConfiguration from "@/hooks/useConfiguration";
import useCredentialClientSecret from "@/hooks/useCredentialClientSecret";
import useCredentialConfiguration from "@/hooks/useCredentialConfiguration";
import useCredentialResolve from "@/hooks/useCredentialResolve";
import useCredentialUser from "@/hooks/useCredentialUser";
import useInternalNetworkCheck from "@/hooks/useInternalNetworkCheck";
import useStorage from "@/hooks/useStorage";
import useUser from "@/hooks/useUser";

import { dateConverter, timeConverter } from "@/components/utils";
import { hasAvailableAgency } from "@/utils/configuration";

function getCredentialHealthStatus({
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

function hasData(value) {
  return Boolean(value && Object.keys(value).length > 0);
}

function getClientSecretMessage(reasonCode, fallbackMessage) {
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

export default function useHistoryItemController(props) {
  const [isReveal, setIsReveal] = useState(false);
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isScrolled, setIsScrolled] = useState(null);
  const [note, setNote] = useState(props.note);
  const [clientSecret, setClientSecret] = useState("");
  const [clientSecretError, setClientSecretError] = useState("");
  const [containerScrollY, setContainerScrollY] = useState(0);
  const [shouldFocusClientSecret, setShouldFocusClientSecret] = useState(false);
  const [isUseButtonHovered, setIsUseButtonHovered] = useState(false);

  const wasPendingRef = useRef(props.isPending === true);
  const elRef = useRef();
  const scrollRef = useRef();
  const isClientEntry = props.type === "client";

  const {
    setSelectedToken,
    removeSelectedToken,
    setHistoryItem,
    removeHistoryItem,
  } = useStorage();
  const { resolveCredential } = useCredentialResolve();
  const { attachClientSecret } = useCredentialClientSecret();
  const { internalNetworkCheck } = useInternalNetworkCheck();

  const {
    configuration: tokenConfiguration,
    status: tokenStatus,
    isLoading: tokenIsLoading,
  } = useConfiguration(props, {
    enabled: !isClientEntry,
    syncResolvedToken: false,
  });
  const { user: tokenUser } = useUser(props, {
    enabled: !isClientEntry,
    syncResolvedToken: false,
  });

  const {
    configuration: credentialConfiguration,
    status: credentialStatus,
    isLoading: credentialIsLoading,
    mutate: mutateCredentialConfiguration,
  } = useCredentialConfiguration({
    id: props.id,
    token: props.token,
    agency: props.agency,
    lookupByEntryId: isClientEntry,
  });
  const { user: credentialUser, mutate: mutateCredentialUser } =
    useCredentialUser({
      id: props.id,
      token: props.token,
      lookupByEntryId: isClientEntry,
      enabled: !isClientEntry || credentialStatus === "OK",
    });

  useEffect(() => {
    if (wasPendingRef.current && !props.isPending) {
      setIsReveal(true);
      const timeout = setTimeout(() => setIsReveal(false), 320);
      wasPendingRef.current = false;
      return () => clearTimeout(timeout);
    }

    wasPendingRef.current = props.isPending === true;
    return undefined;
  }, [props.isPending]);

  useEffect(() => {
    if (!isClientEntry || !props.isVisible || !props.refreshCycle) {
      return;
    }

    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
  }, [
    isClientEntry,
    mutateCredentialConfiguration,
    mutateCredentialUser,
    props.isVisible,
    props.refreshCycle,
  ]);

  useEffect(() => {
    const modal = document.getElementById("modal");

    if (!modal) {
      return undefined;
    }

    function handleModalScroll() {
      setContainerScrollY(modal.scrollTop);
    }

    handleModalScroll();
    modal.addEventListener("scroll", handleModalScroll, { passive: true });

    return () => modal.removeEventListener("scroll", handleModalScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) {
      return undefined;
    }

    function syncScrolledState() {
      setIsScrolled(el.scrollTop > 0);
    }

    syncScrolledState();
    el.addEventListener("scroll", syncScrolledState, { passive: true });

    return () => el.removeEventListener("scroll", syncScrolledState);
  }, [open]);

  useEffect(() => {
    if (!open || !shouldFocusClientSecret) {
      return undefined;
    }

    const focusInput = () => {
      const input = document.getElementById(`client-secret-${props.id}`);

      if (input) {
        input.focus();
        setShouldFocusClientSecret(false);
      }
    };

    const timeout = setTimeout(focusInput, 0);

    return () => clearTimeout(timeout);
  }, [open, props.id, shouldFocusClientSecret]);

  const resolvedConfiguration = isClientEntry
    ? credentialConfiguration
    : tokenConfiguration;
  const resolvedUser = isClientEntry ? credentialUser : tokenUser;

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

  const hasCulrAccount = user?.hasCulrUniqueId;
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
  const shouldPromptForGlobalClientSecret =
    isGlobalNetworkSelected &&
    Boolean(clientId) &&
    hasWorkingToken &&
    !hasAttachedClientSecret;
  const showInlineClientSecretForm = !open && needsClientSecret;
  const showExpandedClientSecretForm =
    Boolean(clientId) && !hasAttachedClientSecret;
  const canExpand = !needsClientSecret;
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

  const itemOffsetTop = elRef.current?.offsetTop || 0;
  const contentTop = open ? containerScrollY - itemOffsetTop : 0;
  const useButtonLabel =
    needsClientSecret || clientSecret
      ? "Update & Use"
      : props.inUse
        ? isUseButtonHovered
          ? "Don't use"
          : "I'm in use"
        : "Use";
  const isUseDisabled = needsClientSecret
    ? !clientSecret
    : shouldPromptForGlobalClientSecret
      ? !clientSecret && (hasValidationError || !token)
      : hasValidationError || !token;
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
  const clientSecretMessage = getClientSecretMessage(
    props.reasonCode,
    props.message
  );

  function persistHistoryItem(nextValues = {}) {
    setHistoryItem({
      id: props.id,
      type: props.type,
      token,
      clientId,
      profile,
      agency,
      note,
      configuration,
      user,
      requiresClientSecret: props.requiresClientSecret,
      hasClientSecret: hasAttachedClientSecret,
      reasonCode: props.reasonCode,
      status: configurationStatus,
      message: props.message,
      ...nextValues,
    });
  }

  async function handleResolveWithClientSecret() {
    setClientSecretError("");
    const response = await resolveCredential({
      value: clientId,
      clientSecret,
      entryId: props.id,
      agency,
    });

    if (!response?.safeEntry?.token) {
      setClientSecretError(
        response?.message || "Could not validate clientSecret"
      );
      return false;
    }

    setHistoryItem(
      {
        ...response.safeEntry,
        note,
      },
      false
    );
    setSelectedToken(
      response.safeEntry.token,
      response.safeEntry.profile,
      response.safeEntry.agency,
      {
        id: response.safeEntry.id,
        type: response.safeEntry.type,
        clientId: response.safeEntry.clientId,
      },
      { reorderHistory: false }
    );
    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
    setClientSecret("");
    return true;
  }

  async function handleAttachClientSecret() {
    setClientSecretError("");

    const response = await attachClientSecret({
      entryId: props.id,
      clientSecret,
      agency,
    });

    if (!response?.safeEntry) {
      setClientSecretError(response?.message || "Could not save clientSecret");
      return false;
    }

    setHistoryItem(
      {
        ...response.safeEntry,
        note,
      },
      false
    );

    if (response.safeEntry.token) {
      setSelectedToken(
        response.safeEntry.token,
        response.safeEntry.profile,
        response.safeEntry.agency,
        {
          id: response.safeEntry.id,
          type: response.safeEntry.type,
          clientId: response.safeEntry.clientId,
        },
        { reorderHistory: false }
      );
    }

    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
    setClientSecret("");
    return true;
  }

  async function handleUseAction() {
    if (props.inUse) {
      removeSelectedToken();
      return;
    }

    if (needsClientSecret) {
      await handleResolveWithClientSecret();
      return;
    }

    if (clientSecret) {
      const didAttachClientSecret = await handleAttachClientSecret();

      if (!didAttachClientSecret) {
        return;
      }
    }

    setSelectedToken(
      token,
      profile,
      agency,
      {
        id: props.id,
        type: props.type,
        clientId,
      },
      { reorderHistory: false }
    );
  }

  function handleRemoveAction() {
    setIsConfirmingRemove(false);
    setOpen(false);
    const entry = { id: props.id, token, clientId };

    if (props.onRemoveRequest) {
      props.onRemoveRequest(entry);
      return;
    }

    removeHistoryItem(entry);
    const delay = open ? 500 : 0;
    setTimeout(() => setRemoved(true), delay);
  }

  function focusClientSecret() {
    setOpen(true);
    setShouldFocusClientSecret(true);
  }

  return {
    isLoadingView:
      props.isPending || (isLoading && (Boolean(props.token) || isClientEntry)),
    item: {
      id: props.id,
      type: props.type || "token",
      token,
      clientId,
      profile,
      agency,
      note,
      inUse: props.inUse,
      configuration,
      user,
      message: props.message,
      reasonCode: props.reasonCode,
      requiresClientSecret: props.requiresClientSecret,
      hasClientSecret: hasAttachedClientSecret,
      configurationStatus,
      isEntering: props.isEntering,
      isRemoving: props.isRemoving,
      displayName: configuration?.displayName,
      logoColor: configuration?.logoColor || null,
      statusMessage,
      clientSecretMessage,
      hasCulrAccount,
      submitted,
      expires,
      expireStatus,
    },
    ui: {
      open,
      removed,
      isConfirmingRemove,
      reveal: isReveal,
      isScrolled,
      contentTop,
      canExpand,
      missingConfiguration,
      needsClientSecret,
      hasValidationError,
      shouldPromptForGlobalClientSecret,
      showInlineClientSecretForm,
      showExpandedClientSecretForm,
      useButtonLabel,
      isUseDisabled,
      scrollRef,
      elRef,
    },
    form: {
      clientSecret,
      clientSecretError,
      clientSecretInputId: `client-secret-${props.id}`,
    },
    actions: {
      setOpen,
      setNote,
      setClientSecret,
      saveNote: persistHistoryItem,
      requestRemove: () => setIsConfirmingRemove(true),
      cancelRemove: () => setIsConfirmingRemove(false),
      confirmRemove: handleRemoveAction,
      useCredential: handleUseAction,
      focusClientSecret,
      setUseButtonHovered: setIsUseButtonHovered,
    },
  };
}
