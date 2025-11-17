import { log } from "dbc-node-logger";
import { resolveWork } from "../utils/utils";
import {
  collectAuthorEntriesFromWork,
  collectSeriesIdsPerWork,
  fetchCreatorInfoForCandidate,
  getTopWorkIdsFromComplexSearch,
  loadSeriesById,
  resolveWorksByIds,
  selectDominantAuthor,
  selectDominantSeriesId,
} from "../utils/search";
import { createTraceId } from "../utils/trace";

export const typeDef = `
"""
Search Filters
"""
input ComplexSearchFiltersInput {
  """
  BranchId. 
  """
  branchId: [String!]
  """
  Overall location in library (eg. Voksne).
  """
  department: [String!]
  """
  Where is the book physically located  (eg. skønlitteratur).
  """
  location: [String!]
  """
  More specific location (eg. Fantasy).
  """
  sublocation: [String!]
  """
  Onloan or OnShelf.
  """
  status: [HoldingsStatusEnum!]
  """
  Id of agency.
  """
  agencyId: [String!]
  """
  Name of the branch.
  """
  branch: [String!]
  """
  Local id of the item.
  """
  itemId: [String!]
  """  
  Id of publishing issue.
  """
  issueId: [String!]
  """
  Date of first accession
  """
  firstAccessionDate: String
}



enum SortOrderEnum {
  ASC
  DESC 
}

input SortInput {
  index: String!
  order: SortOrderEnum!
}

"""
The supported facet fields
"""
enum ComplexSearchFacetsEnum {  
  AGES,
  CATALOGUECODE,
  CONTRIBUTOR,
  CONTRIBUTORFUNCTION,
  CREATOR,
  CREATORCONTRIBUTOR,
  CREATORCONTRIBUTORFUNCTION,
  CREATORFUNCTION,
  FICTIONALCHARACTER,
  FILMNATIONALITY,
  GAMEPLATFORM,
  GENERALAUDIENCE,
  GENERALMATERIALTYPE,
  GENREANDFORM,
  ISSUE,
  LANGUAGE,
  LIBRARYRECOMMENDATION,
  MAINLANGUAGE,
  MUSICALENSEMBLEORCAST,
  PLAYERS,
  PRIMARYTARGET,
  SPECIFICMATERIALTYPE,
  SPOKENLANGUAGE,
  SUBTITLELANGUAGE,
  TYPEOFSCORE,
  SUBJECT,
  HOSTPUBLICATION,
  SERIES,
  MEDIACOUNCILAGERESTRICTION,
  ACCESSTYPE,
  MOOD,
  NARRATIVETECHNIQUE,
  PEGI,
  SETTING,
  LIX,
  LET,
  PUBLICATIONYEAR,
  SOURCE,
  INSTRUMENT,
  CHOIRTYPE,
  CHAMBERMUSICTYPE
  }

"""
The facets to ask for
"""
input ComplexSearchFacetsInput {
  facetLimit: Int!
  facets: [ComplexSearchFacetsEnum!]
}

"""
A Facet value in response
"""
type ComplexSearchFacetValue{
  key: String!
  score: Int!
  traceId: String
}

"""
The complete facet in response
"""
type ComplexSearchFacetResponse{
  name: String
  values: [ComplexSearchFacetValue!]
}

type ComplexFacetResponse {
  hitcount: Int!
  facets: [ComplexSearchFacetResponse!]
}

"""
The search response
"""
type ComplexSearchResponse {
  """
  Total number of works found. May be used for pagination.
  """
  hitcount: Int!
  
  """
  Facets for this response
  """
  facets: [ComplexSearchFacetResponse!]

  """
  The works matching the given search query. Use offset and limit for pagination.
  """
  works(offset: Int! limit: PaginationLimitScalar!, sort: [SortInput!]): [Work!]! @complexity(value: 5, multipliers: ["limit"])

  """
  Error message, for instance if CQL is invalid
  """
  errorMessage: String

  """
  Dominant author among the top 5 works if at least 3 works share the same author.
  """
  creatorHit: CreatorInfo

  """
  Dominant series among the top 5 works if at least 3 belong to the same series.
  """
  seriesHit: Series
}
`;

/**
 * Make an object for a POST request
 * @param parent
 * @param context
 * @param args
 * @returns {{offset: (*|number), profile, limit: (*|number), filters: ([{category: string, subCategories: string[]},{category: string, subCategories: string[]}]|[{category: string, subCategories: string[]}]|[{category: string, subCategories: [string]}]|[{category: string, subCategories: []}]|[{category: string}]|[]|*), cql}}
 */
