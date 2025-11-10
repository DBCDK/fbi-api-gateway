import { parseClientPermissions } from "../../commonUtils";

/**
 * Adds the client permissions to context object
 */
export async function resolveClientPermissions(req, res, next) {
  const parsedPermissions = parseClientPermissions({
    smaug: { gateway: { ...req?.smaug?.gateway } },
  });

  req.clientPermissions = parsedPermissions;

  return next();
}
