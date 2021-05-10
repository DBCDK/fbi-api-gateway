/**
 * @file libraries type definition and resolvers
 *
 */

export const typeDef = `
  type Library {
    branches: [Branch!]
  }
  type Branch{
    agencyId: String!
    branchId: String!
    name: String!
    openingHours: String
    postalAddress: String
    postalCode: String
    city: String
  }`;

export const resolvers = {
  Library: {
    async branches(parent, args, context, info) {
      return (await context.datasources.library.load(parent)).map((branch) => ({
        ...branch,
        language: parent.language || "da",
      }));
    },
  },
  Branch: {
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    name(parent, args, context, info) {
      // first item is danish
      // second item is english
      return (
        parent.branchName[parent.language === "da" ? 0 : 1] ||
        parent.branchName[0]
      );
    },
    openingHours(parent, args, context, info) {
      // first item is danish
      // second item is english
      if (!parent.openingHours) {
        return null;
      }
      return (
        parent.openingHours[parent.language === "da" ? 0 : 1] ||
        parent.openingHours[0]
      );
    },
  },
};
