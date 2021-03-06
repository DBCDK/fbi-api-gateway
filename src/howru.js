import _ from "lodash";
import config from "./config";
import { datasources } from "./datasourceLoader";
import { status as redisStatus } from "./datasources/redis.datasource";

// Create upSince timestamp
let upSince = new Date();

// Array of services to check
const services = [
  ...datasources
    .filter((datasource) => datasource.statusChecker)
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
  "user",
  "password",
];

/**
 * Route handler for the howru endpoint
 *
 */
async function howru(req, res) {
  // Call status function of every service
  const results = await Promise.all(
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

  // Loop through service results, to determine if all is ok
  let ok = true;
  results.forEach((service) => {
    if (!service.ok) {
      ok = false;
      res.status(500);
    }
  });

  res.send({
    ok,
    upSince,
    services: results,
    config: omitDeep(config, omitKeys),
  });
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
