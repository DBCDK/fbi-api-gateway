/**
 * Type definitions for data collection input types
 * GraphQL does not support union input types
 * so we make optional field per input type we want to support
 */
export const typeDef = `
  input DataCollectSearchRequestInput {
    q: SearchQueryInput!
    filters: SearchFiltersInput
  }
  input DataCollectSearchWorkInput {
    search_query_hit: Int!
    search_query_work: String!
    search_request: DataCollectSearchRequestInput!
    session_id: String!
  }
  input DataCollectSearchInput {
    search_request: DataCollectSearchRequestInput!
    search_response_works: [String!]!
    search_offset: Int!
    session_id: String!
  }
  input DataCollectExampleInput {
    example: String!
    session_id: String!
  }
  
  input DataCollectRecommenderClickInput {
    recommender_based_on: String!
    recommender_click_hit: Int!
    recommender_click_work: String!
    recommender_click_reader: String!
    recommender_shown_recommendations: [String!]!
    session_id: String!
  }
  input DataCollectSuggestionInput {
    type: String!
    value: String!
  }
  input DataCollectSuggestClickInput {
    suggest_query: String!
    suggest_query_hit: Int!
    suggest_query_request_types: [String!]!
    suggest_query_result: DataCollectSuggestionInput!
    session_id: String!
  }
  input DataCollectSuggestPresentedInput {
    suggest_query: String!
    suggest_query_request_types: [String!]!
    suggest_query_results: [DataCollectSuggestionInput!]!
    session_id: String!
  }

  enum FeedbackThumb {
    UP
    DOWN
  }

  input DataCollectSearchFeedbackInput {
    thumbs: FeedbackThumb!
    query: String!
    reason: String!
  }


  input DataCollectInput {
    recommender_click: DataCollectRecommenderClickInput
    search: DataCollectSearchInput
    search_work: DataCollectSearchWorkInput
    suggest_presented: DataCollectSuggestPresentedInput
    suggest_click: DataCollectSuggestClickInput
    search_feedback: DataCollectSearchFeedbackInput
    example: DataCollectExampleInput
  }
`;
