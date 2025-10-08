import { getStringArray } from "../utils/env";

// Normalize IDs: cast to string, trim, and drop empty/null
const norm = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

export function validateAgencyId(req, res, next) {
  const selectedAgencyId = norm(req?.profile?.agency);
  const defaultAgencyId = norm(req.smaug?.agencyId);
  const gatewaySettings = req.smaug?.gateway;

  // Build allowed list (gateway + default), normalize and remove falsy
  const allowedAgencies = [
    ...(gatewaySettings?.agencies?.ids || []).map(norm).filter(Boolean),
    defaultAgencyId,
  ].filter(Boolean);

  // Locked list from env, normalized
  const lockedAgencyIds = getStringArray("LOCKED_AGENCY_ID_LIST")
    .map(norm)
    .filter(Boolean);

  // First guard: must be allowed by gateway/default
  if (!allowedAgencies.includes(selectedAgencyId)) {
    res.status(403);
    return res.send({
      statusCode: 403,
      message: "Invalid agencyId",
    });
  }

  // If a locked list is provided, only those IDs are allowed
  if (lockedAgencyIds.length > 0) {
    if (!lockedAgencyIds.includes(selectedAgencyId)) {
      res.status(403);
      return res.send({
        statusCode: 403,
        message: "Invalid agencyId",
      });
    }
  }

  next();
}
