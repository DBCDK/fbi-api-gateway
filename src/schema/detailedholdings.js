/**
 * Localizations + HoldingsItem type definitions
 */
export const typeDef = `
type Lamp{
  color:String
  message: String
}
type DetailedHoldings {
  count: Int!
  branchId: String
  expectedDelivery: String
  agencyHoldings: [AgencyHolding]
  holdingItems: [Status]
  lamp: Lamp
}
type AgencyHolding{
  localisationPid: String
  localIdentifier: String
  agencyId: String
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
    holdingItems(parent, args, context, info) {
      //console.log(parent, "HOLDINGSITEMS PARENT");

      // .. this on is empty
      return parent.agencyHoldings;
    },
    expectedDelivery(parent, args, context, info) {
      // return newest delivery date
      return new Date().toJSON().slice(0, 10).replace(/-/g, "/");
    },
    lamp(parent, args, context, info) {
      let statusobject = { message: "no_loc_no_holding", color: "none" };
      //check if there are any localizations at all
      if (parent.holdingsitems === null && parent.holdingstatus.length < 1) {
        // no localizations - we can do nothing
        return statusobject;
      }
      // branch has no holding - there are localizations in agency
      if (parent.holdingstatus.length < 1) {
        return { message: "loc_no_holding", color: "yellow" };
      }
      // branch has holding - check status
      // if we find a 'green' lamp all is good
      // yellow is second best
      parent.holdingstatus.every((hold) => {
        if (hold.status === "OnShelf") {
          statusobject = { message: "loc_holding", color: "green" };
          // break every loop
          return false;
        }
        if (hold.status === "OnLoan") {
          statusobject = {
            message: "loc_no_hold_expect",
            color: "yellow",
          };
        }
        if (hold.status === "NotForLoan") {
          // we will rather return yellow than red
          if (statusobject.color !== "yellow") {
            statusobject = { message: "loc_hold_no_loan", color: "red" };
          }
        }
        // continue every loop
        return true;
      });

      return statusobject;
    },
  },
  AgencyHolding: {
    localisationPid(parent, args, context, info) {
      return parent.localisationPid;
    },
    localIdentifier(parent, args, context, info) {
      return parent.localIdentifier;
    },
    agencyId(parent, args, context, info) {
      return parent.agency;
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
      return parent.policy;
    },
    expectedDelivery(parent, args, context, info) {
      return parent.expectedDelivery;
    },
    localHoldingsId(parent, args, context, info) {
      return parent.localItemId;
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
