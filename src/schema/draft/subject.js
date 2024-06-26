export const typeDef = `
interface Subject {
  display: String!

  """
  The type of subject - 'location', 'time period' etc., 'topic' if not specific kind of subject term
  """
  type: SubjectType!

  """
  Language of the subject - contains display and isoCode 
  """
  language: Language

  local: Boolean
}

type SubjectText implements Subject {
  type: SubjectType!
  display: String!
  language: Language
  local: Boolean
}

type TimePeriod implements Subject {
  type: SubjectType!
  period: Range!
  display: String!
  language: Language
  local: Boolean
}

type Mood implements Subject {
  type: SubjectType!
  display: String!
  language: Language
  local: Boolean
}

type NarrativeTechnique implements Subject {
  type: SubjectType!
  display: String!
  language: Language
  local: Boolean
}

type Setting implements Subject {
  type: SubjectType!
  display: String!
  language: Language
  local: Boolean
}

type SubjectWithRating implements Subject {
  type: SubjectType!
  display: String!
  language: Language
  local: Boolean

  """
  Expressed as integer on a scale from 1 to 5
  """
  rating: Int
}

enum SubjectType {
  TOPIC @fallback
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
  FICTIONAL_LOCATION

  """
  added for manifestation.parts.creators/person - they get a type from small-rye
  """
  PERSON
  CORPORATION 

  MOOD
  MOOD_CHILDREN

  """
  Subject describing selected topics for children, and a rating.
  """
  TOPIC_CHILDREN

  PERSPECTIVE
  STYLE
  TEMPO
  REALITY
  ENVIRONMENT
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
