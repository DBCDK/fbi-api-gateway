/**
 * @file This file handles "patron" requests.
 *
 */

export const typeDef = `
    extend type Query {
        """
        Retrieves information about the patron, such as bookmarks, holds, and loans.
        """
        patron: Patron
    }

    type Patron
 `;

export const resolvers = {
  Query: {
    async patron(parent, args, context) {
      return {};
    },
  },
};
