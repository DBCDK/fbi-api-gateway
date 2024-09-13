/**
 * @file This file handles CULR interactions e.g. get, create, delete
 *
 */

export const typeDef = `

type CulrQuery {

  """
  Bibliotek.dk specific culr query fields
  """
  bibdk: BibdkCulrQueryFields!
}


type CulrMutate {
  
  """
  Bibliotek.dk specific culr mutation fields
  """
  bibdk: BibdkCulrMutationFields!
}

extend type Mutation {
  culr: CulrMutate!
}

extend type Query {
  culr: CulrQuery!
}
 `;

export const resolvers = {
  Mutation: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  Query: {
    async culr(parent, args, context, info) {
      return {};
    },
  },

  CulrMutate: {
    async bibdk(parent, args, context, info) {
      return {};
    },
  },

  CulrQuery: {
    async bibdk(parent, args, context, info) {
      return {};
    },
  },
};
