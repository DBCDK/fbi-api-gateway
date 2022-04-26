export const typeDef = `
enum Draft_SuggestionType {
  subject
  title
  creator
}
type Draft_Suggestion {
  """
  The type of suggestion: creator, subject or title
  """
  type: Draft_SuggestionType!

  """
  The suggested term which can be searched for
  """
  term: String!

  """
  A work related to the term
  """
  work: Draft_Work!
}
type Draft_SuggestResponse {
  result: [Draft_Suggestion!]!
}
`;

export const resolvers = {};
