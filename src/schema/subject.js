/**
 * @file Subject type definition and resolvers
 *
 */

/**
 * The Subject type definition
 */
export const typeDef = `
type Subject {
  type: String
  value: String!
}`;

/**
 * Resolvers for the Subject type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Subject: {}
};
