/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type Localizations {
  count: Int!
  HoldingItems: [holdingsItem]
}
type holdingsItem {
  localizationPid: String
  agencyId: String
  codes: String
  localIdentifier: String
}`;

export const resolvers = {
  Localizations: {
    count(parent, args, context, info) {
      return parent.count;
    },
    HoldingItems(parent, args, context, info) {
      return parent.holdingItems;
    },
  },
  holdingsItem: {
    localizationPid(parent, args, context, info) {
      return parent.localisationPid;
    },
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    codes(parent, args, context, info) {
      return parent.codes || "";
    },
    localIdentifier(parent, args, context, info) {
      return parent.localIdentifier;
    },
  },
};
