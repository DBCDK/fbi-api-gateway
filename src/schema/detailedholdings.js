/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type DetailedHoldings {
  count: Int!
  branchId: String
  holdingStatus: [Status]
}
type Status{
  branch: String
  branchId: String
  willLend: String
  expectedDelivery: String
  localHoldingsId: String
  circulationRule: String
  department: String
  issueId: String
  issueText: String
  location: String
  note: String
  readyForLoan: String
  status: String
  subLocation: String
}`;

export const resolvers = {
  DetailedHoldings: {
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
  Status: {
    branch(parent, args, context, info) {
      return parent.branch;
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    willLend(parent, args, context, info) {
      return parent.willLend;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery;
    },
    localHoldingsId(parent, args, context, info) {
      return parent.localHoldingsId;
    },
    circulationRule(parent, args, context, info) {
      return parent.circulationRule;
    },
    department(parent, args, context, info) {
      return parent.department;
    },
    issueId(parent, args, context, info) {
      return parent.issueId;
    },
    issueText(parent, args, context, info) {
      return parent.issueText;
    },
    location(parent, args, context, info) {
      return parent.location;
    },
    note(parent, args, context, info) {
      return parent.note;
    },
    readyForLoan(parent, args, context, info) {
      return parent.readyForLoan;
    },
    status(parent, args, context, info) {
      return parent["status"];
    },
    subLocation(parent, args, context, info) {
      return parent.subLocation;
    },
  },
};
