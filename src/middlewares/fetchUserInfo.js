import { log } from "dbc-node-logger";
import { getIsIdpSystemUser } from "../../commonUtils";

/**
 * Middleware for fetching user information (for authenticated tokens)
 */
export async function fetchUserInfo(req, res, next) {
  // Provided token is authenticated
  const user = req.smaug?.user;
  const isAuthenticated = user?.id;

  // isUnknownSmaugUser is currently a nemlogin user with no associated agencies
  const isUnknownSmaugUser = !user?.agency && !user?.pin && !user?.uniqueId;

  const isIdpSystemUser = getIsIdpSystemUser({ smaug: req?.smaug, user });

  // skip userinfo if token is anonymous
  // and if it doesn't belong to an IDP system user
  if (!isAuthenticated && !isUnknownSmaugUser && !isIdpSystemUser) {
    return next();
  }

  try {
    const userinfo =
      req.accessToken &&
      (await req.datasources.getLoader("userinfo").load({
        accessToken: req.accessToken,
      }));

    req.user = userinfo?.attributes || null;
  } catch (e) {
    log.error("Error fetching from userinfo", { response: e });
    res.status(500);
    return res.send({
      statusCode: 500,
      message: "Internal server error",
    });
  }

  next();
}
