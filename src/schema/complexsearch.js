import { trace } from "superagent";
import { resolveWork } from "../utils/utils";
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
      const expanded = await Promise.all(
        res?.works?.map(async (id) => resolveWork({ id }, context))
      );

      const input = {
        ...parent,
        ...args,
        profile: context.profile,
      };
      const works = expanded.filter((work) => !!work);
      context?.dataHub?.createComplexSearchEvent({
        input: input,
        result: { works },
      });

      return works;
    },
  },
};
