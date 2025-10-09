import config from "../config";

export function validateAgencyId(req, res, next) {
  const selectedAgencyId = req?.profile?.agency;
  const defaultAgencyId = req.smaug?.agencyId;
  const gatewaySettings = req.smaug?.gateway;

  // Build allowed list (gateway + default)
  const allowedAgencies = [
    ...(gatewaySettings?.agencies?.ids || []),
    defaultAgencyId,
  ].filter(Boolean);

  // Locked list from env
  const lockedAgencyIds = config?.lockedAgencyIds?.list;

  // Must be allowed by gateway/default
  if (!allowedAgencies.includes(selectedAgencyId)) {
    return res.status(403).send({
      statusCode: 403,
      message: "Invalid agencyId",
    });
  }

  // If a locked list is provided, only those IDs are allowed
  if (lockedAgencyIds.length > 0) {
    if (!lockedAgencyIds.includes(selectedAgencyId)) {
      return res.status(403).send({
        statusCode: 403,
        message: "Invalid agencyId",
      });
    }
  }

  next();
}
