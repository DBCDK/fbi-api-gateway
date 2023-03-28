/**
 * @file Facets
 */

import config from "../config";
import uniq from "lodash/uniq";

const {
  url,
  prefix,
  ttl,
  token,
  firstHits,
  disableFuzzySearch,
} = config.datasources.facets;

export async function load({ q, filters = {}, facets = [], profile }, context) {
  const { agency, name } = profile;
  // get parsed arguments for query
  // static parameters for the search
  const statics = {
    "access-token": token,
    debug: false,
    agency,
    "facets.first_hits": firstHits,
    profile: name,
  };

  // REMOVE WHEN SERVICE SUPPORTS materialTypesSpecific // // // // // // // //
  // facets
  const _facets = [...facets];
  const materialTypesSpecificIdx = _facets.indexOf("materialTypesSpecific");
  if (materialTypesSpecificIdx > -1) {
    _facets.splice(materialTypesSpecificIdx, 1, "materialTypes");
  }
  // filters
  const _filters = { ...filters };
  if (_filters.materialTypesSpecific) {
    if (!_filters.materialTypes) {
      _filters.materialTypes = _filters.materialTypesSpecific;
    }
    delete _filters.materialTypesSpecific;
  }
  // // // // // // // // // // // // // // // // // // // // // // // // // //

  // merge variables and statics
  const query = {
    q,
    // CHANGE BACK WHEN SERVICE SUPPORTS materialTypesSpecific
    filters: _filters,
    facets: uniq(_facets),
    // // // // // // // // // // // // // // // // // // // //
    disable_fuzzy_search: disableFuzzySearch,
    ...statics,
  };

  const res = (
    await context.fetch(url, { method: "POST", body: JSON.stringify(query) })
  ).body;

  // REMOVE WHEN SERVICE SUPPORTS materialTypesSpecific
  if (materialTypesSpecificIdx > -1) {
    res.facets.materialTypesSpecific = res.facets.materialTypes;
  }
  // // // // // // // // // // // // // // // // // //

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
