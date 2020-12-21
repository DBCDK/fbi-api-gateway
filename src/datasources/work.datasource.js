import { log } from "dbc-node-logger";
import request from "superagent";
import config from "../config";
import { withRedis } from "./redis.datasource";
import monitor from "../utils/monitor";

const { url, agencyId, profile, ttl, prefix } = config.datasources.work;

/**
 * Fetches a work from the work service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */

async function fetchWork({ workId }) {
  return (
    await request.get(url).query({
      workId,
      // trackingId: 'bibdk-api', this should be dynamic, and be generated per graphql request
      agencyId,
      profile,
      includeRelations: true
    })
  ).body;
}

// fetchWork monitored
const monitored = monitor(
  { name: "REQUEST_work", help: "work requests" },
  fetchWork
);

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
async function batchLoader(keys) {
  return await Promise.all(
    keys.map(async key => {
      try {
        return await monitored({ workId: key });
      } catch (e) {
        // We return error instead of throwing,
        // se we don't fail entire Promise.all
        // DataLoader will make sure its thrown in a resolver
        if (e.status !== 404) {
          log.error("Fetch work failed", { id: key, reason: e.message });
        }
        return e;
      }
    })
  );
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export async function status() {
  await monitored({ workId: "work-of:870970-basis:51877330" });
}

/**
 * Enhance batch function with Redis caching
 */
export default withRedis(batchLoader, {
  prefix,
  ttl
});
