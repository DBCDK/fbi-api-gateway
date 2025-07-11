import { getQueryComplexityClass } from "../utils/complexity";
import createHash from "../utils/hash";
import { log } from "dbc-node-logger";
import isbot from "isbot";
import { observeDuration } from "../utils/monitor";
import { getDebugInfo } from "../utils/debug";

/**
 * Middleware that monitors performance of those GraphQL queries
 * which specify a monitor name.
 */
export async function performanceTracker(req, res, next) {
  // Delay from request reaching the internal proxy until it is being processed
  const delay = Date.now() - parseInt(req.headers["x-timestamp"], 10);

  res.once("finish", () => {
    const elapsed = performance.now() - req.requestStart;
    const seconds = elapsed / 1000;

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

    const estimatedCpu = req.cpuTracker?.estimatedCpuTimeMs;

    // detailed logging for SLA
    log.info("TRACK", {
      clientId: req?.smaug?.app?.clientId,
      uuid: req?.datasources?.stats.uuid,
      parsedQuery: req.parsedQuery,
      queryVariables,
      datasources: req.datasources.stats.summary(),
      profile: req.profile,
      proxyDelayMs: delay,
      total_ms: Math.round(delay + elapsed),
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
      onOperationCompleteDuration: req.onOperationCompleteDuration,
      keepAliveReqCount: req.socket.count,
      estimatedCpuTimeMs:
        typeof estimatedCpu === "number"
          ? Number(estimatedCpu.toFixed(1))
          : undefined,
      debug: getDebugInfo(req),
    });
    // monitorName is added to context/req in the monitor resolver
    if (req.monitorName) {
      observeDuration(req.monitorName, seconds);
    }
  });
  next();
}
