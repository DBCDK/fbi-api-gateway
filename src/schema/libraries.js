/**
 * @file libraries type definition and resolvers
 *
 */

import { orderBy, sortedUniqBy, uniqBy } from "lodash";
import { resolveBorrowerCheck } from "../utils/utils";

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
    userStatusUrl: String
    holdingStatus(pids:[String]): DetailedHoldings
    branchWebsiteUrl: String
  }
  
  type BranchResult{
    hitcount: Int!
    result: [Branch!]!
    agencyUrl: String
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
      return await resolveBorrowerCheck(parent.agencyId, context);
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
    userStatusUrl(parent, args, context, info) {
      return parent.userStatusUrl || parent.branchWebsiteUrl || "";
    },

    branchWebsiteUrl(parent, args, context, info) {
      return parent.branchWebsiteUrl;
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
      let result = [{ ...userIdType, parameterRequired: true }];

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
      const duplicates = [...userIdTypes, "userId"];

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
          (res[`${parameter.userParameterType}Txt`].find(
            (description) =>
              description.language &&
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
    /**
     * Holding status does a number of calls to external services.
     * localisationRequest (openHoldingStatus - see localizations.datasource.js) : to get localizations (agencies where material is located)
     * detailedHoldingsRequest (openHoldingStatus - see detailedholdings.datasource.js): to get detail for a localization (can the material
     *  be borrowed? - is the material home ? when is the expected delivery date ?)
     * holdingitems (openplatform - see holdingsitems.datasource.js): to get additional information (which branch is the material located at? shelf? etc.)
     *
     * It returns a merge af the information gathered (schema/detailedholdings.js)
     *
     * @param parent
     * @param args
     * @param context
     * @param info
     * @return {Promise<{count: string}|*>}
     */
    async holdingStatus(parent, args, context, info) {
      // get localizations from openholdingstatus
      const localizations = await context.datasources.localizations.load({
        pids: args.pids,
      });

      // find local holdings for this agency - we use Array.find - there is only one
      const localHoldings =
        localizations.agencies &&
        localizations.agencies.find((lok) => lok.agencyId === parent.agencyId);

      const localids =
        localHoldings &&
        localHoldings.holdingItems &&
        localHoldings.holdingItems.map((item) => item.localIdentifier);

      if (!localids) {
        // there are no localizations - no library has the material - eg. digital
        // ressource - make an answer for detailedHoldings to handle.
        return { holdingstatus: [], holdingsitems: null };
      }
      // get detailed holdings from openholdingsstatus.
      const detailedHoldings = await context.datasources.detailedholdings.load({
        localIds: localids,
        agencyId: parent.agencyId,
      });

      // NOTICE .. if we are not allowed to use itemholdings -> remove next block
      // of code
      /** START HOLDING ITEMS **/
      let holdingsitems;
      try {
        // get holdingitems
        holdingsitems = await context.datasources.holdingsitems.load({
          accessToken: context.accessToken,
          pids: args.pids,
          agencyId: parent.agencyId,
        });
      } catch (e) {
        holdingsitems = null;
      }

      const mergedholdings = [];
      holdingsitems &&
        detailedHoldings.holdingstatus.forEach((detail) => {
          // A localHoldingsId may look like this "09056769_(number)June (318)_(volume)_(year)2006"
          // We need the faust in order to compare with bibliographicRecordId
          const localHoldingsId = detail.localHoldingsId?.split("_")?.[0];

          holdingsitems.forEach((item) => {
            const locals = item.holdingsitems.filter(
              (item) => item.bibliographicRecordId === localHoldingsId
            );
            if (locals) {
              locals.forEach((local) => {
                const merged = {
                  ...detail,
                  ...local,
                };
                mergedholdings.push(merged);
              });
            }
          });
        });

      /** END HOLDING ITEMS **/
      const branchHolding = mergedholdings.filter(
        (hold) => hold.branchId === parent.branchId
      );

      // replace detailHoldings.holdingstatus with the merged holdings
      return { ...detailedHoldings, holdingstatus: branchHolding };
    },
  },
  BranchResult: {
    hitcount(parent, args, context, info) {
      return parent.hitcount;
    },
    result(parent, args, context, info) {
      return parent.result;
    },
    agencyUrl(parent, args, context, info) {
      return (
        parent.result[0].userStatusUrl ||
        parent.result[0].branchWebsiteUrl ||
        ""
      );
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
