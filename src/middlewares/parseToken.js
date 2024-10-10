import { parseTestToken } from "../utils/testUserStore";

/**
 * Parses token
 */
export async function parseToken(req, res, next) {
  // Get bearer token from authorization header

  req.tracking = {
    consent: req.headers["x-tracking-consent"] === "true",
    uniqueVisitorId: req.headers["x-unique-visitor-id"],
  };

  req.rawAccessToken = req.headers.authorization?.replace(/bearer /i, "");
  req.isTestToken = req.rawAccessToken?.startsWith("test");
  if (req.isTestToken) {
    // Using a test token will automatically mock certain datasources
    // making it possible to have test users
    const testToken = parseTestToken(req.rawAccessToken);
    req.testUser = testToken.testUser;
    req.accessToken = testToken.accessToken;
  } else {
    req.accessToken = req.rawAccessToken;
  }

  next();
}
