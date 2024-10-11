/**
 * Checks if the calling may use the selected agencyId
 */
export async function validateAgencyId(req, res, next) {
  const selectedAgencyId = req?.profile?.agency;
  const defaultAgencyId = req.smaug?.agencyId;
  const gatewaySettings = req.smaug?.gateway;
  const allowedAgencies = [
    ...(gatewaySettings?.agencies?.ids || []),
    defaultAgencyId,
  ];

  if (!allowedAgencies?.includes(selectedAgencyId)) {
    res.status(403);
    return res.send({
      statusCode: 403,
      message: "Invalid agencyId",
    });
  }

  next();
}
