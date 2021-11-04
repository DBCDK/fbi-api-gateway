/**
 * The SuggestResponse and SuggestRow type definition
 */
export const typeDef = `
type Localizations {
  count: Int
  HoldingItems: [HoldingsItem]
}
type HoldingsItem {
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
  HoldingsItem: {
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
