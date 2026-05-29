/**
 * @file API route for returning Smaug configuration for either a raw token or
 * a server-side credential session entry that can provide a valid token.
 */
import { resolveCredentialAccessToken } from "../../../lib/credentialAccess";
import { buildConfigurationResponse } from "../../../lib/credentialProviders";
import { getCredentialSessionEntry } from "../../../lib/credentialSession";

function getEntryId(req) {
  return typeof req.query.entryId === "string" ? req.query.entryId : null;
}

async function resolveAccessToken(req) {
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (token) {
    return { token, status: 200 };
  }

  const entryId = getEntryId(req);

  if (!entryId) {
    return { status: 400 };
  }

  const sessionEntry = await getCredentialSessionEntry({ req }, entryId);

  if (!sessionEntry) {
    return { status: 404 };
  }

  return await resolveCredentialAccessToken({
    ctx: { req, res: req.res },
    entryId,
    entry: sessionEntry,
    req,
  });
}

export default async function handler(req, res) {
  const selectedAgency =
    typeof req.query.agency === "string" && req.query.agency
      ? req.query.agency
      : null;

  const resolved = await resolveAccessToken(req);

  if (resolved.status === 428) {
    return res.status(428).send({
      status: "CLIENT_SECRET_REQUIRED",
      network: resolved.entry?.network || null,
      clientId: resolved.entry?.clientId || null,
    });
  }

  if (resolved.status !== 200 || !resolved.token) {
    return res.status(resolved.status || 500).send({});
  }

  const configurationResponse = await buildConfigurationResponse(
    resolved.token,
    selectedAgency
  );

  if (configurationResponse.status !== 200) {
    return res.status(configurationResponse.status).send({});
  }

  return res
    .status(200)
    .send({
      ...(configurationResponse.body || {}),
      resolvedToken: resolved.token,
      resolvedEntryId: resolved.entry?.id || getEntryId(req),
      resolvedClientId:
        resolved.entry?.clientId ||
        configurationResponse.body?.clientId ||
        null,
      resolvedType: resolved.entry?.type || null,
    });
}
