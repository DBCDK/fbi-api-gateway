import { useCallback } from "react";
import { useSWRConfig } from "swr";

import useCredentialClientSecret from "./useCredentialClientSecret";
import useCredentialEntries, {
  getCredentialEntryId,
} from "./useCredentialEntries";
import useCredentialRefreshToken from "./useCredentialRefreshToken";
import useCredentialResolve from "./useCredentialResolve";
import useInternalNetworkCheck from "./useInternalNetworkCheck";
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

function buildCredentialConfigurationKey({
  entryId,
  agency = null,
  internalNetworkCheck = null,
}) {
  if (!entryId) {
    return null;
  }

  const params = new URLSearchParams({ entryId });

  if (agency) {
    params.set("agency", agency);
  }

  if (internalNetworkCheck) {
    params.set("networkCheck", internalNetworkCheck);
  }

  return `/api/credentials/configuration?${params.toString()}`;
}

function buildCredentialUserKey({ entryId, profile = null }) {
  if (!entryId) {
    return null;
  }

  const params = new URLSearchParams({ entryId });

  if (profile) {
    params.set("profile", profile);
  }

  return `/api/credentials/user?${params.toString()}`;
}

function uniqueValues(values = []) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

export default function useCredentialMutations() {
  const { mutate } = useSWRConfig();
  const { resolveCredential } = useCredentialResolve();
  const { attachClientSecret, removeClientSecret } = useCredentialClientSecret();
  const { attachRefreshToken } = useCredentialRefreshToken();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const { selectedCredential, setSelectedCredential, clearSelectedCredential } =
    useSelectedCredential();
  const { applications, setCredentialEntry, removeCredentialEntry } =
    useCredentialEntries();

  const revalidateCredentialViews = useCallback(
    async (entryId, entry = {}) => {
      if (!entryId) {
        return;
      }

      const configurationKeys = uniqueValues([
        buildCredentialConfigurationKey({
          entryId,
          internalNetworkCheck,
        }),
        buildCredentialConfigurationKey({
          entryId,
          agency: entry?.agency,
          internalNetworkCheck,
        }),
      ]);
      const userKeys = uniqueValues([
        buildCredentialUserKey({ entryId }),
        buildCredentialUserKey({
          entryId,
          profile: entry?.profile,
        }),
      ]);
      const keys = [...configurationKeys, ...userKeys];

      await Promise.all(keys.map((key) => mutate(key)));
    },
    [internalNetworkCheck, mutate]
  );

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

      const {
        note,
        select = false,
        reorderApplications = false,
        preservePosition = false,
      } = options;
      const existingEntry =
        applications?.find?.((item) => item?.id === entry.id) ||
        applications?.find?.(
          (item) => item?.clientId && entry.clientId && item.clientId === entry.clientId
        ) ||
        null;
      const replacedToken =
        Boolean(existingEntry?.token) &&
        Boolean(entry?.token) &&
        existingEntry.token !== entry.token;
      const persistedEntry = setCredentialEntry(
        {
          ...entry,
          note,
        },
        preservePosition
      );

      if (select && entry.token) {
          selectCredential(entry.token, entry.profile, entry.agency, {
            id: entry.id,
            type: entry.type,
            clientId: entry.clientId,
            hasClientSecret: entry.hasClientSecret,
          }, { reorderApplications });
      }

      if (replacedToken && entry.id) {
        revalidateCredentialViews(entry.id, entry);
      }

      return persistedEntry || entry;
    },
    [applications, revalidateCredentialViews, selectCredential, setCredentialEntry]
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
    async ({
      entryId,
      clientSecret,
      agency,
      note,
      preservePosition = false,
    } = {}) => {
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
          preservePosition,
        });
      }

      return response;
    },
    [attachClientSecret, persistResolvedEntry]
  );

  const removeCredentialSecret = useCallback(
    async ({ entryId, note, preservePosition = false } = {}) => {
      const response = await removeClientSecret({
        entryId,
      });

      if (response?.safeEntry) {
        persistResolvedEntry(response.safeEntry, {
          note,
          select: Boolean(response.safeEntry.token),
          reorderApplications: false,
          preservePosition,
        });
      }

      return response;
    },
    [persistResolvedEntry, removeClientSecret]
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
    removeCredentialSecret,
    attachCredentialRefreshToken,
    persistResolvedEntry,
  };
}
