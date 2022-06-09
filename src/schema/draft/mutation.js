export const typeDef = `
type DigitalArticleServiceResponse {
  msg: String!
}
extend type Mutation {

  """
  Order digital article through Digital Article Service
  Link to article is sent via email
  """
  digitalArticleService (
    """
    The pid of an article or periodica
    """
    pid: String!
    publicationDateOfComponent: String
    volume: String
    authorOfComponent: String
    titleOfComponent: String
    pagination: String

  ): DigitalArticleServiceResponse!
}
`;

export const resolvers = {};