function setPost(parent, context, args) {
  return {
    offset: args?.offset || 0,
    limit: args?.limit || 10,
    cql: parent.cql,
    profile: context.profile,
    filters: parent.filters,
    facets: parent?.facets?.facets,
    facetLimit: parent?.facets?.facetLimit,
    includeFilteredPids: parent?.includeFilteredPids || false,
    ...(args && args),
  };
}

/**
 * Will add traceIds to the facets and send the event to the datahub
 */
async function traceFacets({ response, context, parent, args }) {
  const facetsWithTraceIds = response?.facets?.map((facet) => ({
    ...facet,
    values: facet?.values?.map((value) => {
      return { ...value, traceId: createTraceId() };
    }),
  }));

  if (facetsWithTraceIds?.length > 0) {
    await context?.dataHub?.createComplexSearchEvent({
      input: { ...parent, ...args, profile: context.profile },
      result: {
        works: response?.works?.map((id) => ({
          workId: id,
          // do we need this??  traceId: createTraceId(),//todo move to datasource?
        })),
        facets: facetsWithTraceIds,
      },
    });
  }

  return facetsWithTraceIds;
}

// /**
//  * Load top 5 workIds for the given complex search parent
//  */
// async function loadTopWorkIds(parent, context, limit = 5) {
//   const res = await context.datasources
//     .getLoader("complexsearch")
//     .load(setPost(parent, context, { offset: 0, limit }));
//   return { workIds: res?.works || [], searchHits: res?.searchHits };
// }

export const resolvers = {
  ComplexFacetResponse: {
    async facets(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexFacets")
        .load(setPost(parent, context, args));

      const facetsWithTraceIds = await traceFacets({
        response: res,
        parent,
        context,
        args,
      });

      return facetsWithTraceIds;
    },
    async hitcount(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexFacets")
        .load(setPost(parent, context, args));
      return res?.hitcount || 0;
    },
  },
  ComplexSearchResponse: {
    async hitcount(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context, args));
      return res?.hitcount || 0;
    },
    async creatorHit(parent, args, context) {
      const { workIds, searchHits } = await getTopWorkIdsFromComplexSearch(
        parent,
        context
      );

      if (!workIds || workIds.length === 0) return null;
      const works = await resolveWorksByIds(workIds, context, searchHits);

      // Collect authors across works
      const authorEntries = works
        .map((work, idx) => collectAuthorEntriesFromWork(work, idx))
        .flat()
        .filter(Boolean);

      if (authorEntries.length === 0) return null;

      // Choose dominant author (>= 3 in top 5)
      const candidate = selectDominantAuthor(authorEntries);

      if (!candidate) return null;

      // Fetch CreatorInfo details
      try {
        return await fetchCreatorInfoForCandidate(candidate, context);
      } catch (e) {
        return null;
      }
    },
    async seriesHit(parent, args, context) {
      const { workIds, searchHits } = await getTopWorkIdsFromComplexSearch(
        parent,
        context
      );
      if (workIds?.length < 0) return null;

      const works = await resolveWorksByIds(workIds, context, searchHits);
      const seriesPerWork = await Promise.all(
        works.map((work) => collectSeriesIdsPerWork(work, context))
      );

      const selectedSeriesId = selectDominantSeriesId(seriesPerWork);
      if (!selectedSeriesId) return null;

      return await loadSeriesById(selectedSeriesId, context);
    },
    async errorMessage(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context, args));
      return res?.errorMessage;
    },
    async facets(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context, args));

      const facetsWithTraceIds = await traceFacets({
        response: res,
        parent,
        context,
        args,
      });

      return facetsWithTraceIds;
    },
    async works(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context, args));

      const resolvedWorks = await Promise.all(
        res?.works?.map(async (id) => {
          const work = await resolveWork(
            { id, searchHits: res?.searchHits },
            context
          );
          if (!work) {
            log.error(
              `ERROR, Got a workID from CS that is missing in jed-presentation. ${id}`
            );
          }
          if (!work?.manifestations?.searchHits) {
            log.error(`ERROR, missing searchHits. ${id}`);
          }
          return work;
        })
      );

      const input = {
        ...parent,
        ...args,
        profile: context.profile,
      };

      const works = resolvedWorks.filter((work) => !!work);
      context?.dataHub?.createComplexSearchEvent({
        input: input,
        result: { works },
      });

      return works;
    },
  },
};
