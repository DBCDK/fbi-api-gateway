import { useCallback } from "react";
import useSWR from "swr";

import { toCredentialId } from "@/utils/credentials";
import { MAX_CLIENT_ENTRIES } from "@/utils/clientEntries";

const APPLICATIONS_ENDPOINT = "/api/credentials/applications";

function normalizeMaxClientEntries(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : MAX_CLIENT_ENTRIES;
}

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.status}`);
  }

  const body = await response.json();
  return {
    applications: body.applications || [],
    maxClientEntries: normalizeMaxClientEntries(body.maxClientEntries),
  };
};

const isTransientEntry = (entry = {}) =>
  Boolean(
    entry?.isPending ||
      entry?.isEntering ||
      entry?.isRemoving ||
      entry?.status === "INVALID" ||
      entry?.status === "ERROR"
  );

export const getApplicationIdentifier = (entry = {}) => {
  const { id, token, clientId } = entry || {};
  return clientId ? `client:${clientId}` : id || token || null;
};

export const getCanonicalApplicationId = (entry = {}) => {
  const { id, type, token, clientId } = entry || {};
  return id || toCredentialId({ type, token, clientId }) || null;
};

const mergeApplications = (items = []) =>
  items.reduce((acc, item) => {
    const existingIndex = acc.findIndex(
      (entry) => getApplicationIdentifier(entry) === getApplicationIdentifier(item)
    );

    if (existingIndex === -1) {
      acc.push(item);
      return acc;
    }

    acc[existingIndex] = {
      ...acc[existingIndex],
      ...item,
      note:
        typeof item?.note === "string"
          ? item.note
          : acc[existingIndex]?.note || "",
    };

    return acc;
  }, []);

function buildPersistableEntry(entry = {}) {
  const id = getCanonicalApplicationId(entry);

  if (!id) {
    return null;
  }

  return {
    id,
    type: entry.type || undefined,
    clientId: entry.clientId || undefined,
    profile: entry.profile === undefined ? undefined : entry.profile,
    agency: entry.agency === undefined ? undefined : entry.agency,
    note: entry.note === undefined ? undefined : entry.note,
  };
}

async function patchApplication(entry) {
  const persistable = buildPersistableEntry(entry);

  if (!persistable) {
    return null;
  }

  const response = await fetch(APPLICATIONS_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(persistable),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist application: ${response.status}`);
  }

  const body = await response.json();
  return body.application || null;
}

async function deleteApplication(id) {
  const response = await fetch(APPLICATIONS_ENDPOINT, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entryId: id }),
  });

  if (!response.ok) {
    throw new Error(`Failed to remove application: ${response.status}`);
  }
}

export default function useApplications() {
  const { data, error, mutate } = useSWR(APPLICATIONS_ENDPOINT, fetcher);
  const applications = Array.isArray(data) ? data : data?.applications || [];
  const maxClientEntries = normalizeMaxClientEntries(data?.maxClientEntries);
  const hasFetchedApplications = data !== undefined || Boolean(error);
  const mutateApplications = useCallback(
    (nextApplications, shouldRevalidate) => {
      if (nextApplications === undefined) {
        return mutate();
      }

      return mutate((current) => {
        const currentApplications = Array.isArray(current)
          ? current
          : current?.applications || [];
        const applicationsValue =
          typeof nextApplications === "function"
            ? nextApplications(currentApplications)
            : nextApplications;

        return {
          ...(Array.isArray(current) ? {} : current),
          applications: applicationsValue,
          maxClientEntries,
        };
      }, shouldRevalidate);
    },
    [maxClientEntries, mutate]
  );

  const setApplicationItem = useCallback(
    (entry, shallow = true) => {
      const nextId = getCanonicalApplicationId(entry);

      if (!nextId) {
        return null;
      }

      const normalizedEntry = {
        ...entry,
        id: nextId,
      };

      mutateApplications((current = []) => {
        let copy = [...current];
        const nextIdentifier = getApplicationIdentifier(normalizedEntry);
        const index = copy.findIndex(
          (item) => getApplicationIdentifier(item) === nextIdentifier
        );

        if (shallow && index !== -1) {
          copy[index] = {
            ...copy[index],
            ...normalizedEntry,
          };
        } else {
          copy = copy.filter(
            (item) => getApplicationIdentifier(item) !== nextIdentifier
          );
          copy.unshift({
            timestamp: Date.now(),
            ...normalizedEntry,
          });
        }

        return mergeApplications(copy).slice(0, maxClientEntries);
      }, false);

      if (!isTransientEntry(normalizedEntry)) {
        patchApplication(normalizedEntry).catch((error) => {
          mutateApplications();
        });
      }

      return normalizedEntry;
    },
    [maxClientEntries, mutateApplications]
  );

  const removeApplicationItem = useCallback(
    (entryOrId) => {
      const id =
        typeof entryOrId === "string"
          ? entryOrId
          : getCanonicalApplicationId(entryOrId || {});

      if (!id) {
        return;
      }

      mutateApplications(
        (current = []) =>
          current.filter((item) => {
            const identifier = getApplicationIdentifier(item);
            return identifier !== id && item.id !== id;
          }),
        false
      );

      deleteApplication(id).catch((error) => {
        mutateApplications();
      });
    },
    [mutateApplications]
  );

  const getApplicationItem = useCallback(
    (entryOrId) => {
      const id =
        typeof entryOrId === "string"
          ? entryOrId
          : getCanonicalApplicationId(entryOrId || {});

      if (!id) {
        return null;
      }

      return (
        applications.find((item) => {
          const identifier = getApplicationIdentifier(item);
          return identifier === id || item.id === id;
        }) || null
      );
    },
    [applications]
  );

  return {
    applications,
    maxClientEntries,
    hasFetchedApplications,
    mutateApplications,
    setApplicationItem,
    removeApplicationItem,
    getApplicationItem,
  };
}
