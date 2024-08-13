import { resolveSeries, resolveWork } from "../../utils/utils";

export const typeDef = `
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
  Identifier for the series
  """
  seriesId: String

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
  The number in the series as text qoutation
  """
  numberInSeries: String

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

extend type Query {
   series(seriesId:String!): Series
}
`;
// extend type Query {
//   series(seriesId:String!): Series
// }
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
      return parent.numberInSeries;
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
  Query: {
    async series(parent, args, context, info) {
      console.log("\n\n\n\n\n SERIES ID!! ", args.seriesId, "\n\n\n\n\n");
      const seriesById = await context.datasources
        .getLoader("seriesById")
        .load({ seriesId: args.seriesId, profile: context.profile });
     return {...seriesById, seriesId: args.seriesId};
    },

  },
};
