export const typeDef = `
type Draft_Recommendation {
  """
  The recommended work
  """
  work: Draft_Work!

  """
  The recommended manifestation
  """
  manifestation: Draft_Manifestation!
}
type Draft_RecommendationResponse {
  result: [Draft_Recommendation!]!
}
`;

export const resolvers = {};
