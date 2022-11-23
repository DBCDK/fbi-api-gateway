import { resolveWork, resolveManifestation } from "../utils/utils";

/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
  type Category {
    title: String!
    result(limit: Int): [CategoryResult!]!
  }

  type CategoryResult {
    work: Work!
    manifestation: Manifestation!
  }

  type Categories {
      category: String!
      subCategories: [Category!]!
  }`;

export const resolvers = {
  Categories: {
    category(parent, args) {
      return parent.category;
    },
    subCategories(parent, args) {
      return parent.subCategories;
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
          const work = await resolveWork({ id: entry.work }, context);
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
