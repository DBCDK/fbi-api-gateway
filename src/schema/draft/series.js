export const typeDef = `
type Universe {
  """
  Literary/movie universe this work is part of e.g. Wizarding World, Marvel Universe
  """
  title: String!
}
type NumberInSeries {
  """
  The number in the series as text, quoted form the publication, e.g. 'Vol. IX'
  """
  display: String!

  """
  The number in the series as integer
  """
  number: Int!
}
type GeneralSeries {
  """
  The title of the series
  """
  title: String!

  """
  A parallel title to the main 'title' of the series, in a different language
  """
  parallelTitles: [String!]!

  """
  The number in the series as text quotation and a number
  """
  numberInSeries: NumberInSeries

  """
  Works in the series
  """
  works: [Work!]!
}
type PopularSeries {
  """
  The title of the series
  """
  title: String!

  """
  A alternative title to the main 'title' of the series
  """
  alternativeTitles: [String!]!

  """
  The number in the series as text qoutation and a number
  """
  numberInSeries: NumberInSeries

  """
  Information about whether this work in the series should be read first
  """
  readThisFirst: Boolean

  """
  Information about whether this work in the series can be read without considering the order of the series, it can be read at any time
  """
  readThisWhenever: Boolean

  """
  Works in the series
  """
  works: [Work!]!
}
type SeriesContainer {
  all: [GeneralSeries!]!
  popular: [PopularSeries!]!
}
`;

export const resolvers = {};
