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

const mappedFilterValues = {
  status: {
    ONSHELF: "OnShelf",
    ONLOAN: "OnLoan",
  },
};

/**
 * Map filters. Some filters are renamed for search service
 *
 * @param filters
 * @returns {*}
 */
export function mapFilters(filters) {
  const obj = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (mappedFilterValues[key]) {
      value = [mappedFilterValues[key][value]] || value;
    }
    obj[mappedFilters[key] || key] = value;
  });
  return obj;
}

/** FACETS **/

const mapFromFacetEnumList = {
  WORKTYPES: "workTypes",
  MAINLANGUAGES: "mainLanguages",
  MATERIALTYPESGENERAL: "materialTypesGeneral",
  MATERIALTYPESSPECIFIC: "materialTypesSpecific",
  FICTIONALCHARACTERS: "fictionalCharacters",
  GENREANDFORM: "genreAndForm",
  CHILDRENORADULTS: "childrenOrAdults",
  ACCESSTYPES: "accessTypes",
  FICTIONNONFICTION: "fictionNonfiction",
  SUBJECTS: "subjects",
  CREATORS: "creators",
  CANALWAYSBELOANED: "canAlwaysBeLoaned",
  YEAR: "year",
  DK5: "dk5",
  AGE: "age",
  LIX: "lix_range",
  LET: "let_range",
  GENERALAUDIENCE: "generalAudience",
  LIBRARYRECOMMENDATION: "libraryRecommendation",
  GAMEPLATFORM: "gamePlatform",
};

// Reverse mapFromFacetEnumList
const mapToFacetEnumList = Object.fromEntries(
  Object.entries(mapFromFacetEnumList).map(([k, v]) => [v, k])
);

/**
 * Some facets are renamed for simplesearch intelligent facet service.
 * @param name
 * @returns {*}
 */
export function mapToFacetEnum(name) {
  return mapToFacetEnumList[name] || name;
}

/**
 * Some facets are renamed for simplesearch facet service.
 * @param facets
 * @returns {*}
 */
export function mapFromFacetEnum(facet) {
  return mapFromFacetEnumList[facet] || facet;
}

/**
 * Some facets are renamed for simplesearch facet service.
 * @param facets
 * @returns {*}
 */
export function mapFromFacetEnums(facets) {
  const mapped = facets?.map((facet) => {
    return mapFromFacetEnumList[facet] || facet;
  });
  return mapped;
}

/**
 * Some facets (for now lix, let) are renamed for simplesearch facet service.
 * @param facets
 * @returns {*}
 */
const mappedFacets = { lix_range: "lix", let_range: "let" };

export function mapFacet(facet) {
  return mappedFacets[facet] || facet;
}
