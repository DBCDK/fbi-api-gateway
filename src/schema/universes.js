import { resolveWork } from "../utils/utils";

export const typeDef = `
union UniverseContent = Work | Series

type Universe {
  """
  A key that identifies a universe.
  """
  key: String!

  """
  Literary/movie universe this work is part of e.g. Wizarding World, Marvel Cinematic Universe
  """
  title: String!

  """
  A alternative title to the main 'title' of the universe
  """
  alternativeTitles: [String!]!
  
  """
  Description of the universe
  """
  description: String
  
  """
  All series within the universe
  """
  series(limit: Int, offset: Int, workType: WorkType): [Series!]!
  
  """
  All works within the universe but not in any series
  """
  works(limit: Int, offset: Int, workType: WorkType): [Work!]! 

  """
  work types that are in this universe
  """
  workTypes: [WorkType!]!

  """
  both series and works in a list
  """
  content(limit: Int, offset: Int, workType: WorkType): UniverseContentResult!
}

type UniverseContentResult {
  hitcount: Int!
  entries: [UniverseContent!]!
}

extend type Query {
  universe(key: String!): Universe
}

`;

// These are hardcoded for now
const allowedLanguages = new Set([
  "dansk",
  "engelsk",
  "ukendt sprog",
  "flere sprog",
]);

/**
 * Filters and slices content list
 */
function parseUniverseList(args, content, context) {
  const limit = Boolean(args.limit) ? args.limit : 20;
  const offset = Boolean(args.offset) ? args.offset : 0;
  const workType = args.workType;

  let filtered = content
    ?.filter((entry) => {
      if (workType) {
        return workType === entry.workTypes?.[0]?.toUpperCase();
      }

      return true;
    })
    .filter((entry) => {
      // Check language is allowed
      const languages = entry.language
        ? [entry.language]
        : entry.mainLanguages?.map(({ display }) => display);

      if (!languages?.length) {
        // Unknown language, keep it
        return true;
      }
      return languages?.some((language) => allowedLanguages.has(language));
    });

  return {
    hitcount: filtered.length,
    entries: filtered?.slice(offset, offset + limit).map(async (entry) => {
      if (entry.seriesTitle) {
        return { ...entry, __typename: "Series" };
      }
      return {
        ...(await resolveWork({ id: entry.persistentWorkId }, context)),
        __typename: "Work",
      };
    }),
  };
}
export const resolvers = {
  Work: {
    // Use the new universe from series-service v2
    async universes(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return (
        data?.universes?.map((universe, index) => ({
          ...universe,
          // TODO, this key is replaced by key from service as soon as it is available
          key: Buffer.from(`${parent.workId}|${index}`, "utf8").toString(
            "base64url"
          ),
        })) || []
      );
    },
    // Use the new universe from series-service v2
    async universe(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return data?.universes?.[0] || null;
    },
  },
  Universe: {
    title(parent, args, context, info) {
      return parent.universeTitle;
    },
    description(parent, args, context, info) {
      return parent.universeDescription;
    },
    series(parent, args, context, info) {
      const seriesFromService = parent.content.filter((singleContent) =>
        singleContent.hasOwnProperty("seriesTitle")
      );

      return parseUniverseList(args, seriesFromService, context).entries;
    },
    works(parent, args, context, info) {
      const worksFromService = parent.content.filter((singleContent) =>
        singleContent.hasOwnProperty("persistentWorkId")
      );

      return parseUniverseList(args, worksFromService, context).entries;
    },
    content(parent, args, context, info) {
      return parseUniverseList(args, parent?.content, context);
    },
  },
  Manifestation: {
    // Use the new universe from series-service v2
    async universes(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return (
        data?.universes?.map((universe, index) => ({
          ...universe,
          // TODO, this key is replaced by key from service as soon as it is available
          key: Buffer.from(`${parent.workId}|${index}`, "utf8").toString(
            "base64url"
          ),
        })) || []
      );
    },
    // Use the new universe from series-service v2
    async universe(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return data?.universes?.[0] || null;
    },
  },
  Query: {
    async universe(parent, args, context, info) {
      // TODO, skip key parsing as soon as we can look up key directly from service
      const key = Buffer.from(args.key, "base64url").toString("utf8");
      const [workId, index] = key.split("|");

      const data = await context.datasources.getLoader("universes").load({
        workId: workId,
        profile: context.profile,
      });

      if (!data?.universes?.[index]) {
        return null;
      }

      return { ...data?.universes?.[index], key: args.key };
    },
  },
};
