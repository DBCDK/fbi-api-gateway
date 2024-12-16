import { resolveWork, resolveManifestation } from "../utils/utils";

/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
  type Category {
    title: String!
    result(limit: Int): [CategoryResult!]! @complexity(value: 5, multipliers: ["limit"])
  }

  type CategoryResult {
    work: Work! 
    manifestation: Manifestation! 
  }

  type Categories {
      title: String!
      type: CategoryFiltersEnum!
      subCategories: [Category!]! 
  }`;

export const resolvers = {
  Categories: {
    title(parent, args) {
      return parent.category;
    },
  },
  Category: {
    title(parent) {
      return parent.title;
    },
    async result(parent, args, context, info) {
      const limit = args.limit || 10;
      const result = await Promise.all(
        parent.result.slice(0, limit).map(async (entry) => {
          const work = await resolveWork(
            { id: entry.work, traceId: entry.traceId },
            context
          );
          const manifestation = resolveManifestation(
            { pid: entry.pid },
            context
          );
          return { work, manifestation };
        })
      );
      return result.filter(
        ({ work, manifestation }) => !!work && !!manifestation
      );
    },
  },
};
