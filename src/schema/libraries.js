/**
 * @file libraries type definition and resolvers
 *
 */

export const typeDef = `
  type Library {
    branches: [Branch!]
    name: String
  }
  type Branch{
    agencyName: String
    agencyId: String!
    branchId: String!
    name: String!
    openingHours: String
    postalAddress: String
    postalCode: String
    orderPolicy(pid:String!): CheckOrderPolicy
    city: String
    pickupAllowed: Boolean!
  }`;

export const resolvers = {
  Library: {
    async branches(parent, args, context, info) {
      return (await context.datasources.library.load(parent)).map((branch) => ({
        ...branch,
        language: parent.language || "da",
      }));
    },
    async name(parent, args, context, info) {
      const branches = await context.datasources.library.load(parent);
      return branches && branches[0] && branches[0].agencyName;
    },
  },
  Branch: {
    agencyName(parent, args, context, info) {
      return parent.agencyName;
    },
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
    async orderPolicy(parent, args, context, info) {
      return await context.datasources.checkorder.load({
        pickupBranch: parent.branchId,
        pid: args.pid,
      });
    },
    pickupAllowed(parent, args, context, info) {
      return parent.pickupAllowed === "1";
    },
  },
};
