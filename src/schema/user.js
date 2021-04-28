/**
 * @file Profile type definition and resolvers
 *
 */

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String!
  address: String
  postalCode: String
  mail: String
  agency(language: LanguageCode): Library!
  orders: [Order!]!
  loans: [Loan!]!
  debt: [Debt!]!
}
type Loan {
  dueDate:	DateTime!
  loanId:	String!
  manifestation: WorkManifestation!
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
  manifestation: WorkManifestation!
}
type Debt {
  amount: String!
  creator: String
  currency: String
  date: DateTime
  title: String
}
`;

/**
 * Resolvers for the Profile type
 */
export const resolvers = {
  User: {
    async name(parent, args, context, info) {
      const res = await context.datasources.user.load({
        accessToken: context.accessToken,
      });
      return res.name;
    },
    async address(parent, args, context, info) {
      const res = await context.datasources.user.load({
        accessToken: context.accessToken,
      });
      return res.address;
    },
    async debt(parent, args, context, info) {
      const res = await context.datasources.debt.load({
        accessToken: context.accessToken,
      });
      return res.debt;
    },
    async loans(parent, args, context, info) {
      const res = await context.datasources.loans.load({
        accessToken: context.accessToken,
      });
      return res.loans;
    },
    async orders(parent, args, context, info) {
      const res = await context.datasources.orders.load({
        accessToken: context.accessToken,
      });
      return res.orders;
    },
    async postalCode(parent, args, context, info) {
      const res = await context.datasources.user.load({
        accessToken: context.accessToken,
      });
      return res.postalCode;
    },
    async mail(parent, args, context, info) {
      const res = await context.datasources.user.load({
        accessToken: context.accessToken,
      });
      return res.mail;
    },
    async agency(parent, args, context, info) {
      const res = await context.datasources.user.load({
        accessToken: context.accessToken,
      });
      return {
        agencyid: res.agency,
        accessToken: context.accessToken,
        language: args.language,
      };
    },
  },
  Loan: {
    manifestation(parent, args, context, info) {
      return { id: `870970-basis:${parent.titleId}` };
    },
  },
  Order: {
    manifestation(parent, args, context, info) {
      return { id: `870970-basis:${parent.titleId}` };
    },
    async pickUpBranch(parent, args, context, info) {
      const res = await context.datasources.branch.load({
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
