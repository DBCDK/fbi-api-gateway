import { parseClientPermissions } from "../../commonUtils";

/**
 * Resolves the GraphQL query
 */
export async function resolveClientPermissions(req, res, next) {
  const parsedPermissions = parseClientPermissions({
    smaug: { gateway: { ...req?.smaug?.gateway } },
  });

  req.clientPermissions = parsedPermissions;

  return next();
}
