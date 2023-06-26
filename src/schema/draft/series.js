import { resolveSeries, resolveWork } from "../../utils/utils";

export const typeDef = `
type Universe {
  """
  Literary/movie universe this work is part of e.g. Wizarding World, Marvel Cinematic Universe
  """
  title: String!

  """
  A alternative title to the main 'title' of the universe
  """
  alternativeTitles: [String!]!
}
type NumberInSeries {
  """
  The number in the series as text, quoted form the publication, e.g. 'Vol. IX'
  """
  display: String!

  """
  The number in the series as integer
  """
  number: [Int!]
}

type SerieWork {
  """
  The number of work in the series as a number (as text)
  """
  numberInSeries: String
  
  """
  Work of a serieWork
  """
  work: Work! @complexity(value: 5)
  
  """
  Information about whether this work in the series should be read first
  """
  readThisFirst: Boolean
  
  """
  Information about whether this work in the series can be read without considering the order of the series, it can be read at any time
  """
  readThisWhenever: Boolean  
}

type Series {
  """
  The title of the series
  """
  title: String!
  
  """
  Description of the series
  """
  description: String

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
  
  """
  Members of this serie. 
  """
  members:[SerieWork!]! 
}
`;

export const resolvers = {
  Work: {
    // for backward compatibility -> serieservice v1 -> remove when deprecated
    async seriesMembers(parent, args, context, info) {
      const data = await context.datasources.getLoader("series").load({
        workId: parent.workId,
        profile: context.profile,
      });

      // grab persistentWorkId from the first serie found on serieservice v2
      if (data && data.series && data.series?.[0].works) {
        const works = await Promise.all(
          data.series?.[0]?.works?.slice(0, 100).map(async (work) => {
            return resolveWork({ id: work.persistentWorkId }, context);
          })
        );
        return works;
      }

      return [];
    },

    // Use the new serie service v2
    async series(parent, args, context, info) {
      const data = await context.datasources.getLoader("series").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return resolveSeries(data, parent);
    },
  },

  // We need to resolve for backward compatibility
  Series: {
    members(parent, args, context, info) {
      return parent.works;
    },
    title(parent, args, context, info) {
      return parent.seriesTitle;
    },
    description(parent, args, context, info) {
      return parent.seriesDescription;
    },
    numberInSeries(parent, args, context, info) {
      return parent.numberInSeries || null;
    },
    readThisFirst(parent, args, context, info) {
      if (typeof parent.readThisFirst === "undefined") {
        return null;
      }
      return parent.readThisFirst;
    },
    readThisWhenever(parent, args, context, info) {
      if (typeof parent.readThisWhenever === "undefined") {
        return null;
      }
      return parent.readThisWhenever;
    },
  },
  SerieWork: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.persistentWorkId }, context);
    },
  },
  Manifestation: {
    async series(parent, args, context, info) {
      const data = await context.datasources.getLoader("series").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return resolveSeries(data, parent);
    },
  },
};
