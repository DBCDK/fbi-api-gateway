import { useCallback, useState } from "react";

export default function useCredentialItemActions({
  entry,
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
  attachCredentialSecret,
  mutateConfiguration,
  mutateUser,
  onRemoveRequest,
  isInUse,
  isEditingNote,
  setSavedNote,
  setIsEditingNote,
  setIsEditingClientSecret,
  setClientSecret,
}) {
  const [clientSecretError, setClientSecretError] = useState("");
  const [clientSecretStatus, setClientSecretStatus] = useState("");
  const [removed, setRemoved] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  const persistApplicationEntry = useCallback(
    (nextValues = {}) => {
      setCredentialEntry({
        id: entry.id,
        type: entry.type,
        token,
        clientId,
        profile,
        agency,
        note,
        configuration,
        user,
        requiresClientSecret: entry.requiresClientSecret,
        hasClientSecret: hasAttachedClientSecret,
        reasonCode: entry.reasonCode,
        status: configurationStatus,
        message: entry.message,
        ...nextValues,
      });
    },
    [
      agency,
      clientId,
      configuration,
      configurationStatus,
      entry.id,
      entry.message,
      entry.reasonCode,
      entry.requiresClientSecret,
      entry.type,
      hasAttachedClientSecret,
      note,
      profile,
      setCredentialEntry,
      token,
      user,
    ]
  );

  const persistNoteChanges = useCallback(() => {
    persistApplicationEntry();
    setSavedNote(note);
    setIsEditingNote(false);
  }, [note, persistApplicationEntry, setIsEditingNote, setSavedNote]);

  const handleAttachClientSecret = useCallback(async () => {
    setClientSecretError("");
    setClientSecretStatus("");

    const response = await attachCredentialSecret({
      entryId: entry.id,
      clientSecret,
      agency,
      note,
    });

    if (!response?.safeEntry) {
      setClientSecretError(response?.message || "Could not save clientSecret");
      return false;
    }

    mutateConfiguration?.();
    mutateUser?.();
    setSavedNote(note);
    setIsEditingNote(false);
    setClientSecret("");
    setIsEditingClientSecret(false);
    setClientSecretStatus("Client secret updated and validated.");
    return true;
  }, [
    agency,
    attachCredentialSecret,
    clientSecret,
    entry.id,
    mutateConfiguration,
    mutateUser,
    note,
    setClientSecret,
    setIsEditingClientSecret,
    setIsEditingNote,
    setSavedNote,
  ]);

  const handleUseAction = useCallback(async () => {
    const hasPendingNoteChanges = note !== savedNote;
    const hasPendingUpdates =
      Boolean(clientSecret) || isEditingNote || hasPendingNoteChanges;

    if (isInUse && !hasPendingUpdates) {
      clearSelectedCredential();
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

    selectCredential(
      token,
      profile,
      agency,
      {
        id: entry.id,
        type: entry.type,
        clientId,
        hasClientSecret: hasAttachedClientSecret,
      },
      { reorderApplications: false }
    );
  }, [
    agency,
    clearSelectedCredential,
    clientId,
    clientSecret,
    entry.id,
    entry.type,
    hasAttachedClientSecret,
    handleAttachClientSecret,
    isEditingNote,
    isInUse,
    needsClientSecret,
    note,
    persistNoteChanges,
    profile,
    savedNote,
    selectCredential,
    token,
  ]);

  const handleRemoveAction = useCallback(
    (open) => {
      setIsConfirmingRemove(false);
      const nextEntry = { id: entry.id, token, clientId };

      if (onRemoveRequest) {
        onRemoveRequest(nextEntry);
        return;
      }

      removeCredentialEntry(nextEntry);
      const delay = open ? 500 : 0;
      setTimeout(() => setRemoved(true), delay);
    },
    [clientId, entry.id, onRemoveRequest, removeCredentialEntry, token]
  );

  return {
    clientSecretError,
    setClientSecretError,
    clientSecretStatus,
    setClientSecretStatus,
    removed,
    isConfirmingRemove,
    setIsConfirmingRemove,
    setRemoved,
    persistNoteChanges,
    handleAttachClientSecret,
    handleUseAction,
    handleRemoveAction,
    isUseDisabled: needsClientSecret
      ? !clientSecret
      : shouldPromptForGlobalClientSecret
        ? !clientSecret && (hasValidationError || !token)
        : hasValidationError || !token,
    canManageAttachedClientSecret:
      Boolean(clientId) && hasAttachedClientSecret && !needsClientSecret,
    shouldPromptForGlobalClientSecret:
      shouldPromptForGlobalClientSecret &&
      Boolean(clientId) &&
      hasWorkingToken &&
      !hasAttachedClientSecret,
  };
}
