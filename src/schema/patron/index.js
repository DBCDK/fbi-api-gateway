/**
 * @file This file handles "patron" requests.
 *
 */

export const typeDef = `
    extend type Query {
      """
      Retrieves information about the patron, such as bookmarks, reservations, and loans.
      """
      patron: Patron 
    }

    type Patron

    extend type Mutation {
      """
      Updates patron information, such as adding or removing bookmarks.
      """
      patron: PatronMutation
    }

    type PatronMutation
 `;

export const resolvers = {
  Query: {
    async patron(parent, args, context) {
      return {};
    },
  },
  Mutation: {
    async patron(parent, args, context) {
      return {};
    },
  },
};
