import { get } from "lodash";

export const typeDef = `
type SearchQuery {
  searchCode: String!
  searchString: String!
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
