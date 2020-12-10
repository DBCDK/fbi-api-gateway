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
  input DataCollectExampleInput {
    example: String!
    session_id: String!
  }
  input DataCollectInput {
    search_work: DataCollectSearchWorkInput
    example: DataCollectExampleInput
  }
`;
