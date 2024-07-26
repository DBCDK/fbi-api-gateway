/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type Localizations {
  count: Int
  agencies: [HoldingAgency]
}
type HoldingAgency{
  agencyId: String
  holdingItems: [LocalizationsHoldingsItem]
}
type LocalizationsHoldingsItem {
  localizationPid: String
  codes: String
  localIdentifier: String
}
enum AvailabilityEnum {
  NOW
  LATER
  UNKNOWN  @fallback
}
`;

export const resolvers = {
  Localizations: {
    count(parent, args, context, info) {
      return parent.count;
    },
    agencies(parent, args, context, info) {
      return parent.agencies;
    },
  },
  HoldingAgency: {
    agencyId(parent, args, context, info) {
      return parent.agencyId;
    },
    holdingItems(parent, args, context, info) {
      return parent.holdingItems;
    },
  },
  LocalizationsHoldingsItem: {
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
