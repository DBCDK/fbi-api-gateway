import { createTraceId } from "../utils/trace";
import { resolveWork } from "../utils/utils";

export const typeDef = `
union UniverseContentUnion = Work | Series

type Universe {
  """
  A key that identifies a universe.
  """
  key: String

  """
  An id that identifies a universe.
  """
  universeId: String

  """
  A unique identifier for tracking user interactions with this universe.
  It is generated in the response and should be included in subsequent
  API calls when this work is selected.
  """
  traceId: String!

  """
  Literary/movie universe this work is part of e.g. Wizarding World, Marvel Cinematic Universe
  """
  title: String!

  """
  A alternative title to the main 'title' of the universe
  """
  alternativeTitles: [String!]
  
  """
  Description of the universe
  """
  description: String
  
  """
  All series within the universe
  """
  series(limit: Int, offset: Int, workType: WorkTypeEnum): [Series!]!
  
  """
  All works within the universe but not in any series
  """
  works(limit: Int, offset: Int, workType: WorkTypeEnum): [Work!]! 

  """
  work types that are in this universe
  """
  workTypes: [WorkTypeEnum!]!

  """
  both series and works in a list
  """
  content(limit: Int, offset: Int, workType: WorkTypeEnum): UniverseContentResult!
}

type UniverseContentResult {
  hitcount: Int!
  entries: [UniverseContentUnion!]!
}

extend type Query {
  universe(key: String, universeId:String): Universe

}

`;

/**
 * will create and send universe event
 */
function createUniverseEvent({ context, entries, parent }) {
  const identifiers = entries
    ?.map((entry) => ({
      traceId: entry.traceId,
      identifier: entry.workId || entry.seriesId,
    }))
    .filter((entry) => !!entry);

  context?.dataHub?.createUniverseEvent({
    input: {
      identifiers,
      universeId: parent?.universeId,
    },
  });
}

/**
 * Filters and slices content list
 */
async function parseUniverseList({ args, content, context, parent }) {
  const limit = Boolean(args.limit) ? args.limit : 20;
  const offset = Boolean(args.offset) ? args.offset : 0;
  const workType = args.workType;

  let filtered = content?.filter((entry) => {
    if (workType) {
      return workType === entry.workTypes?.[0]?.toUpperCase();
    }

    return true;
  });

  //Universe can have both series and works. We fetch work data for works and return series as it is.
  const entries = await Promise.all(
    filtered?.slice(offset, offset + limit).map(async (entry) => {
      if (entry.seriesTitle) {
        return { ...entry, __typename: "Series", traceId: createTraceId() };
      }
      return {
        ...(await resolveWork({ id: entry.persistentWorkId }, context)),
        __typename: "Work",
      };
    })
  );

  //send universe event
  createUniverseEvent({ context, entries, parent });

  //return the result
  return {
    hitcount: filtered.length,
    entries: entries,
  };
}
export const resolvers = {
  Work: {
    // Use the new universe from series-service v2
    async universes(parent, args, context, info) {
      const { universes } = await context.datasources
        .getLoader("identifyWork")
        .load({
          workId: parent.workId,
          profile: context.profile,
        });
      if (!universes) {
        return [];
      }
      const fetchedUniverses = await Promise.all(
        universes?.map(async (universe, index) => {
          const universeId = universe.identity?.id;
          //fetch from universes
          const universeById = await context.datasources
            .getLoader("universeById")
            .load({ universeId: universeId, profile: context.profile });

          const result = {
            ...universeById,
            universeId: universeId,
            key: Buffer.from(`${parent.workId}|${index}`, "utf8").toString(
              "base64url"
            ),
            traceId: createTraceId(),
          };

          // return the fetched universe
          return result;
        })
      );

      return fetchedUniverses;
    },
  },
  Universe: {
    title(parent, args, context, info) {
      return parent.universeTitle;
    },
    description(parent, args, context, info) {
      return parent.universeDescription;
    },
    async series(parent, args, context, info) {
      const seriesFromService = parent.content.filter((singleContent) =>
        singleContent.hasOwnProperty("seriesTitle")
      );
      const result = await parseUniverseList({
        args,
        content: seriesFromService,
        context,
        parent,
      });
      return result.entries;
    },
    async works(parent, args, context, info) {
      const worksFromService = parent.content.filter((singleContent) =>
        singleContent.hasOwnProperty("persistentWorkId")
      );
      const result = await parseUniverseList({
        args,
        content: worksFromService,
        context,
        parent,
      });
      return result.entries;
    },
    async content(parent, args, context, info) {
      return await parseUniverseList({
        args,
        content: parent?.content,
        context,
        parent,
      });
    },
  },
  Manifestation: {
    async universes(parent, args, context, info) {
      const { universes } = await context.datasources
        .getLoader("identifyWork")
        .load({
          workId: parent.workId,
          profile: context.profile,
        });
      if (!universes) {
        return [];
      }
      const fetchedUniverses = await Promise.all(
        universes?.map(async (universe, index) => {
          const universeId = universe.identity?.id;
          //fetch from universes
          const universeById = await context.datasources
            .getLoader("universeById")
            .load({ universeId: universeId, profile: context.profile });

          // return the fetched universe
          const result = {
            ...universeById,
            universeId: universeId,
            key: Buffer.from(`${parent.workId}|${index}`, "utf8").toString(
              "base64url"
            ),
            traceId: createTraceId(),
          };

          return result;
        })
      );

      return fetchedUniverses;
    },
  },
  Query: {
    async universe(parent, args, context, info) {
      if (args.key) {
        //TODO: remove this after temp branch rull out
        // TODO, skip key parsing as soon as we can look up key directly from service
        const key = Buffer.from(args.key, "base64url").toString("utf8");

        const [workId, index] = key.split("|");

        const data = await context.datasources.getLoader("universes").load({
          workId: workId,
          profile: context.profile,
        });

        return { ...data?.universes?.[index], key: args.key };
      } else if (args.universeId) {
        const universeById = await context.datasources
          .getLoader("universeById")
          .load({ universeId: args.universeId, profile: context.profile });
        return {
          ...universeById,
          universeId: args.universeId,
          traceId: createTraceId(),
        };
      } else {
        return null;
      }
    },
  },
};
