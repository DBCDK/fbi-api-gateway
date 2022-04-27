export const typeDef = `
type Draft_DigitalArticleServiceResponse {
  msg: String!
}
extend type Mutation {
  """
  TODO
  """
  digitalArticleService (
    """
    Specify the preferred language. Fields that can be translated will be translated into this language.
    """
    pid: String!

  ): Draft_DigitalArticleServiceResponse!
}
`;

export const resolvers = {};
