import config from "../config";
import {
  MANIFESTATION_FIELDS_FRAGMENT,
  WORK_FIELDS_FRAGMENT,
} from "./jedFragments";

const { url, ttl, prefix } = config.datasources.jed;

const WORK_QUERY = `query ($id: String) {
  work(id: $id) {
    ...workFields
    manifestations {
      first {
        ...manifestationFields
      }
      latest {
        ...manifestationFields
      }
      all {
        ...manifestationFields
      }
      bestRepresentations {
        ...manifestationFields
      }
      mostRelevant {
        ...manifestationFields
      }
    }
  }
}
${WORK_FIELDS_FRAGMENT}
${MANIFESTATION_FIELDS_FRAGMENT}`;

/**
 * Fetches a work from the JED service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
export async function load({ workId, profile }, context) {
  const res = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify({
      query: WORK_QUERY,
      variables: {
        id: workId,
        profile: `${profile.agency}-${profile.name}`,
      },
    }),
  });

  return await res.json();
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
