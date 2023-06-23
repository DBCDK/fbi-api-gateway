import translations from "../utils/translations.json";
import { resolveWork } from "../utils/utils";
import { log } from "dbc-node-logger";

/**
 * define a searchquery
 * basically a search query is a searchstring and some filters (facets)
 *
 * Facets are numerous - here we define the top-level facets in FacetFilterField(enum)
 * subfacets like "krimi" are defined as Strings
 *
 * @TODO should we have an enum for each subtype ?? - there is a lot
 *
 */

export const typeDef = `
"""
The supported fields to query
"""
input SearchQuery {

  """
  Search for title, creator, subject or a combination.
  This is typically used where a single search box is desired.
  """
  all: String

  """
  Search for creator
  """
  creator: String

  """
  Search for specific subject
  """
  subject: String

  """
  Search for specific title
  """
  title: String
}



"""
The supported facet fields
"""
enum FacetField {
  workTypes
  mainLanguages 
  materialTypes @deprecated(reason: "Use 'FacetField.materialTypesSpecific'")
  materialTypesGeneral
  materialTypesSpecific 
  fictionalCharacters
  genreAndForm
  childrenOrAdults
  accessTypes
  fictionNonfiction
  subjects
  creators
  canAlwaysBeLoaned
}

"""
Search Filters
"""
input SearchFilters {
  accessTypes: [String!] 
  childrenOrAdults: [String!]
  creators: [String!]
  fictionNonfiction: [String!]
  fictionalCharacters: [String!]
  genreAndForm: [String!]
  mainLanguages: [String!] 
  materialTypes: [String!] @deprecated(reason: "Use 'SearchFilters.materialTypesSpecific'")
  materialTypesGeneral: [String!]
  materialTypesSpecific: [String!]
  subjects: [String!]
  workTypes: [String!]

  branchId: [String!]
  department: [String!]
  location: [String!]
  sublocation: [String!]
  status: [HoldingsStatus!]
  canAlwaysBeLoaned: [String!]
}

enum HoldingsStatus {
  """
  Holding is physically available at the branch
  """
  OnShelf

  """
  Holding is on loan
  """
  OnLoan
}

"""
A facet value consists of a term and a count.
"""
type FacetValue {
  """
  Use the key when applying filters
  """
  key: String!

  """
  A value of a facet field
  """
  term: String!

  """
  A score indicating relevance
  """
  score: Int
}

"""
The result for a specific facet
"""
type FacetResult {
  """
  The name of the facet.
  """
  name: String!

  """
  The values of thie facet result
  """
  values(limit: Int!): [FacetValue!]! @complexity(value: 2, multipliers: ["limit"])
}

"""
The simple search response
"""
type SearchResponse {
  """
  Total number of works found. May be used for pagination.
  """
  hitcount: Int!

  """
  The works matching the given search query. Use offset and limit for pagination.
  """
  works(offset: Int! limit: PaginationLimit!): [Work!]! @complexity(value: 5, multipliers: ["limit"])
  
  """
  Make sure only to fetch this when needed
  This may take seconds to complete
  """
  facets(facets: [FacetField!]!): [FacetResult!]! @complexity(value: 5, multipliers: ["facets"])

  """
  Will return the facets that best match the input query and filters
  """
  intelligentFacets(limit: Int): [FacetResult!]! @complexity(value: 5, multipliers: ["limit"])

  """
  A list of alternative search queries
  """
  didYouMean(limit: Int ): [DidYouMean!]! @complexity(value: 2, multipliers: ["limit"])
}

type DidYouMean {
  """
  An alternative query
  """
  query: String!

  """
  A probability score between 0-1 indicating how relevant the query is
  """
  score: Float!
}
`;

export const resolvers = {
  FacetValue: {
    key(parent, args, context) {
      return parent.term;
    },
    term(parent, args, context) {
      // We only use danish translations for now
      return (
        translations.facets[parent.facetName]?.[parent.term]?.da || parent.term
      );
    },
    score(parent, args, context) {
      return parent?.score || parent?.count || 0;
    },
  },
  FacetResult: {
    values(parent, args, context) {
      return parent.values
        .slice(0, args.limit)
        .map((value) => ({ ...value, facetName: parent.name }));
    },
  },
  SearchResponse: {
    async intelligentFacets(parent, args, context) {
      const res = await context.datasources
        .getLoader("intelligentFacets")
        .load({
          ...parent,
          ...args,
          limit: 50,
          profile: context.profile,
        });

      return (
        (Array.isArray(res?.facets) &&
          res?.facets?.slice(0, args.limit || 10)) ||
        []
      );
    },
    async didYouMean(parent, args, context) {
      const res = await context.datasources.getLoader("didYouMean").load({
        ...parent,
        ...args,
        profile: context.profile,
      });

      return res?.map(({ query, score }) => ({ query, score }));
    },
    async hitcount(parent, args, context) {
      const res = await context.datasources.getLoader("simplesearch").load({
        ...parent,
        profile: context.profile,
      });

      return res.hitcount;
    },
    async works(parent, args, context) {
      const res = await context.datasources.getLoader("simplesearch").load({
        ...parent,
        ...args,
        profile: context.profile,
      });

      const expanded = await Promise.all(
        res.result.map(async ({ workid }) => {
          const work = await resolveWork({ id: workid }, context);
          if (!work) {
            // log for debugging - see BIBDK2021-1256
            log.error("WORKID NOT FOUND in jed-presentation service", {
              workId: workid,
            });
          }
          return work;
        })
      );

      return expanded.filter((work) => !!work);
    },
    async facets(parent, args, context) {
      const res = await context.datasources.getLoader("facets").load({
        ...parent,
        ...args,
        profile: context.profile,
      });

      const response = [];

      args.facets.forEach((key) => {
        const values = parent?.filters?.[key] || [];
        const facet = res.find((obj) => obj.name === key);
        const copy = { name: key, ...facet, values: [] };
        values.forEach((value) => {
          // get selected term props
          const selected = facet?.values.find((obj) => obj.term === value);
          // Push to copy values
          // If the selected value is missing a count (because it does not exist in the return data (res)) count will be set to null
          copy.values.push({ term: value, count: selected?.count || null });
        });

        // Remove values from res that has already been added in copy.values
        const trimmed =
          facet?.values?.filter((v) => !values.includes(v.term)) || [];

        // sort the selected terms
        copy.values.sort((a, b) => {
          return (
            // sort null values first
            -(!a.count - !b.count) ||
            // sort by count DESC
            -(a.count > b.count) ||
            +(a.count < b.count)
          );
        });

        // Merge selected + new terms (selected will come first in the sorted order (null's first, then by count DESC))
        copy.values = [...copy.values, ...trimmed];

        response.push(copy);
      });

      return response;
    },
  },
};
