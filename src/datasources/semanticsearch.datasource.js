/**
 * @file Semantic search
 */

import config from "../config";

const { url, prefix, ttl, teamLabel } = config.datasources.semanticsearch;

export async function load(
  { q, limit = 10, offset = 0, threshold = 0, profile },
  context
) {
  const query = {
    search_string: q,
    agency: profile.agency,
    profile: profile.name,
    limit,
    offset,
    threshold,
    // Debug data from the underlying service is intentionally not exposed.
    debug: false,
  };

  const response = (
    await context.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    })
  ).body;

  const results = Array.isArray(response) ? response : [];

  // TODO: Use the actual hitcount when it is implemented by semantic-search.
  const hitcount = 0;

  return {
    result: results.map((item) => ({
      workid: item.persistent_work_id,
    })),
    hitcount,
  };
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
