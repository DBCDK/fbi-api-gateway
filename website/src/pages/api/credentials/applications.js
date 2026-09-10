import { getCredentialSession, removeCredentialSessionEntry, upsertCredentialSessionEntry } from "../../../lib/credentialSession";
import { listApplicationEntries } from "../../../lib/credentialApplications";
import { toCredentialId } from "../../../utils/credentials";

function getEntryId(payload = {}) {
  if (typeof payload.entryId === "string" && payload.entryId) {
    return payload.entryId;
  }

  if (typeof payload.id === "string" && payload.id) {
    return payload.id;
  }

  return (
    toCredentialId({
      type: payload.type,
      token: payload.token,
      clientId: payload.clientId,
    }) || null
  );
}

function pickPersistedFields(payload = {}) {
  return {
    type: payload.type || undefined,
    clientId: payload.clientId || undefined,
    profile: payload.profile === undefined ? undefined : payload.profile,
    agency: payload.agency === undefined ? undefined : payload.agency,
    note: payload.note === undefined ? undefined : payload.note,
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { session } = await getCredentialSession({ req, res });

    return res.status(200).send({
      applications: listApplicationEntries(session.entries || {}),
    });
  }

  if (req.method === "PATCH") {
    const entryId = getEntryId(req.body || {});

    if (!entryId) {
      return res.status(400).send({
        status: "INVALID_APPLICATION_ENTRY",
        message: "An application id is required",
      });
    }

    const entry = await upsertCredentialSessionEntry(
      { req, res },
      entryId,
      pickPersistedFields(req.body || {})
    );

    return res.status(200).send({
      status: "OK",
      application: listApplicationEntries({ [entryId]: entry })[0] || null,
    });
  }

  if (req.method === "DELETE") {
    const entryId = getEntryId(req.body || req.query || {});

    if (!entryId) {
      return res.status(400).send({
        status: "INVALID_APPLICATION_ENTRY",
        message: "An application id is required",
      });
    }

    await removeCredentialSessionEntry({ req, res }, entryId);

    return res.status(200).send({
      status: "OK",
      entryId,
    });
  }

  return res.status(405).send({});
}
