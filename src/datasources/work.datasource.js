import request from "superagent";
import { cached } from "./cache";
import config from "../config";

/**
 * Fetches a work from the work service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
async function fetchWork({ workId }) {
  const { url, agencyId, profile } = config.datasources.work;
  return (
    await request.get(url).query({
      workId,
      // trackingId: 'bibdk-api', this should be dynamic, and be generated per graphql request
      agencyId,
      profile
    })
  ).body;
}

export default { get: cached(fetchWork, { stdTTL: 60 * 60 * 24 }) };
