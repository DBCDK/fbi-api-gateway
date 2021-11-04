/**
 * The SuggestResponse and SuggestRow type definition
 */
export const typeDef = `
type Localizations {
  count: Int
  Items: [HoldingsItem]
}
type HoldingsItem {
  localisationPid: String
  agencyId: String
  codes: String
  localIdentifier: String
}`;

export const resolvers = {
  HoldingsItem: {
    localisationPid(parent, args, context, info) {
      return parent.agencyName || "";
    },
  },
};
