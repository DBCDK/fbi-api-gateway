export const typeDef = `
interface Subject {
  display: String!

  """
  The type of subject - 'location', 'time period' etc., 'topic' if not specific kind of subject term
  """
  type: SubjectType!
}
type SubjectText implements Subject {
  type: SubjectType!
  display: String!
}
type TimePeriod implements Subject {
  type: SubjectType!
  period: Range! 
  display: String!
}
enum SubjectType {
  TOPIC
  LOCATION
  FICTIONAL_CHARACTER
  LAESEKOMPASSET
  MEDICAL_SUBJECT_HEADING
  MUSIC_COUNTRY_OF_ORIGIN
  MUSIC_TIME_PERIOD
  MUSICAL_INSTRUMENTATION
  NATIONAL_AGRICULTURAL_LIBRARY
  TIME_PERIOD
  TITLE
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
