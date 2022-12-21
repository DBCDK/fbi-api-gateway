import config from "../config";
import { MANIFESTATION_FIELDS_FRAGMENT } from "./jedFragments";

const { url, ttl, prefix } = config.datasources.jed;

const WORK_QUERY = `query ($id: String) {
  manifestation(id: $id) {
    ...manifestationFields
  }
}
${MANIFESTATION_FIELDS_FRAGMENT}`;

/**
 * Fetches a work from the JED service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
export async function load({ pid, profile }, context) {
  return (
    await context.fetch(url, {
      method: "POST",
      body: JSON.stringify({
        query: WORK_QUERY,
        variables: { id: pid, profile: `${profile.agency}-${profile.name}` },
      }),
    })
  ).body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
