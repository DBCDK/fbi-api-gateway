import { resolveWork } from "../utils/utils";

export const typeDef = `
"""
Search Filters
"""
input ComplexSearchFilters {
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
  status: [HoldingsStatus!]
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
}



enum SortOrder {
  ASC
  DESC 
}

input Sort {
  index: String!
  order: SortOrder!
}

"""
The supported facet fields
"""
enum ComplexSearchFacets {  
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
  
}

"""
The facets to ask for
"""
input complexSearchFacets {
  facetLimit: Int!
  facets: [ComplexSearchFacets!]!
}

"""
A Facet value in response
"""
type ComplexSearchFacetValue{
  key: String!
  score: Int!
}

"""
The complete facet in response
"""
type ComplexSearchFacetResponse{
  name: String
  values: [ComplexSearchFacetValue!]
}

type ComplexFacetResponse {
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
  works(offset: Int! limit: PaginationLimit!, sort: [Sort!]): [Work!]! @complexity(value: 5, multipliers: ["limit"])

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

export const resolvers = {
  ComplexFacetResponse: {
    async facets(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexFacets")
        .load(setPost(parent, context, args));
      return res?.facets;
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

      return res?.facets;
    },
    async works(parent, args, context) {
      const res = await context.datasources
        .getLoader("complexsearch")
        .load(setPost(parent, context, args));
      const expanded = await Promise.all(
        res?.works?.map(async (id) => resolveWork({ id }, context))
      );

      return expanded.filter((work) => !!work);
    },
  },
};
