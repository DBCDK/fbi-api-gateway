/**
 * @file Cover type definition and resolvers
 *
 * Resolves responses from moreinfo
 */

/**
 * The Cover type definition
 */
export const typeDef = `
type Cover {
  detail_117: String
  detail_207: String
  detail_42: String
  detail_500: String
  thumbnail: String
  detail: String
}`;

/**
 * Resolvers for the Cover type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Cover: {},
};
