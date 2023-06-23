/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type Localizations {
  count: Int
  agencies: [holdingAgency] @complexity(value: 50)
}
type holdingAgency{
  agencyId: String
  holdingItems: [holdingsItem] @complexity(value: 50)
}
type holdingsItem {
  localizationPid: String
  codes: String
  localIdentifier: String
}`;

export const resolvers = {
  Localizations: {
    count(parent, args, context, info) {
      return parent.count;
    },
    agencies(parent, args, context, info) {
      return parent.agencies;
    },
  },
  holdingAgency: {
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    holdingItems(parent, args, context, info) {
      return parent.holdingItems;
    },
  },
  holdingsItem: {
    localizationPid(parent, args, context, info) {
      return parent.localizationPid;
    },

    codes(parent, args, context, info) {
      return parent.codes || "";
    },
    localIdentifier(parent, args, context, info) {
      return parent.localIdentifier;
    },
  },
};
