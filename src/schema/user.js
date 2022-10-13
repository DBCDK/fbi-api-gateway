/**
 * @file Profile type definition and resolvers
 *
 */

import { resolveManifestation } from "../utils/utils";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String!
  address: String
  postalCode: String
  mail: String
  culrMail: String
  agency(language: LanguageCode): BranchResult!
  orders: [Order!]!
  loans: [Loan!]!
  debt: [Debt!]!
}
type Loan {
  dueDate:	DateTime!
  loanId:	String!
  manifestation: Manifestation!
}
enum OrderStatus {
  ACTIVE
  IN_PROCESS
  AVAILABLE_FOR_PICKUP
  EXPIRED
  REQUESTED_VIA_ILL
  AT_RESERVATION_SHELF
  UNKNOWN
}
type Order {
  orderId: String!,
  status: OrderStatus!
  pickUpBranch: Branch!
  orderDate: DateTime!
  pickUpExpiryDate: DateTime!
  manifestation: Manifestation!
}
type Debt {
  amount: String!
  creator: String
  currency: String
  date: DateTime
  title: String
}
`;

function isEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  User: {
    async name(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.name;
    },
    async address(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.address;
    },
    async debt(parent, args, context, info) {
      const res = await context.datasources.getLoader("debt").load({
        accessToken: context.accessToken,
      });
      return res.debt;
    },
    async loans(parent, args, context, info) {
      const res = await context.datasources.getLoader("loans").load({
        accessToken: context.accessToken,
      });
      return res.loans;
    },
    async orders(parent, args, context, info) {
      const res = await context.datasources.getLoader("orders").load({
        accessToken: context.accessToken,
      });
      return res.orders;
    },
    async postalCode(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });

      return res.postalCode;
    },
    async mail(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      return res.mail;
    },
    async culrMail(parent, args, context, info) {
      const resUserInfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      const agencyWithEmail =
        resUserInfo.attributes &&
        resUserInfo.attributes.agencies &&
        resUserInfo.attributes.agencies.find((agency) =>
          isEmail(agency && agency.userId)
        );

      return agencyWithEmail && agencyWithEmail.userId;
    },
    async agency(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load({
        accessToken: context.accessToken,
      });
      const digitalAccessSubscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      const infomediaSubscriptions = await context.datasources
        .getLoader("idp")
        .load("");
      return await context.datasources.getLoader("library").load({
        agencyid: res.agency,
        language: parent.language,
        limit: 100,
        status: args.status || "ALLE",
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
        digitalAccessSubscriptions,
        infomediaSubscriptions,
      });
    },
  },
  Loan: {
    manifestation(parent, args, context, info) {
      return resolveManifestation(
        { pid: `870970-basis:${parent.titleId}` },
        context
      );
    },
  },
  Order: {
    manifestation(parent, args, context, info) {
      return resolveManifestation(
        { pid: `870970-basis:${parent.titleId}` },
        context
      );
    },
    async pickUpBranch(parent, args, context, info) {
      const res = await context.datasources.getLoader("branch").load({
        branchId: parent.pickUpAgency,
        accessToken: context.accessToken,
      });
      return res[0];
    },
    status(parent, args, context, info) {
      // Map status to enum
      // https://openuserstatus.addi.dk/2.0/openuserstatus.xsd#orderStatusType
      return (
        {
          Active: "ACTIVE",
          "In process": "IN_PROCESS",
          "Available for pickup": "AVAILABLE_FOR_PICKUP",
          Expired: "EXPIRED",
          "Requested via ill": "REQUESTED_VIA_ILL",
          "At reservation shelf": "AT_RESERVATION_SHELF",
        }[parent.status] || "UNKNOWN"
      );
    },
  },
};
