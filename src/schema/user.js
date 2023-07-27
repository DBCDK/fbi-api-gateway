/**
 * @file Profile type definition and resolvers
 *
 */

import {
  filterDuplicateAgencies,
  getHomeAgencyAccount,
  resolveManifestation,
} from "../utils/utils";

/**
 * The Profile type definition
 */
export const typeDef = `
type User {
  name: String!
  agencies(language: LanguageCode): [BranchResult!]!
  agency(language: LanguageCode): BranchResult!
  address: String
  postalCode: String
  municipalityAgencyId: String
  mail: String
  culrMail: String
  country: String
  orders: [Order!]! @complexity(value: 5)
  loans: [Loan!]! @complexity(value: 5)
  debt: [Debt!]! @complexity(value: 3)
}
type Loan {
  dueDate:	DateTime!
  loanId:	String!
  agencyId: String!
  edition: String
  pages: String
  publisher: String
  language: String
  manifestation: Manifestation
  materialType: String
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
  orderType: String
  status: OrderStatus!
  pickUpBranch: Branch!
  agencyId: String!
  holdQueuePosition: String
  orderDate: DateTime!
  creator: String
  title: String
  pickUpExpiryDate: DateTime
  manifestation: Manifestation
  edition: String
  language: String
  pages: String
  materialType: String
}
type Debt {
  amount: String!
  agencyId: String!
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
      const res = await context.datasources.getLoader("user").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res?.name;
    },
    async address(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res?.address;
    },
    async municipalityAgencyId(parent, args, context, info) {
      const userinfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      return userinfo?.attributes?.municipalityAgencyId;
    },
    async debt(parent, args, context, info) {
      const res = await context.datasources.getLoader("debt").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res;
    },
    async loans(parent, args, context, info) {
      const res = await context.datasources.getLoader("loans").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res;
    },
    async orders(parent, args, context, info) {
      const res = await context.datasources.getLoader("orders").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res;
    },
    async postalCode(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res?.postalCode;
    },
    async mail(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res?.mail;
    },
    async country(parent, args, context, info) {
      const res = await context.datasources.getLoader("user").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      return res?.country;
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
      /**
       * @TODO
       * Align agency and agencies properly
       * Discuss the intended usage of these fields
       */
      const userinfo = await context.datasources.getLoader("userinfo").load(
        {
          accessToken: context.accessToken,
        },
        context
      );
      const homeAgency = getHomeAgencyAccount(userinfo);

      return await context.datasources.getLoader("library").load({
        agencyid: homeAgency.agencyId,
        language: parent.language,
        limit: 100,
        status: args.status || "ALLE",
        bibdkExcludeBranches: args.bibdkExcludeBranches || false,
      });
    },
    async agencies(parent, args, context, info) {
      /**
       * @TODO
       * Align agency and agencies properly
       * Discuss the intended usage of these fields
       */
      const userinfo = await context.datasources.getLoader("userinfo").load(
        {
          accessToken: context.accessToken,
        },
        context
      );

      const agencies = filterDuplicateAgencies(
        userinfo?.attributes?.agencies
      )?.map((account) => account.agencyId);

      const agencyInfos = await Promise.all(
        agencies.map(
          async (agency) =>
            await context.datasources.getLoader("library").load({
              agencyid: agency,
              language: parent.language,
              limit: 20,
              status: args.status || "ALLE",
              bibdkExcludeBranches: args.bibdkExcludeBranches || false,
            })
        )
      );

      return agencyInfos;
    },
  },
  Loan: {
    manifestation(parent, args, context, info) {
      return resolveManifestation({ faust: parent.titleId }, context);
    },
  },
  Order: {
    manifestation(parent, args, context, info) {
      return resolveManifestation({ faust: parent.titleId }, context);
    },
    async pickUpBranch(parent, args, context, info) {
      const libraries = await context.datasources.getLoader("library").load({
        branchId: parent.pickUpAgency?.replace(/\D/g, ""),
      });

      return libraries?.result?.[0];
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
