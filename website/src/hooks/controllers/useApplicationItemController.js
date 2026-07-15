import { useEffect, useRef, useState } from "react";

import useConfiguration from "@/hooks/useConfiguration";
import useCredentialConfiguration from "@/hooks/credentials/useCredentialConfiguration";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialItemActions from "@/hooks/credentials/useCredentialItemActions";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import useCredentialSessionRecovery from "@/hooks/credentials/useCredentialSessionRecovery";
import useCredentialUser from "@/hooks/credentials/useCredentialUser";
import useDeferredElementFocus from "@/hooks/ui/useDeferredElementFocus";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import useModalScrollOffset from "@/hooks/ui/useModalScrollOffset";
import usePendingReveal from "@/hooks/ui/usePendingReveal";
import useUser from "@/hooks/useUser";

import { getResolvedApplicationItemData } from "@/utils/applicationItemState";

export default function useApplicationItemController(props) {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(null);
  const [savedNote, setSavedNote] = useState(props.note || "");
  const [note, setNote] = useState(props.note || "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [isEditingClientSecret, setIsEditingClientSecret] = useState(false);
  const [shouldFocusClientSecret, setShouldFocusClientSecret] = useState(false);
  const [shouldFocusNote, setShouldFocusNote] = useState(false);
  const [isUseButtonHovered, setIsUseButtonHovered] = useState(false);

  const elRef = useRef();
  const scrollRef = useRef();
  const isClientEntry = props.type === "client";
  const isReveal = usePendingReveal(props.isPending);
  const containerScrollY = useModalScrollOffset("modal");

  const { setCredentialEntry, removeCredentialEntry } = useCredentialEntries();
  const {
    selectCredential,
    clearSelectedCredential,
    resolveCredentialValue,
    attachCredentialSecret: attachClientSecret,
    removeCredentialSecret: detachClientSecret,
  } = useCredentialMutations();
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

  useDeferredElementFocus({
    enabled: shouldFocusClientSecret,
    elementId: `client-secret-${props.id}`,
    onFocused: () => setShouldFocusClientSecret(false),
  });

  useDeferredElementFocus({
    enabled: open && shouldFocusNote,
    elementId: `input-custom-name-${props.id || props.token || props.clientId}`,
    onFocused: () => setShouldFocusNote(false),
  });

  useEffect(() => {
    const nextNote = props.note || "";
    setSavedNote(nextNote);

    if (!isEditingNote) {
      setNote(nextNote);
    }
  }, [isEditingNote, props.note]);
  const { isRehydratingSession } = useCredentialSessionRecovery({
    entry: {
      id: props.id,
      type: props.type,
      token: props.token,
      clientId: props.clientId,
      agency: props.agency,
      note: props.note,
      inUse: props.inUse,
      isPending: props.isPending,
    },
    enabled: isClientEntry,
    configurationStatus: credentialStatus,
    internalNetworkCheck,
    resolveCredentialValue,
    setCredentialEntry,
    selectCredential,
    mutateConfiguration: mutateCredentialConfiguration,
    mutateUser: mutateCredentialUser,
  });

  const resolvedConfiguration = isClientEntry
    ? credentialConfiguration
    : tokenConfiguration;
  const resolvedUser = isClientEntry ? credentialUser : tokenUser;

  const {
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
    hasCulrAccount,
  } = getResolvedApplicationItemData({
    props,
    isClientEntry,
    resolvedConfiguration,
    resolvedUser,
    credentialStatus,
    tokenStatus,
    credentialIsLoading,
    tokenIsLoading,
    internalNetworkCheck,
  });
  const shouldPromptForGlobalClientSecret =
    isGlobalNetworkSelected &&
    Boolean(clientId) &&
    hasWorkingToken &&
    !hasAttachedClientSecret;
  const showInlineClientSecretForm = !open && needsClientSecret;
  const showExpandedClientSecretSection = Boolean(clientId);
  const showExpandedClientSecretForm =
    Boolean(clientId) && (!hasAttachedClientSecret || isEditingClientSecret);
  const hasPendingNoteChanges = note !== savedNote;
  const canExpand = !needsClientSecret;

  const itemOffsetTop = elRef.current?.offsetTop || 0;
  const contentTop = open ? containerScrollY - itemOffsetTop : 0;
  const {
    clientSecretError,
    setClientSecretError,
    clientSecretStatus,
    setClientSecretStatus,
    removed,
    isConfirmingRemove,
    isUsingCredential,
    isPendingClientSecretRemoval,
    setIsConfirmingRemove,
    setIsPendingClientSecretRemoval,
    handleUseAction,
    handleRemoveAction,
    canManageAttachedClientSecret,
    isUseDisabled,
  } = useCredentialItemActions({
    entry: {
      id: props.id,
      type: props.type,
      requiresClientSecret: props.requiresClientSecret,
      reasonCode: props.reasonCode,
      message: props.message,
    },
    clientSecret,
    note,
    savedNote,
    needsClientSecret,
    hasAttachedClientSecret,
    hasValidationError,
    hasWorkingToken,
    shouldPromptForGlobalClientSecret,
    token,
    clientId,
    profile,
    agency,
    configuration,
    user,
    configurationStatus,
    removeCredentialEntry,
    setCredentialEntry,
    clearSelectedCredential,
    selectCredential,
    attachCredentialSecret: attachClientSecret,
    removeCredentialSecret: detachClientSecret,
    mutateConfiguration: mutateCredentialConfiguration,
    mutateUser: mutateCredentialUser,
    onRemoveRequest: props.onRemoveRequest,
    isInUse: props.inUse,
    isEditingNote,
    setSavedNote,
    setIsEditingNote,
    setIsEditingClientSecret,
    setClientSecret,
  });

  useEffect(() => {
    if (!open) {
      setIsEditingNote(false);
      setNote(savedNote);
      setIsEditingClientSecret(false);
      setClientSecret("");
      setClientSecretError("");
      setClientSecretStatus("");
      setIsPendingClientSecretRemoval(false);
    }
  }, [
    open,
    savedNote,
    setClientSecretError,
    setClientSecretStatus,
    setIsPendingClientSecretRemoval,
  ]);
  const useButtonLabel =
    needsClientSecret ||
    clientSecret ||
    hasPendingNoteChanges ||
    isEditingNote ||
    isPendingClientSecretRemoval
      ? "Update & Use"
      : props.inUse
        ? isUseButtonHovered
          ? "Don't use"
          : "I'm in use"
        : "Use";

  function focusClientSecret() {
    if (!showInlineClientSecretForm) {
      setOpen(true);
    }

    setIsEditingClientSecret(true);
    setClientSecretError("");
    setClientSecretStatus("");
    setIsPendingClientSecretRemoval(false);
    setShouldFocusClientSecret(true);
  }

  function handleClientSecretChange(value) {
    setClientSecret(value);
    setIsPendingClientSecretRemoval(
      Boolean(hasAttachedClientSecret) && value.trim() === ""
    );

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
    setIsPendingClientSecretRemoval(false);
    setShouldFocusClientSecret(true);
  }

  function prepareClientSecretRemoval() {
    setIsEditingClientSecret(true);
    setClientSecret("");
    setClientSecretError("");
    setClientSecretStatus("");
    setIsPendingClientSecretRemoval(true);
    setShouldFocusClientSecret(false);
  }

  function cancelEditingClientSecret() {
    setIsEditingClientSecret(false);
    setClientSecret("");
    setClientSecretError("");
    setClientSecretStatus("");
    setIsPendingClientSecretRemoval(false);
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
      isUsingCredential,
      isPendingClientSecretRemoval,
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
      confirmRemove: () => {
        setOpen(false);
        handleRemoveAction(open);
      },
      prepareClientSecretRemoval,
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
