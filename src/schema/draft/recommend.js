import { resolveWork, resolveManifestation } from "../../utils/utils";

export const typeDef = `
type Draft_Recommendation {
  """
  The recommended work
  """
  work: Draft_Work!

  """
  The recommended manifestation
  """
  manifestation: Manifestation!

  """
  Info on how this recommendation was generated
  """
  reader: [String!]!
}
type Draft_RecommendationResponse {
  result: [Draft_Recommendation!]!
}
`;

export const resolvers = {
  Draft_Recommendation: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
    manifestation(parent, args, context, info) {
      return resolveManifestation({ pid: parent.pid }, context);
    },
  },
  Draft_RecommendationResponse: {
    async result(parent, args, context, info) {
      let pid;
      if (parent.pid) {
        pid = parent.pid;
      } else if (parent.faust) {
        pid = (await context.datasources.faust.load(parent.faust)).pid;
      } else if (parent.id) {
        pid = parent.id.replace("work-of:", "");
      }
      const recommendations = await context.datasources.recommendations.load({
        pid,
        limit: parent.limit || 10,
        profile: context.profile,
      });
      if (recommendations?.response) {
        return recommendations.response;
      }
      return [];
    },
  },
};
