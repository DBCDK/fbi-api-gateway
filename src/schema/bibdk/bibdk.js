/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

export const typeDef = `
    type BibdkMutate {
        culr: BibdkCulrMutationFields!
    }

    type BibdkQuery {
        culr: BibdkCulrQueryFields!
    }

    extend type Mutation {
        bibdk: BibdkMutate!
    }

    extend type Query {
        bibdk: BibdkQuery!
    }
 `;

export const resolvers = {
  Mutation: {
    async bibdk(parent, args, context, info) {
      return {};
    },
  },

  Query: {
    async bibdk(parent, args, context, info) {
      return {};
    },
  },

  BibdkMutate: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  BibdkQuery: {
    async culr(parent, args, context, info) {
      return {};
    },
  },
};
