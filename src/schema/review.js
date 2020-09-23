/**
 * @file Review type definition and resolvers
 *
 */

/**
 * The Review type definition
 */
export const typeDef = `
enum ReviewType {
  INFOMEDIA
  LITTERATURSIDEN
  MATERIALREVIEWS
}
type Review {
  author: String!
  media: String!
  rating: String!
  reviewType: ReviewType!
  url: String!
}`;

/**
 * Resolvers for the Review type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Review: {}
};
