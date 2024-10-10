import { getQueryComplexityClass } from "../utils/complexity";
import createHash from "../utils/hash";
import { log } from "dbc-node-logger";
import isbot from "isbot";
import { observeDuration } from "../utils/monitor";

/**
 * Middleware that monitors performance of those GraphQL queries
 * which specify a monitor name.
 */
export async function performanceTracker(req, res, next) {
  const start = process.hrtime();
  res.once("finish", () => {
    const elapsed = process.hrtime(start);
    const seconds = elapsed[0] + elapsed[1] / 1e9;

    // Convert variables to strings, to make sure there are no type conflicts,
    // when log is indexed
    let queryVariables = {};
    if (req.queryVariables) {
      Object.entries(req.queryVariables).forEach(
        ([key, val]) =>
          (queryVariables[key] =
            typeof val === "string" ? val : JSON.stringify(val))
      );
    }

    // Get query complexity class (simple|complex|critical|rejected)
    const complexityClass = getQueryComplexityClass(req.queryComplexity);

    const userAgent = req.get("User-Agent");

    const accessTokenHash = createHash(req.accessToken);

    // detailed logging for SLA
    log.info("TRACK", {
      clientId: req?.smaug?.app?.clientId,
      uuid: req?.datasources?.stats.uuid,
      parsedQuery: req.parsedQuery,
      queryVariables,
      datasources: req.datasources.stats.summary(),
      profile: req.profile,
      total_ms: Math.round(seconds * 1000),
      queryDepth: req.queryDepth,
      queryComplexity: req.queryComplexity,
      queryComplexityClass: complexityClass,
      isIntrospectionQuery: req.isIntrospectionQuery,
      graphQLErrors: req.graphQLErrors && JSON.stringify(req.graphQLErrors),
      userAgent,
      userAgentIsBot: isbot(userAgent),
      ip: req?.smaug?.app?.ips?.[0],
      isAuthenticatedToken: !!req.user?.userId,
      hasUniqueId: !!req.user?.uniqueId,
      accessTokenHash,
      isTestToken: req.isTestToken,
      fastLane: req.fastLane,
      operationName: req.operationName,
    });
    // monitorName is added to context/req in the monitor resolver
    if (req.monitorName) {
      observeDuration(req.monitorName, seconds);
    }
  });
  next();
}
