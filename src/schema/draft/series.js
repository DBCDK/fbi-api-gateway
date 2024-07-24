import { resolveSeries, resolveWork } from "../../utils/utils";

export const typeDef = `
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
  Additional information 
  """
  identifyingAddition: String
  
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
  numberInSeries: NumberInSeries @deprecated(reason: "field 'NumberInSeries.number' is removed and only String value of 'NumberInSeries.display' is returned")

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
  WorkTypes for the series
  """
  workTypes: [String!]!
  
  """
  MainLanguages of the series
  """
  mainLanguages: [String!]!
  
  """
  Members of this serie. 
  """
  members(limit: Int, offset: Int): [SerieWork!]! 
}
`;

export const resolvers = {
  Work: {
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
    async members(parent, args, context, info) {
      const limit = Boolean(args.limit) ? args.limit : 50;
      const offset = Boolean(args.offset) ? args.offset : 0;

      const works = parent.works.slice(offset, offset + limit);

      // filter out persistentWorkIds that can NOT be resolved - we need to await a resolve to know :)
      const results = await Promise.all(
        works.map((work) => resolveWork({ id: work.persistentWorkId }, context))
      );
      return works.filter((_v, index) => results[index] !== null);
    },
    title(parent, args, context, info) {
      return parent.seriesTitle;
    },
    description(parent, args, context, info) {
      return parent.seriesDescription;
    },
    isPopular(parent, args, context, info) {
      return parent.type === "isPopular";
    },
    numberInSeries(parent, args, context, info) {
      if (!parent.numberInSeries) {
        return null;
      }

      const display = parent.numberInSeries;
      const match = parent.numberInSeries.match(/\d+/g);

      return {
        display,
        number: match?.map((str) => parseInt(str, 10)),
      };
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
    workTypes(parent, args, context, info) {
      return parent.workTypes.map((workType) => workType.toUpperCase());
    },
    mainLanguages(parent, args, context, info) {
      if (parent.languages && Array.isArray(parent.languages)) {
        return parent.languages;
      } else if (parent.language && Array.isArray(parent.language)) {
        return parent.language;
      } else if (parent.language && typeof parent.language === "string") {
        return [parent.language];
      } else {
        return [];
      }
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
