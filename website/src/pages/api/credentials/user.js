/**
 * @file API route for returning user/introspection data for either a raw token
 * or a server-side credential session entry with token lifecycle support.
 */
import { resolveCredentialAccessToken } from "../../../lib/credentialAccess";
import { buildUserResponse } from "../../../lib/credentialProviders";
import { getCredentialSessionEntry } from "../../../lib/credentialSession";

async function resolveAccessToken(req) {
  const token = typeof req.query.token === "string" ? req.query.token : null;

  if (token) {
    return { token, status: 200 };
  }

  const entryId =
    typeof req.query.entryId === "string" ? req.query.entryId : null;

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
  const resolved = await resolveAccessToken(req);

  if (resolved.status === 428) {
    return res.status(428).send({
      status: "CLIENT_SECRET_REQUIRED",
      user: {},
    });
  }

  if (resolved.status !== 200 || !resolved.token) {
    return res.status(resolved.status || 500).send({});
  }

  const userResponse = await buildUserResponse(resolved.token);

  if (userResponse.status !== 200) {
    return res.status(userResponse.status || 500).send({});
  }

  return res.status(200).send({
    user: userResponse.body || {},
  });
}
