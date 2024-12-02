import { v4 as uuid } from "uuid";

import createDataLoaders from "../datasourceLoader";

/**
 * Inits dataloaders
 */
export function initDataloaders(req, res, next) {
  req.datasources = createDataLoaders(
    uuid(),
    req.testUser,
    req.accessToken,
    req.tracking,
    req.dataHub
  );
  next();
}
