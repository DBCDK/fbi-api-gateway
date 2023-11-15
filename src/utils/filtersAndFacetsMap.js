/**
 * @file - holds maps and function to map facets and filters
 *
 * eg. parameter ageRange (fbi-api) needs to be mapped to age_range for simplesearch to understand it
 */

/** FILTERS **/

/**
 * Holds filters that needs to  be renamed for search service
 * @type {{ageRange: string, letRange: string, lixRange: string}}
 */
const mappedFilters = {
  ageRange: "age_range",
  lixRange: "lix_range",
  letRange: "let_range",
};

/**
 * Map filters. Some filters are renamed for search service
 *
 * @param filters
 * @returns {*}
 */
export function mapFilters(filters) {
  const returnObject = {};
  for (const [key, value] of Object.entries(filters)) {
    returnObject[mappedFilters[key] || key] = value;
  }
  return returnObject;
}

/** FACETS **/

/**
 * Holds facets that needs to be renamed for facet service.
 * @type {{lix: string, let: string}}
 */
const mappedFacets = {
  lix: "lix_range",
  let: "let_range",
};

/**
 * Some facets (for now lix, let) are renamed for simplesearch facet service.
 * @param facets
 * @returns {*}
 */
export function mapFacets(facets) {
  const mapped = facets?.map((facet) => {
    return mappedFacets[facet] || facet;
  });
  return mapped;
}
