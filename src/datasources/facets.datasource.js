/**
 * @file Facets
 */

import request from "superagent";
import config from "../config";
const { agencyId: agency, name: profile } = config.profile;

const { url, prefix, ttl, token } = config.datasources.facets;

export async function load({ q, filters, facets = [] }) {
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    debug: false,
    agency,
    profile,
  };

  // merge variables and statics
  const query = {
    q,
    filters,
    facets,
    ...statics,
  };

  const res = (await request.post(url).send(query)).body;

  // parse
  return Object.entries(res.facets).map(([name, facetResult]) => {
    return {
      name,
      values: Object.entries(facetResult).map(([term, count]) => {
        return { term, count };
      }),
    };
  });
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};
