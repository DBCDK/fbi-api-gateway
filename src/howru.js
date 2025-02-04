import { log } from "dbc-node-logger";
import _ from "lodash";
import config from "./config";
import { datasources } from "./datasourceLoader";
import { status as redisStatus } from "./datasources/redis.datasource";
import { getStats } from "./utils/fetchWithLimit";

// Create upSince timestamp
let upSince = new Date();

// Array of services to check
const services = [
  ...datasources
   // .filter((datasource) => datasource.statusChecker)
    .map((datasource) => ({
      name: datasource.name,
      status: datasource.statusChecker,
    })),
  { name: "redis", status: redisStatus },
];

// Fields in the config that must not
// be exposed in the howru response
const omitKeys = [
  "authenticationUser",
  "authenticationGroup",
  "authenticationPassword",
  "token",
  "user",
  "password",
];

/**
 * Returns a list of services and their status
 */
export async function checkServicesStatus() {
  return await Promise.all(
      services.map(async (service) => {
        let ok = false;
        let message;
        try {
          await service.status();
          ok = true;
        } catch (e) {
          message = (e.response && e.response.text) || e.message;
        }
  
        // Return result for the service
        return {
          service: service.name,
          ok,
          message,
        };
      })
    );
}

/**
 * Route handler for the howru endpoint
 *
 */
async function howru(req, res) {
  // Call status function of every service
  const results = checkServicesStatus();

  // Loop through service status check results, to determine if all is ok
  let ok = true;
  results.forEach((service) => {
    if (!service.ok) {
      ok = false;
      res.status(500);
    }
  });

  // loop through http stats and check if all is ok
  const httpStats = getStats().map((service) => ({
    ...service,
    ok: service.errors === service.prevErrors,
  }));

  httpStats.forEach((service) => {
    if (!service.ok) {
      ok = false;
      res.status(500);
    }
  });

  // Log the datasource names that cause howru to fail
  [...results, ...httpStats]
    .filter((service) => !service.ok)
    .forEach((service) => {
      log.info("howru service error", {
        datasourceName: service.service,
      });
    });

  const body = {
    ok,
    upSince,
    services: results,
    httpStats,
    config: omitDeep(config, omitKeys),
  };

  log.info("howru status", {
    howruStatus: { ok, upSince, body: JSON.stringify(body) },
  });

  res.send(body);
}

export default howru;

/**
 * Omit keys deeply
 * Found here https://github.com/lodash/lodash/issues/723
 * @param {*} collection
 * @param {Array.<string>} excludeKeys
 */
function omitDeep(collection, excludeKeys) {
  function omitFn(value) {
    if (value && typeof value === "object") {
      excludeKeys.forEach((key) => {
        delete value[key];
      });
    }
  }

  return _.cloneDeepWith(collection, omitFn);
}
