/**
 * @file libraries type definition and resolvers
 *
 */

export const typeDef = `
  type Library {
    agencies: [Branch!]
  }
  type Branch{
    agencyId: String!
    branchId: String!
    branchName: [String!]
    openingHours: [String!]
  }`;

export const resolvers = {
  Library: {
    agencies(parent, args, context, info) {
      return context.datasources.library.load(parent);
    }
  },
  Branch: {
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    branchId(parent, args, context, info){
      return parent.branchId;
    },
    branchName(parent, args, context, info){
      return parent.branchName;
    },
    openingHours(parent, args, context, info){
      return parent.openingHours;
    }
  },
};



