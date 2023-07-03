import { resolveWork, resolveManifestation } from "../../utils/utils";
import { log } from "dbc-node-logger";

export function tuneLimit(limit) {
  return Math.floor(limit + Math.max(limit * 0.2, 10));
}

export const typeDef = `
type Recommendation {
  """
  The recommended work
  """
  work: Work! @complexity(value: 5)

  """
  The recommended manifestation
  """
  manifestation: Manifestation! @complexity(value: 3)

  """
  Info on how this recommendation was generated
  """
  reader: [String!]!
}
type RecommendationResponse {
  result: [Recommendation!]!
}
`;

export const resolvers = {
  Recommendation: {
    work(parent, args, context, info) {
      return resolveWork({ id: parent.work }, context);
    },
    manifestation(parent, args, context, info) {
      return resolveManifestation({ pid: parent.pid }, context);
    },
  },
  RecommendationResponse: {
    async result(parent, args, context, info) {
      let pid;
      if (parent.pid) {
        pid = parent.pid;
      } else if (parent.faust) {
        pid = await context.datasources
          .getLoader("faustToPid")
          .load({ faust: parent.faust, profile: context.profile });
        if (!pid) {
          return [];
        }
      } else if (parent.id) {
        pid = parent.id.replace("work-of:", "");
      }
      const recommendations = await context.datasources
        .getLoader("recommendations")
        .load({
          pid,
          limit: tuneLimit(parent.limit) || 10,
          profile: context.profile,
          branchId: parent.branchId,
        });

      if (recommendations?.response) {
        // TODO: (1) Den her, Morten? (virker ikke pt)
        // const manifestations = recommendations?.response?.map(
        //   (res) =>
        //     new Promise((resolve) =>
        //       resolve(
        //         context.datasources.getLoader("jedRecord").load({
        //           id: res?.pid, //keys.map((key) => key.id),
        //           profile: context.profile,
        //         })
        //       )
        //     )
        // );
        //
        // const morten = (await Promise.all(manifestations))
        //   .map((res) => res.pid)
        //   .filter((res) => res);
        // TODO slut

        // TODO: (2) Den her, Morten? (virker ikke pt)
        // const keys = recommendations?.response
        //   ?.filter((res) => res.work)
        //   ?.map((res) => {
        //     return {
        //       id: res.pid,
        //       profile: {
        //         agency: context?.profile?.agency,
        //         name: context?.profile?.name,
        //       },
        //     };
        //   });
        // const morten = await Promise.all([
        //   new Promise((resolve) => resolve(batchLoader(keys, context))),
        // ]);
        // const benson = await recommendations?.response?.filter(
        //   (res, index) => morten[index] !== null
        // );
        // TODO slut

        const awaitedPromiseWithResolveWork = await (async function () {
          const asyncFunctions = recommendations?.response?.map(
            (res) =>
              new Promise((resolve) =>
                resolve(resolveManifestation({ pid: res.pid }, context))
              )
          );
          const results = await Promise.all(asyncFunctions);

          return results.map((res, index) => (res ? 1 : 0));
        })();

        awaitedPromiseWithResolveWork.forEach((res, index) => {
          if (res === 0) {
            log.info(
              "Work/manifestation from recommendation object can't be fetched in jedRecord",
              {
                recommendationWorkId: recommendations?.response?.[index]?.work,
                recommendationPid: recommendations?.response?.[index]?.pid,
                profile: context?.profile,
              }
            );
          }
        });

        return recommendations?.response
          .filter((res, index) => awaitedPromiseWithResolveWork[index] === 1)
          .slice(0, parent.limit);
      }
      return [];
    },
  },
};
