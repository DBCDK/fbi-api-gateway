/**
 * Type definitions for data collection input types
 * GraphQL does not support union input types
 * so we make optional field per input type we want to support
 */
export const typeDef = `
  input DataCollectSearchWorkInput {
    search_query: String!
    search_query_hit: Int!
    search_query_work: String!
    session_id: String!
  }
  input DataCollectSearchInput {
    search_query: String!
    session_id: String!
  }
  input DataCollectExampleInput {
    example: String!
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
  input DataCollectInput {
    search: DataCollectSearchInput
    search_work: DataCollectSearchWorkInput
    suggest_presented: DataCollectSuggestPresentedInput
    suggest_click: DataCollectSuggestClickInput
    example: DataCollectExampleInput
  }
`;
