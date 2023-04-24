import { resolveWork } from "../../utils/utils";

export const typeDef = `
type SerieWork {
  """
  The number in the series as a number (as text)
  """
  numberInSeries: String
  
  """
  Works of a serieWork
  """
  work: Work!
  
  """
  Information about whether this work in the series should be read first
  """
  readThisFirst: Boolean
  
  """
  Information about whether this work in the series can be read without considering the order of the series, it can be read at any time
  """
  readThisWhenever: Boolean
  
}

type SeriesAndWorks {
  """
  The title of the series
  """
  seriesTitle: String!

  """
  The description of the series
  """
  seriesDescription: String

  """
  A alternative title to the main 'title' of the series
  """
  alternativeTitles: [String!]!
  
  """
  A parallel title to the main 'title' of the series, in a different language
  """
  parallelTitles: [String!]!
  
  """
  Works in this serie
  """
  serieWorks: [SerieWork!]!

    """
  Whether this is a popular series or general series
  """
  isPopular: Boolean
}
`;

export const resolvers = {
  Work: {
    async seriesAndWorks(parent, args, context, info) {
      const data = await context.datasources.getLoader("series").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return data?.series || [];
    },
  },
  SeriesAndWorks: {
    seriesDescription(parent, args, context, info) {
      return parent.seriesDescription;
    },
    serieWorks(parent, args, context, info) {
      return parent.works;
    },
  },
  SerieWork: {
    async work(parent, args, context, info) {
      return resolveWork({ id: parent.persistentWorkId }, context);
    },
  },
};
