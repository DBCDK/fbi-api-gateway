import { useCallback } from "react";

import useCredentialClientSecret from "./useCredentialClientSecret";
import useCredentialEntries, {
  getCredentialEntryId,
} from "./useCredentialEntries";
import useCredentialRefreshToken from "./useCredentialRefreshToken";
import useCredentialResolve from "./useCredentialResolve";
import useSelectedCredential, {
  matchesSelectedCredentialIdentity,
} from "./useSelectedCredential";

function buildSelectedCredentialValue({
  token,
  profile,
  agency,
  metadata = null,
  current = null,
  applicationEntry = null,
}) {
  return {
    token,
    profile: profile === undefined ? current?.profile ?? null : profile,
    agency: agency === undefined ? current?.agency ?? null : agency,
    id: getCredentialEntryId({
      id: metadata?.id ?? applicationEntry?.id ?? current?.id ?? null,
      type: metadata?.type ?? applicationEntry?.type ?? current?.type ?? null,
      token,
      clientId:
        metadata?.clientId ??
        applicationEntry?.clientId ??
        current?.clientId ??
        null,
    }),
    type:
      metadata?.type ?? applicationEntry?.type ?? current?.type ?? null,
    clientId:
      metadata?.clientId ??
      applicationEntry?.clientId ??
      current?.clientId ??
      null,
    hasClientSecret:
      metadata?.hasClientSecret ??
      applicationEntry?.hasClientSecret ??
      current?.hasClientSecret ??
      false,
  };
}

export default function useCredentialMutations() {
  const { resolveCredential } = useCredentialResolve();
  const { attachClientSecret } = useCredentialClientSecret();
  const { attachRefreshToken } = useCredentialRefreshToken();
  const { selectedCredential, setSelectedCredential, clearSelectedCredential } =
    useSelectedCredential();
  const { applications, setCredentialEntry, removeCredentialEntry } =
    useCredentialEntries();

  const selectCredential = useCallback(
    (token, profile, agency, metadata = null, options = {}) => {
      const { reorderApplications = true, reorderHistory } = options;
      const shouldReorderEntries =
        reorderHistory === undefined ? reorderApplications : reorderHistory;
      const current = matchesSelectedCredentialIdentity(
        selectedCredential,
        token,
        metadata
      )
        ? selectedCredential
        : {};
      const applicationEntry =
        metadata?.id || metadata?.clientId
          ? null
          : applications?.find?.((entry) => entry?.token === token) || null;

      const nextSelectedCredential = buildSelectedCredentialValue({
        token,
        profile,
        agency,
        metadata,
        current,
        applicationEntry,
      });

      setSelectedCredential(nextSelectedCredential);

      if (shouldReorderEntries) {
        setCredentialEntry(nextSelectedCredential, false);
      }

      return nextSelectedCredential;
    },
    [
      applications,
      selectedCredential,
      setCredentialEntry,
      setSelectedCredential,
    ]
  );

  const persistResolvedEntry = useCallback(
    (entry, options = {}) => {
      if (!entry) {
        return null;
      }

      const { note, select = false, reorderApplications = false } = options;
      const persistedEntry = setCredentialEntry(
        {
          ...entry,
          note,
        },
        false
      );

      if (select && entry.token) {
        selectCredential(entry.token, entry.profile, entry.agency, {
          id: entry.id,
          type: entry.type,
          clientId: entry.clientId,
          hasClientSecret: entry.hasClientSecret,
        }, { reorderApplications });
      }

      return persistedEntry || entry;
    },
    [selectCredential, setCredentialEntry]
  );

  const resolveCredentialValue = useCallback(
    async (input) => {
      const response = await resolveCredential(input);

      if (response?.safeEntry) {
        persistResolvedEntry(response.safeEntry, {
          note: input?.note,
          select: Boolean(response.safeEntry.token),
          reorderApplications: false,
        });
      }

      return response;
    },
    [persistResolvedEntry, resolveCredential]
  );

  const attachCredentialSecret = useCallback(
    async ({ entryId, clientSecret, agency, note } = {}) => {
      const response = await attachClientSecret({
        entryId,
        clientSecret,
        agency,
      });

      if (response?.safeEntry) {
        persistResolvedEntry(response.safeEntry, {
          note,
          select: Boolean(response.safeEntry.token),
          reorderApplications: false,
        });
      }

      return response;
    },
    [attachClientSecret, persistResolvedEntry]
  );

  const attachCredentialRefreshToken = useCallback(
    async ({ entryId, refreshToken, agency, note } = {}) => {
      const response = await attachRefreshToken({
        entryId,
        refreshToken,
        agency,
      });

      if (response?.safeEntry) {
        persistResolvedEntry(response.safeEntry, {
          note,
          select: Boolean(response.safeEntry.token),
          reorderApplications: false,
        });
      }

      return response;
    },
    [attachRefreshToken, persistResolvedEntry]
  );

  return {
    selectedCredential,
    selectCredential,
    clearSelectedCredential,
    setCredentialEntry,
    removeCredentialEntry,
    resolveCredentialValue,
    attachCredentialSecret,
    attachCredentialRefreshToken,
    persistResolvedEntry,
  };
}
