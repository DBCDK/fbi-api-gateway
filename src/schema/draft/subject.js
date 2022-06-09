export const typeDef = `
interface Subject {
  display: String!
}
type SubjectText implements Subject {
  type: SubjectType!
  display: String!
}
type TimePeriod implements Subject {
  period: Range! 
  display: String!
}
enum SubjectType {
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
type Range {
  begin: Int
  end: Int
  display: String!
}

type SubjectContainer {
  """
  All subjects
  """
  all: [Subject!]!

  """
  Only DBC verified subjects
  """
  dbcVerified: [Subject!]!
}
`;

export const resolvers = {};
