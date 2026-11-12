/**
 * @file - holds maps and function to map facets and filters
 *
 * eg. parameter ageRange (fbi-api) needs to be mapped to age_range for simplesearch to understand it
 */

/** FILTERS **/

// Prefer the new representation, including explicitly empty facet values.
// TODO: Remove legacy aliases only when the deprecated GraphQL filters and
// facet enums are retired and clients have migrated, not at the backend switch.
export function getFacetAliases(name) {
  if (name === "genreAndForm" || name === "genreForm") {
    return ["genreForm", "genreAndForm"];
  }
  if (name === "generalAudience" || name === "audienceGeneral") {
    return ["audienceGeneral", "generalAudience"];
  }
  return [name];
}

// TODO: Remove version detection once all search and facet endpoints support
// the new names. Keep mapping legacy client names to the new backend names.
function backendFacetName(name, serviceUrl) {
  const aliases = getFacetAliases(name);
  if (aliases.length === 1) return name;
  // Simple-search 1.10 introduced the new names. Unknown/unversioned hosts
  // retain the existing contract; only the actual destination host is inspected.
  let version;
  try {
    version = new URL(serviceUrl).hostname.match(
      /^simple-search-fbiapi(?:-[a-z][a-z0-9]*)*-(\d+)-(\d+)(?:-\d+)?(?:\.|$)/
    );
  } catch {
    return aliases[1];
  }
  const modern =
    version &&
    (Number(version[1]) > 1 ||
      (Number(version[1]) === 1 && Number(version[2]) >= 10));
  return aliases[modern ? 0 : 1];
}

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
export function mapFilters(filters, serviceUrl) {
  const obj = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (getFacetAliases(key).length > 1) return;
    if (mappedFilterValues[key]) {
      value = [mappedFilterValues[key][value]] || value;
    }
    obj[mappedFilters[key] || key] = value;
  });
  // The new alias wins, including an explicitly empty list.
  const genre = filters.genreForm ?? filters.genreAndForm;
  if (genre != null) obj[backendFacetName("genreForm", serviceUrl)] = genre;
  const audience = filters.audienceGeneral ?? filters.generalAudience;
  if (audience != null)
    obj[backendFacetName("audienceGeneral", serviceUrl)] = audience;
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
  GENREFORM: "genreForm",
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
  AUDIENCEGENERAL: "audienceGeneral",
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
export function mapFromFacetEnums(facets, serviceUrl) {
  const mapped = facets?.map((facet) => {
    const name = mapFromFacetEnum(facet);
    return backendFacetName(name, serviceUrl);
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
