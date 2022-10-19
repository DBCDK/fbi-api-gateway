/**
 * @file CatInspire type definition and resolvers
 *
 */

export const typeDef = `
 type Category {
   catTitle: String!
   works: [Work!]!
 }`;

export const resolvers = {
  Category: {},
};
