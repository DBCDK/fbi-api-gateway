import { v4 as uuid } from "uuid";
import config from "../config";
import createDataLoaders from "../datasourceLoader";

const allowDebug = config.allowDebug;

/**
 * Inits dataloaders
 */
export function initDataloaders(req, res, next) {
  // Enable datasource debug mode for this specific GraphQL request if the "x-debug" header is set to "true".
  //
  // When enabled:
  // - Fetch requests and responses from datasources with `allowDebug: true` are collected.
  // - Redis caching is disabled for those datasources to ensure real-time responses.
  // - Collected debug data is returned in the GraphQL response under `extensions.debug`.
  const debugEnabled = allowDebug && req.headers["x-debug"] === "true";

  // Allocate a debug object to collect request/response details, or null if not debugging
  req.datasourcesDebug = debugEnabled ? {} : null;

  req.datasources = createDataLoaders(
    uuid(),
    req.testUser,
    req.accessToken,
    req.tracking,
    req.dataHub,
    req.datasourcesDebug
  );
  next();
}
