/**
 * @file libraries type definition and resolvers
 *
 */
import { orderBy } from "lodash";
import { resolveBorrowerCheck } from "../utils/utils";
import getUserBorrowerStatus from "../utils/getUserBorrowerStatus";
import isEmpty from "lodash/isEmpty";
export const typeDef = `
  enum LibraryStatus {
    SLETTET
    AKTIVE
    ALLE
    USYNLIG
  }  
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
  enum AgencyType {
    ALLE
    SKOLEBIBLIOTEK,
    FOLKEBIBLIOTEK,
    FORSKNINGSBIBLIOTEK,
    ANDRE
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
    agencyType: AgencyType!
    name: String!
    openingHours: String
    postalAddress: String
    postalCode: String
    userParameters: [UserParameter!]!
    orderPolicy(pid:String, pids: [String!]!): CheckOrderPolicy @complexity(value: 5, multipliers: ["pids"])
    city: String
    pickupAllowed: Boolean!
    highlights: [Highlight!]!
    infomediaAccess: Boolean!
    digitalCopyAccess: Boolean!
    userStatusUrl: String
    holdingStatus(pids:[String]): DetailedHoldings @complexity(value: 5, multipliers: ["pids"])
    branchWebsiteUrl: String
    branchCatalogueUrl: String
    lookupUrl: String

     """
    When user is not logged in, this is null
    Otherwise true or false
    """
    userIsBlocked: Boolean @deprecated(reason: "Use 'BranchResult.borrowerStatus' instead")
  }
  
  type BranchResult{
    hitcount: Int!
    borrowerStatus: BorrowerStatus
    result: [Branch!]!
    agencyUrl: String
  }

  """
    Indicates if user is blocked for a given agency or 
    if user does no longer exist on agency - relevant for FFU biblioteker since they dont update CULR
    """
  type BorrowerStatus{
    allowed: Boolean!
    statusCode: String!
  }

  type Highlight{
    key: String!
    value: String!
  }
  `;

export const resolvers = {
  // @see root.js for datasource::load
  Branch: {
    async userIsBlocked(parent, args, context, info) {
      const userInfo = await context.datasources.getLoader("userinfo").load({
        accessToken: context.accessToken,
      });
      return userInfo?.attributes?.blocked;
    },
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

    userStatusUrl(parent, args, context, info) {
      return parent.userStatusUrl || parent.branchWebsiteUrl || "";
    },

    branchWebsiteUrl(parent, args, context, info) {
      return parent.branchWebsiteUrl;
    },

    branchCatalogueUrl(parent, args, context, info) {
      return parent.branchCatalogueUrl || "";
    },
    lookupUrl(parent, args, context, info) {
      return parent.lookupUrl || "";
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
      const res = await context.datasources
        .getLoader("vipcore_UserOrderParameters")
        .load(parent.agencyId);

      const userParameters = res.userParameter || [];

      // These parameters are special as they describe what goes in the userId
      const userIdTypes = ["cpr", "barcode", "cardno", "customId"];

      // Find the userId type, exactly one will be used
      const userIdType = userParameters.find(
        (parameter) =>
          userIdTypes.includes(parameter.userParameterType) &&
          parameter.parameterRequired
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
      const { pids } = args;

      return await context.datasources.getLoader("checkorder").load({
        pickupBranch: parent.branchId,
        pids: !isEmpty(pids) ? pids : [],
      });
    },
    pickupAllowed(parent, args, context, info) {
      return !!parent.pickupAllowed;
    },
    async infomediaAccess(parent, args, context, info) {
      const response = await context.datasources.getLoader("idp").load("");
      return !!response[parent.agencyId];
    },
    async digitalCopyAccess(parent, args, context, info) {
      const subscriptions = await context.datasources
        .getLoader("statsbiblioteketSubscribers")
        .load("");
      return !!subscriptions[parent.agencyId];
    },
    /**
     * Holding status does a number of calls to external services.
     * localisationRequest (openHoldingStatus - see localizations.datasource.js) : to get localizations (agencies where material is located)
     * detailedHoldingsRequest (openHoldingStatus - see detailedholdings.datasource.js): to get detail for a localization (can the material
     *  be borrowed? - is the material home ? when is the expected delivery date ?)
     * holdingitems (see holdingsitems.datasource.js): to get additional information (which branch is the material located at? shelf? etc.)
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
      const localizations = await context.datasources
        .getLoader("localizations")
        .load({
          pids: args.pids,
        });

      // find local holdings for this agency - we use Array.find - there is only one
      // most branches has holdings on agency level
      const agencyHoldings =
        localizations.agencies &&
        localizations.agencies.find((lok) => lok.agencyId === parent.agencyId);
      // some libraries has their own 'agency' - like universities - so here we search
      // on branchId
      const uniHoldings =
        localizations.agencies &&
        localizations.agencies.find((lok) => lok.agencyId === parent.branchId);
      // combine agencyHoldings and uniHoldings
      const localHoldings = { ...uniHoldings, ...agencyHoldings };
      const localids =
        localHoldings &&
        localHoldings.holdingItems &&
        localHoldings.holdingItems.map((item) => ({
          localIdentifier: item.localIdentifier,
          localisationPid: item.localizationPid,
          agency: item.agencyId,
        }));
      if (!localids) {
        // there are no localizations - no library has the material - eg. digital
        // ressource - make an answer for detailedHoldings to handle.
        return { holdingstatus: [], holdingsitems: null };
      }

      // check - localids are ok ! :)

      // get detailed holdings from openholdingsstatus.
      const detailedHoldings = await context.datasources
        .getLoader("detailedholdings")
        .load({
          localIds: localids,
          agencyId: parent.agencyId,
        });

      /** START HOLDING ITEMS **/
      let holdingsitems;
      try {
        // get holdingitems
        holdingsitems = await context.datasources
          .getLoader("holdingsitems")
          .load({
            agencyId: parent.agencyId,
            branchId: parent.branchId,
            pids: args.pids,
          });
      } catch (e) {
        holdingsitems = null;
      }

      const mergedholdings = [];
      holdingsitems?.completeItems &&
        detailedHoldings.holdingstatus.forEach((detail) => {
          // A localHoldingsId may look like this "09056769_(number)June (318)_(volume)_(year)2006"
          // We need the faust in order to compare with bibliographicRecordId
          const localHoldingsId = detail.localHoldingsId?.split("_")?.[0];
          const locals = holdingsitems?.completeItems?.filter(
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

      /** END HOLDING ITEMS **/
      const branchHolding = mergedholdings.filter(
        (hold) => hold.branchId === parent.branchId
      );

      // replace detailHoldings.holdingstatus with the merged holdings
      return {
        ...detailedHoldings,
        holdingstatus: branchHolding,
        agencyHoldings: localids,
      };
    },
  },
  BranchResult: {
    hitcount(parent, args, context, info) {
      return parent.hitcount;
    },
    result(parent, args, context, info) {
      return parent.result;
    },
    async borrowerStatus(parent, args, context, info) {
      const { status, statusCode } = await getUserBorrowerStatus(
        { agencyId: parent.result[0].agencyId },
        context
      );
      return {
        allowed: status,
        statusCode,
      };
    },
    agencyUrl(parent, args, context, info) {
      return (
        parent?.result[0]?.userStatusUrl ||
        parent?.result[0]?.branchWebsiteUrl ||
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
