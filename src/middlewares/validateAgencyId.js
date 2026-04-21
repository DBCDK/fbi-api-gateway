import config from "../config";

export function validateAgencyId(req, res, next) {
  // Bypass for introspection queries
  if (req.isIntrospectionQuery) {
    return next();
  }

  // If smaug configuration explicitly requires agencyId in params
  const alwaysRequireAgencyId =
    req.smaug?.gateway?.agency?.alwaysRequireAgencyId === true;

  const explicitAgencyId = req.params?.agencyId;

  // If agencyId is required in params but not provided, reject immediately
  if (alwaysRequireAgencyId && !explicitAgencyId) {
    return res.status(400).send({
      statusCode: 400,
      message: "agencyId must be provided in request path",
    });
  }

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
