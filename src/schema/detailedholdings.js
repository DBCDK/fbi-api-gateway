/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type detailedHoldings {
  count: Int!
  branchId: String
  holdingStatus: [status]
}
type status{
  willLend: String
  expectedDelivery: String
  localHoldingsId: String
}`;

export const resolvers = {
  detailedHoldings: {
    count(parent, args, context, info) {
      return parent.count;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    holdingStatus(parent, args, context, info) {
      return parent.holdingstatus;
    },
  },
  status: {
    willLend(parent, args, context, info) {
      return parent.willLend;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery;
    },
    localHoldingsId(parent, args, context, info) {
      return parent.localHoldingsId;
    },
  },
};
