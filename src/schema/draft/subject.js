export const typeDef = `
interface Draft_Subject {
  display: String!
}
type Draft_SubjectText implements Draft_Subject {
  type: Draft_SubjectType!
  display: String!
}
type Draft_TimePeriod implements Draft_Subject {
  period: Draft_Range! 
  display: String!
}
enum Draft_SubjectType {
  TOPIC
  LOCATION
  FICTIONAL_CHARACTER
  MUSIC_COUNTRY_OF_ORIGIN
  MUSIC_TIME_PERIOD
  MUSICAL_INSTRUMENTATION
  TIME_PERIOD
  FILM_NATIONALITY
  LIBRARY_OF_CONGRESS_SUBJECT_HEADING
}
type Draft_Range {
  begin: Int
  end: Int
  display: String!
}

type Draft_SubjectContainer {
  """
  All subjects
  """
  all: [Draft_Subject!]!

  """
  Only DBC verified subjects
  """
  dbcVerified: [Draft_Subject!]!
}
`;

export const resolvers = {};
