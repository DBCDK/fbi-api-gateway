import request from "superagent";
import config from "../config";
import { WORK_FIELDS_FRAGMENT } from "./jedFragments";

const { url, ttl, prefix } = config.datasources.jed;

const WORK_QUERY = `query ($id: String) {
  work(id: $id) {
    ...workFields
  }
}
${WORK_FIELDS_FRAGMENT}`;

/**
 * Fetches a work from the JED service
 * @param {Object} params
 * @param {string} params.workId id of the work
 */
export async function load({ workId, profile }) {
  return (
    await request.post(url).send({
      query: WORK_QUERY,
      variables: { id: workId, profile: `${profile.agency}-${profile.name}` },
    })
  ).body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
