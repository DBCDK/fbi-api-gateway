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

import { get } from "lodash";

export const typeDef = `
enum FacetFilterField {
      type,
      language,
      mattype,
      fictive_character,
      genre
   }
input FacetFilter {
      field: FacetFilterField!,
      value: [String!]!
    }
type SearchQuery {
  searchCode: String!,
  searchString: String!,
  value: String!
}`;

export const resolvers = {
  SearchQuery: {
    searchCode(parent) {
      return get(parent, "searchCode.$", "unknown");
    },
    searchString(parent) {
      return get(parent, "searchString.$", "unknown");
    },
    value(parent) {
      return get(parent, "value.$", "unknown");
    },
  },
};
