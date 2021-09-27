/**
 * @file libraries type definition and resolvers
 *
 */

import { orderBy, sortedUniqBy, uniqBy } from "lodash";

export const typeDef = `  
  enum VipUserParameter {
    cpr
    userId
    barcode
    cardno
    customId
    userDateOfBirth
    userName
    userAddress
    userMail
    userTelephone
  }
  type UserParameter {
    userParameterType: VipUserParameter!
    parameterRequired: Boolean!
    description: String
  }
  type Branch{
    """Whether this branch's agency supports borrowerCheck"""
    borrowerCheck: Boolean!
    agencyName: String
    agencyId: String!
    branchId: String!
    name: String!
    openingHours: String
    postalAddress: String
    postalCode: String
    userParameters: [UserParameter!]!
    orderPolicy(pid:String!): CheckOrderPolicy
    city: String
    pickupAllowed: Boolean!
    highlights: [Highlight!]!
    infomediaAccess: Boolean!
    digitalCopyAccess: Boolean!
  }
  
  type BranchResult{
    hitcount: Int!
    result: [Branch!]!
  }

  type Highlight{
    key: String!
    value: String!
  }
  `;

export const resolvers = {
  // @see root.js for datasource::load
  Branch: {
    async borrowerCheck(parent, args, context, info) {
      // returns true if login.bib.dk is supported
      if (!parent.agencyId) {
        return false;
      }
      const res = await context.datasources.vipcore_UserOrderParameters.load(
        parent.agencyId
      );
      if (
        res.agencyParameters &&
        res.agencyParameters.borrowerCheckParameters
      ) {
        return !!res.agencyParameters.borrowerCheckParameters.find(
          ({ borrowerCheckSystem, borrowerCheck }) =>
            borrowerCheckSystem === "login.bib.dk" && borrowerCheck
        );
      }
      return false;
    },
    agencyName(parent, args, context, info) {
      return parent.agencyName || "";
    },
    agencyId(parent, args, context, info) {
      return parent.agencyId || "";
    },
    branchId(parent, args, context, info) {
      return parent.branchId;
    },
    highlights(parent, args, context, info) {
      if (!parent.highlights) {
        return [];
      }

      return Object.entries(parent.highlights)
        .map(([key, value]) => ({
          key,
          value,
        }))
        .filter((highlight) => highlight.value.includes("<mark>"));
    },
    name(parent, args, context, info) {
      // first item is danish
      // second item is english
      return (
        parent.branchName[parent.language === "da" ? 0 : 1] ||
        parent.branchName[0]
      );
    },
    openingHours(parent, args, context, info) {
      // first item is danish
      // second item is english
      if (!parent.openingHours) {
        return null;
      }
      return (
        parent.openingHours[parent.language === "da" ? 0 : 1] ||
        parent.openingHours[0]
      );
    },
    /**
     * This resolver fetches user parameters from vip-core
     * These parameters describe what user info needs to be sent to openorder
     * for a specific agency. Unfortunately, we have to do some work (with regards
     * to the userIdType) to make the response easy to use for frontends, and
     * make it easier to submit orders (openorder).
     *
     */
    async userParameters(parent, args, context, info) {
      if (!parent.agencyId) {
        return [];
      }

      // Fetch from vip-core
      const res = await context.datasources.vipcore_UserOrderParameters.load(
        parent.agencyId
      );
      const userParameters = res.userParameter || [];

      // These parameters are special as they describe what goes in the userId
      const userIdTypes = ["cpr", "barcode", "cardno", "customId"];

      // Find the userId type, exactly one will be used
      const userIdType = userParameters.find((parameter) =>
        userIdTypes.includes(parameter.userParameterType)
      ) || { userParameterType: "userId" };

      // We force some parameters to be required (for bibdk)
      let result = [
        { ...userIdType, parameterRequired: true },
        {
          userParameterType: "userName",
          parameterRequired: true,
        },
        {
          userParameterType: "userMail",
          parameterRequired: true,
        },
      ];

      // The preferred order of parameters
      const order = {
        cpr: 0,
        userId: 1,
        barcode: 2,
        cardno: 3,
        customId: 4,
        userName: 6,
        userDateOfBirth: 7,
        userAddress: 8,
        userMail: 9,
        userTelephone: 10,
      };

      // These are the forced parameters, and should not be repeated
      const duplicates = [...userIdTypes, "userId", "userName", "userMail"];

      // Combine forced parameters with the rest and set order property
      result = [
        ...result,
        ...userParameters.filter(
          (parameter) =>
            Object.keys(order).includes(parameter.userParameterType) &&
            !duplicates.includes(parameter.userParameterType)
        ),
      ].map((parameter) => {
        // in rare cases there is a description available
        // and it may be available in danish or english
        let description =
          res[`${parameter.userParameterType}Txt`] &&
          (res[`${parameter.userParameterType}Txt`].find((description) =>
            description.language.includes(parent.language)
          ) ||
            res[`${parameter.userParameterType}Txt`][0]);
        return {
          ...parameter,
          description: description && description.value,
          order: order[parameter.userParameterType],
        };
      });

      // Order result and return
      return orderBy(result, "order");
    },
    async orderPolicy(parent, args, context, info) {
      return await context.datasources.checkorder.load({
        pickupBranch: parent.branchId,
        pid: args.pid,
      });
    },
    pickupAllowed(parent, args, context, info) {
      return !!parent.pickupAllowed;
    },
    async infomediaAccess(parent, args, context, info) {
      const response = await context.datasources.idp.load({
        pickupBranch: parent.agencyId,
      });

      let inResponse = response.find(
        (agency) => agency.agencyId === parent.agencyId
      );

      return !!inResponse;
    },
    async digitalCopyAccess(parent, args, context, info) {
      const subscriptions = await context.datasources.statsbiblioteketSubscribers.load(
        ""
      );
      return !!subscriptions[parent.agencyId];
    },
  },
  BranchResult: {
    hitcount(parent, args, context, info) {
      return parent.hitcount;
    },
    result(parent, args, context, info) {
      return parent.result;
    },
  },
  Highlight: {
    key(parent, args, context, info) {
      return parent.key;
    },
    value(parent, args, context, info) {
      return parent.value;
    },
  },
};
