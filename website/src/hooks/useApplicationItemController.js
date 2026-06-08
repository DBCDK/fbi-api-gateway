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

export default function useApplicationItemController(props) {
  const [isReveal, setIsReveal] = useState(false);
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isScrolled, setIsScrolled] = useState(null);
  const [savedNote, setSavedNote] = useState(props.note || "");
  const [note, setNote] = useState(props.note || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [clientSecretError, setClientSecretError] = useState("");
  const [clientSecretStatus, setClientSecretStatus] = useState("");
  const [isEditingClientSecret, setIsEditingClientSecret] = useState(false);
  const [containerScrollY, setContainerScrollY] = useState(0);
  const [shouldFocusClientSecret, setShouldFocusClientSecret] = useState(false);
  const [shouldFocusNote, setShouldFocusNote] = useState(false);
  const [isUseButtonHovered, setIsUseButtonHovered] = useState(false);
  const [isRehydratingSession, setIsRehydratingSession] = useState(false);

  const wasPendingRef = useRef(props.isPending === true);
  const rehydratedSessionKeyRef = useRef(null);
  const elRef = useRef();
  const scrollRef = useRef();
  const isClientEntry = props.type === "client";

  const {
    setSelectedToken,
    removeSelectedToken,
    setApplicationEntry,
    removeApplicationEntry,
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
  const shouldSkipCredentialLookup =
    props.isPending ||
    (isClientEntry &&
      props.requiresClientSecret === true &&
      internalNetworkCheck === "disabled" &&
      props.hasClientSecret !== true &&
      !props.token);

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
    enabled: !shouldSkipCredentialLookup,
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

  useEffect(() => {
    if (!open || !shouldFocusNote) {
      return undefined;
    }

    const focusInput = () => {
      const input = document.getElementById(
        `input-note-${props.id || props.token || props.clientId}`
      );

      if (input) {
        input.focus();
        setShouldFocusNote(false);
      }
    };

    const timeout = setTimeout(focusInput, 0);

    return () => clearTimeout(timeout);
  }, [open, props.clientId, props.id, props.token, shouldFocusNote]);

  useEffect(() => {
    if (!open) {
      setIsEditingNote(false);
      setNote(savedNote);
      setIsEditingClientSecret(false);
      setClientSecret("");
      setClientSecretError("");
      setClientSecretStatus("");
    }
  }, [open, savedNote]);

  useEffect(() => {
    const nextNote = props.note || "";
    setSavedNote(nextNote);

    if (!isEditingNote) {
      setNote(nextNote);
    }
  }, [isEditingNote, props.note]);

  useEffect(() => {
    const sessionLookupFailed = isClientEntry && credentialStatus === "EXPIRED";
    const rehydrationValue =
      internalNetworkCheck === "enabled" && props.clientId
        ? props.clientId
        : props.token || props.clientId || null;
    const rehydrationKey = `${props.id || ""}:${internalNetworkCheck}:${rehydrationValue || ""}`;

    if (props.isPending || !sessionLookupFailed || !rehydrationValue || !props.id) {
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
        const response = await resolveCredential({
          value: rehydrationValue,
          entryId: props.id,
          agency: props.agency,
        });

        if (isCancelled) {
          return;
        }

        if (response?.safeEntry) {
          setApplicationEntry(
            {
              ...response.safeEntry,
              note: props.note || "",
            },
            false
          );

          if (props.inUse && response.safeEntry.token) {
            setSelectedToken(
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

          mutateCredentialConfiguration?.();
          mutateCredentialUser?.();
          return;
        }

        setApplicationEntry(
          {
            id: props.id,
            type: props.type,
            token: props.token,
            clientId: props.clientId,
            note: props.note || "",
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
    credentialStatus,
    internalNetworkCheck,
    isClientEntry,
    mutateCredentialConfiguration,
    mutateCredentialUser,
    props.agency,
    props.clientId,
    props.id,
    props.isPending,
    props.inUse,
    props.note,
    props.token,
    resolveCredential,
    setApplicationEntry,
    setSelectedToken,
  ]);

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
  const showExpandedClientSecretSection = Boolean(clientId);
  const showExpandedClientSecretForm =
    Boolean(clientId) && (!hasAttachedClientSecret || isEditingClientSecret);
  const canManageAttachedClientSecret =
    Boolean(clientId) && hasAttachedClientSecret && !needsClientSecret;
  const hasPendingNoteChanges = note !== savedNote;
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
    needsClientSecret || clientSecret || hasPendingNoteChanges || isEditingNote
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

  function persistApplicationEntry(nextValues = {}) {
    setApplicationEntry({
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

  function persistNoteChanges() {
    persistApplicationEntry();
    setSavedNote(note);
    setIsEditingNote(false);
  }

  async function handleResolveWithClientSecret() {
    setClientSecretError("");
    setClientSecretStatus("");
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

    setApplicationEntry(
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
        hasClientSecret: response.safeEntry.hasClientSecret,
      },
      { reorderApplications: false }
    );
    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
    setSavedNote(note);
    setIsEditingNote(false);
    setClientSecret("");
    setClientSecretStatus("Client secret validated and saved.");
    return true;
  }

  async function handleAttachClientSecret() {
    setClientSecretError("");
    setClientSecretStatus("");

    const response = await attachClientSecret({
      entryId: props.id,
      clientSecret,
      agency,
    });

    if (!response?.safeEntry) {
      setClientSecretError(response?.message || "Could not save clientSecret");
      return false;
    }

    setApplicationEntry(
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
          hasClientSecret: response.safeEntry.hasClientSecret,
        },
        { reorderApplications: false }
      );
    }

    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
    setSavedNote(note);
    setIsEditingNote(false);
    setClientSecret("");
    setIsEditingClientSecret(false);
    setClientSecretStatus("Client secret updated and validated.");
    return true;
  }

  async function handleUseAction() {
    const hasPendingUpdates =
      Boolean(clientSecret) || isEditingNote || hasPendingNoteChanges;

    if (props.inUse && !hasPendingUpdates) {
      removeSelectedToken();
      return;
    }

    if (needsClientSecret) {
      await handleAttachClientSecret();
      return;
    }

    if (clientSecret) {
      const didAttachClientSecret = await handleAttachClientSecret();

      if (!didAttachClientSecret) {
        return;
      }
    }

    if (isEditingNote || hasPendingNoteChanges) {
      persistNoteChanges();
    }

    setSelectedToken(
      token,
      profile,
      agency,
      {
        id: props.id,
        type: props.type,
        clientId,
        hasClientSecret: hasAttachedClientSecret,
      },
      { reorderApplications: false }
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

    removeApplicationEntry(entry);
    const delay = open ? 500 : 0;
    setTimeout(() => setRemoved(true), delay);
  }

  function focusClientSecret() {
    setOpen(true);
    setIsEditingClientSecret(true);
    setClientSecretError("");
    setClientSecretStatus("");
    setShouldFocusClientSecret(true);
  }

  function handleClientSecretChange(value) {
    setClientSecret(value);

    if (clientSecretError) {
      setClientSecretError("");
    }

    if (clientSecretStatus) {
      setClientSecretStatus("");
    }
  }

  function handleNoteChange(value) {
    setNote(value);

    if (value !== savedNote) {
      setIsEditingNote(true);
      return;
    }

    setIsEditingNote(false);
  }

  function startEditingClientSecret() {
    setIsEditingClientSecret(true);
    setClientSecret("");
    setClientSecretError("");
    setClientSecretStatus("");
    setShouldFocusClientSecret(true);
  }

  function cancelEditingClientSecret() {
    setIsEditingClientSecret(false);
    setClientSecret("");
    setClientSecretError("");
    setClientSecretStatus("");
  }

  function startEditingNote() {
    setIsEditingNote(true);
    setShouldFocusNote(true);
  }

  function cancelEditingNote() {
    setIsEditingNote(false);
    setNote(savedNote);
  }

  return {
    isLoadingView:
      props.isPending ||
      isRehydratingSession ||
      (isLoading && (Boolean(props.token) || isClientEntry)),
    item: {
      id: props.id,
      type: props.type || "token",
      token,
      clientId,
      profile,
      agency,
      note,
      savedNote,
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
      showExpandedClientSecretSection,
      showExpandedClientSecretForm,
      canManageAttachedClientSecret,
      isEditingClientSecret,
      isEditingNote,
      useButtonLabel,
      isUseDisabled,
      scrollRef,
      elRef,
    },
    form: {
      clientSecret,
      clientSecretError,
      clientSecretStatus,
      clientSecretInputId: `client-secret-${props.id}`,
    },
    actions: {
      setOpen,
      setNote: handleNoteChange,
      setClientSecret: handleClientSecretChange,
      requestRemove: () => setIsConfirmingRemove(true),
      cancelRemove: () => setIsConfirmingRemove(false),
      confirmRemove: handleRemoveAction,
      useCredential: handleUseAction,
      focusClientSecret,
      startEditingClientSecret,
      cancelEditingClientSecret,
      startEditingNote,
      cancelEditingNote,
      setUseButtonHovered: setIsUseButtonHovered,
    },
  };
}
