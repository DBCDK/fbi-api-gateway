import { resolveWork } from "../utils/utils";

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
  
  """
  Description of the universe
  """
  description: String
  
  """
  All series within the universe
  """
  series: [Series!]!
  
  """
  All works within the universe but not in any series
  """
  works: [Work!]! 
}`;

export const resolvers = {
  Work: {
    // Use the new universe from series-service v2
    async universes(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return data?.universes;
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
      return parent.content.filter((singleContent) =>
        singleContent.hasOwnProperty("seriesTitle")
      );
    },
    works(parent, args, context, info) {
      return parent.content
        .filter((singleContent) =>
          singleContent.hasOwnProperty("persistentWorkId")
        )
        .map((work) => resolveWork({ id: work.persistentWorkId }, context));
    },
  },
  Manifestation: {
    // Use the new universe from series-service v2
    async universes(parent, args, context, info) {
      const data = await context.datasources.getLoader("universes").load({
        workId: parent.workId,
        profile: context.profile,
      });

      return data?.universes;
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
};
