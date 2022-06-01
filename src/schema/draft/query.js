import * as consts from './FAKE';

export const typeDef = `
type Draft_Query {
  work(id: String, faust: String, pid: String): Draft_Work
  works(id: [String!], faust: [String!], pid: [String!]): [Draft_Work]!
  manifestation(faust: String, pid: String): Draft_Manifestation
  manifestations(faust: [String!], pid: [String!]): [Draft_Manifestation]!
  suggest(
    """
    The query to get suggestions from
    """
    q: String!

    """
    work type to include in the result
    Note: Is only supported in the bibdk suggester
    """
    workType: WorkType

    """
    suggest type to include in result
    """
    suggestType: Draft_SuggestionType
  ): Draft_SuggestResponse!

  """
  Get recommendations based on a pid
  """
  recommend(pid: String!): Draft_RecommendationResponse!

  """
  Search
  """
  search(q: SearchQuery!): Draft_SearchResponse!
}
extend type Query {
  draft: Draft_Query!
}
`;



export const resolvers = {
  Query: {
    draft() {
      return {};
    },
  },
  Draft_Query: {
    work(parent, args, context) {
      return FAKE_WORK;
    },
    works(parent, args, context) {
      const count =
          args?.id?.length || args?.faust?.length || args?.pid?.length || 0;
      return Array(count).fill(0).map(() => FAKE_WORK);
    },
    manifestation() {
      return FAKE_MANIFESTATION_1;
    },
    manifestations(parent, args, context) {
      const count =
          args?.id?.length || args?.faust?.length || args?.pid?.length || 0;
      return Array(count).fill(0).map(() => FAKE_MANIFESTATION_1);
    },
    suggest() {
      return FAKE_SUGGEST_RESPONSE;
    },
    recommend() {
      return FAKE_RECOMMEND_RESPONSE;
    },
    search() {
      return {
        facets: {
          categories: [
            {
              facetCategory: "materialType",
              values: [
                {
                  term: "Ebog",
                  count: 8,
                  facetName: "materialType",
                  popular: true,
                },
                {
                  term: "Fysisk",
                  count: 18,
                  facetName: "materialType",
                  popular: false,
                },
              ],
            },
            {
              facetCategory: "subjects",
              values: [
                {
                  term: "Fantasy",
                  count: 8,
                  facetName: "subjects",
                  popular: true,
                },
                {
                  term: "Heste",
                  count: 2,
                  facetName: "subjects",
                  popular: false,
                },
              ],
            },
          ],
          popular: [
            {
              term: "Ebog",
              count: 8,
              facetCategory: "materialType",
              popular: true,
            },
            {
              term: "Fantasy",
              count: 82,
              facetCategory: "subjects",
              popular: true,
            },
          ],
        },
      };
    },
  },
};
