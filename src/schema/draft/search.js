export const typeDef = `
type Draft_FacetTerm {
  term: String!
  count: Int!
  facetCategory: String!
  popular: Boolean!
}
type Draft_FacetResponse {
  categories: [Draft_Facet!]!
  popular: [Draft_FacetTerm!]!
}
type Draft_Facet {
  facetCategory: String!
  values: [Draft_FacetTerm!]!
}
type Draft_SearchResponse {
  facets: Draft_FacetResponse
}
`;

export const resolvers = {};
