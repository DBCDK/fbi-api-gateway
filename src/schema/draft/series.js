import { resolveWork } from "../../utils/utils";

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
type Series {
  """
  The title of the series
  """
  title: String!

  """
  A alternative title to the main 'title' of the series
  """
  alternativeTitles: [String!]!

  """
  A parallel title to the main 'title' of the series, in a different language
  """
  parallelTitles: [String!]!

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
  Whether this is a popular series or general series
  """
  isPopular: Boolean
}
`;

export const resolvers = {
  Work: {
    async seriesMembers(parent, args, context, info) {
      const data = await context.datasources.series.load({
        workId: parent.workId,
        profile: context.profile,
      });

      if (data && data.series) {
        const works = await Promise.all(
          data.series.slice(0, 100).map(async (id) => {
            return resolveWork({ id }, context);
          })
        );

        return works.filter((work) => !!work);
      }

      return [];
    },
  },
};
