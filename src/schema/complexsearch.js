import { log } from "dbc-node-logger";
import { resolveWork, fetchAndExpandSeries } from "../utils/utils";
import {
  collectAuthorEntriesFromWork,
  selectDominantAuthor,
  fetchCreatorInfoForCandidate,
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

/**
 * Load top 5 workIds for the given complex search parent
 */
async function loadTopWorkIds(parent, context, limit = 5) {
  const res = await context.datasources
    .getLoader("complexsearch")
    .load(setPost(parent, context, { offset: 0, limit }));
  return { workIds: res?.works || [], searchHits: res?.searchHits };
}

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
      const { workIds: topWorkIds, searchHits } = await loadTopWorkIds(
        parent,
        context,
        5
      );
      if (topWorkIds.length === 0) return null;

      const works = await Promise.all(
        topWorkIds.map(async (id) => {
          try {
            return await resolveWork({ id, searchHits }, context);
          } catch (e) {
            return null;
          }
        })
      );

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
      // Load top 5 works and check if at least 3 belong to the same series
      const { workIds: topWorkIds } = await loadTopWorkIds(parent, context, 5);
      if (!topWorkIds || topWorkIds.length < 3) return null;

      // Resolve works
      const works = await Promise.all(
        topWorkIds.map(async (id) => {
          try {
            return await resolveWork({ id }, context);
          } catch (e) {
            return null;
          }
        })
      );

      // For each work, fetch its series list and collect seriesIds
      const seriesPerWork = await Promise.all(
        works.map(async (work) => {
          if (!work) return [];
          try {
            const list = await fetchAndExpandSeries(work, context);
            // list elements include seriesId from utils.fetchAndExpandSeries
            const ids = Array.isArray(list)
              ? list
                  .map((s) => s?.seriesId)
                  .filter((v) => typeof v === "string" && v.length > 0)
              : [];
            // Deduplicate per work
            return Array.from(new Set(ids));
          } catch (e) {
            return [];
          }
        })
      );

      // Count series occurrences across the 3 works
      const counts = new Map();
      seriesPerWork.forEach((ids) => {
        ids.forEach((id) => {
          counts.set(id, (counts.get(id) || 0) + 1);
        });
      });

      // Find a series that appears in all three works (>=3)
      let selectedSeriesId = null;
      counts.forEach((count, id) => {
        if (count >= 3 && !selectedSeriesId) {
          selectedSeriesId = id;
        }
      });

      if (!selectedSeriesId) return null;

      // Fetch and return the series object similar to Query.series
      const seriesById = await context.datasources
        .getLoader("seriesById")
        .load({ seriesId: selectedSeriesId, profile: context.profile });

      if (!seriesById) return null;

      return {
        ...seriesById,
        seriesId: selectedSeriesId,
        traceId: createTraceId(),
      };
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
