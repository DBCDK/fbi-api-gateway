/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
 type Inspiration {
   categories: Categories!
 }`;

export const resolvers = {
  Inspiration: {
    async categories(parent, args, context, info) {
      return await context.datasources
        .getLoader("catInspire")
        .load("all-categories");
    },
  },
};
